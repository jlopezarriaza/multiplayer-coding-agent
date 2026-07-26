import { Message, ToolExecution, AgentInfo } from '../src/types/index.js';
import { fileSystemStore, WORKSPACE_DIR } from './fileSystemStore.js';
import { githubService } from './githubService.js';
import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';
import { exec } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

export const AVAILABLE_AGENTS: AgentInfo[] = [
  {
    handle: '@gemini',
    name: 'Gemini Code Agent',
    roleDescription: 'Autonomous coding agent. Writes, executes, tests, and verifies code live in the workspace.',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=gemini&backgroundColor=6366f1',
    badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40',
    capabilities: ['view_file', 'create_file', 'edit_file', 'run_command', 'git_commit', 'search_code']
  },
  {
    handle: '@architect',
    name: 'Architect Agent',
    roleDescription: 'System design expert. Analyzes requirements, structures data flows, generates Mermaid diagrams.',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=architect&backgroundColor=06b6d4',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    capabilities: ['generate_diagram', 'view_file', 'search_code', 'write_spec']
  },
  {
    handle: '@reviewer',
    name: 'Code Reviewer Agent',
    roleDescription: 'Quality & security auditor. Reviews code changes, identifies edge cases and performance risks.',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=reviewer&backgroundColor=10b981',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    capabilities: ['review_diff', 'check_security', 'view_file']
  },
  {
    handle: '@debugger',
    name: 'Debugger Agent',
    roleDescription: 'Runtime & test diagnostic specialist. Traces errors, runs test scripts, fixes bugs, and verifies fixes.',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=debugger&backgroundColor=f43f5e',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    capabilities: ['diagnose_error', 'run_command', 'edit_file', 'view_file']
  }
];

class AgentQueueManager {
  private queues: Map<string, Promise<void>> = new Map();

  public enqueue<T>(agentHandle: string, task: () => Promise<T>): Promise<T> {
    const previous = this.queues.get(agentHandle) || Promise.resolve();

    let taskResult: T;
    const next = previous.then(async () => {
      taskResult = await task();
    }).catch(err => {
      console.error(`Error executing queued task for ${agentHandle}:`, err);
    });

    this.queues.set(agentHandle, next);

    return next.then(() => taskResult);
  }
}

export const agentQueueManager = new AgentQueueManager();

// AGY Built-in Tool Declarations for Gemini Function Calling
const AGY_TOOLS: FunctionDeclaration[] = [
  {
    name: 'view_file',
    description: 'Read the complete contents of a file in the shared workspace',
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: 'Relative path of file to read' }
      },
      required: ['path']
    }
  },
  {
    name: 'create_file',
    description: 'Create or overwrite a file in the shared workspace directory',
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: 'Relative file path (e.g. src/app.py)' },
        content: { type: Type.STRING, description: 'Complete file code content' }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'edit_file',
    description: 'Modify an existing file in the shared workspace by replacing a target string',
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: 'Relative file path' },
        target: { type: Type.STRING, description: 'Exact string snippet to replace' },
        replacement: { type: Type.STRING, description: 'New replacement string snippet' }
      },
      required: ['path', 'target', 'replacement']
    }
  },
  {
    name: 'run_command',
    description: 'Execute a terminal shell command in the workspace directory (e.g. python script.py, npm test, pytest)',
    parameters: {
      type: Type.OBJECT,
      properties: {
        command: { type: Type.STRING, description: 'Shell command string to execute' }
      },
      required: ['command']
    }
  },
  {
    name: 'git_commit',
    description: 'Commit current workspace file changes to Git version control',
    parameters: {
      type: Type.OBJECT,
      properties: {
        message: { type: Type.STRING, description: 'Git commit message describing changes' }
      },
      required: ['message']
    }
  },
  {
    name: 'generate_diagram',
    description: 'Generate an interactive Mermaid.js system architecture diagram',
    parameters: {
      type: Type.OBJECT,
      properties: {
        mermaid_spec: { type: Type.STRING, description: 'Valid Mermaid diagram syntax (graph TD ...)' }
      },
      required: ['mermaid_spec']
    }
  }
];

function executeRealShellCommand(command: string): Promise<string> {
  return new Promise((resolve) => {
    exec(command, { cwd: WORKSPACE_DIR, timeout: 15000 }, (error, stdout, stderr) => {
      let output = '';
      if (stdout) output += stdout.trim();
      if (stderr) output += (output ? '\n\n[STDERR]\n' : '') + stderr.trim();
      if (error) output += (output ? '\n\n[EXIT CODE ' + (error.code || 1) + ']\n' : '') + error.message;

      resolve(output.trim() || `Command '${command}' executed cleanly with 0 exit code.`);
    });
  });
}

function loadEnvKey(): string {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  try {
    const homedir = os.homedir();
    const envPaths = [
      path.join(homedir, '.env'),
      path.join(process.cwd(), '.env')
    ];

    for (const envPath of envPaths) {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        const match = content.match(/^GEMINI_API_KEY=(.*)$/m);
        if (match && match[1]) {
          return match[1].trim().replace(/^["']|["']$/g, '');
        }
      }
    }
  } catch (e) {
    // Ignore read errors
  }
  return '';
}

export class AgentEngine {
  private apiKey: string = loadEnvKey();

  public setApiKey(key: string) {
    this.apiKey = key;
  }

  public getApiKey(): string {
    if (!this.apiKey) {
      this.apiKey = loadEnvKey();
    }
    return this.apiKey;
  }

  public detectMentions(content: string): AgentInfo[] {
    const matched: AgentInfo[] = [];
    const textLower = content.toLowerCase();

    for (const agent of AVAILABLE_AGENTS) {
      if (textLower.includes(agent.handle.toLowerCase())) {
        matched.push(agent);
      }
    }

    return matched;
  }

  public processAgentResponse(
    agent: AgentInfo,
    userMessage: Message,
    conversationHistory: Message[],
    onUpdate: (partialMsg: Partial<Message>) => void
  ): Promise<Message> {
    return agentQueueManager.enqueue(agent.handle, () =>
      this.executeAgentTurn(agent, userMessage, conversationHistory, onUpdate)
    );
  }

  private async executeAgentTurn(
    agent: AgentInfo,
    userMessage: Message,
    conversationHistory: Message[],
    onUpdate: (partialMsg: Partial<Message>) => void
  ): Promise<Message> {
    const agentMessageId = `msg-agent-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const workspaceFiles = fileSystemStore.getAllFiles();
    const repos = githubService.getRepos();

    const messageState: Message = {
      id: agentMessageId,
      roomId: userMessage.roomId,
      sender: {
        id: `agent-${agent.handle.replace('@', '')}`,
        name: agent.name,
        avatar: agent.avatar,
        role: 'agent',
        handle: agent.handle,
        color: agent.badgeColor
      },
      content: '',
      timestamp: new Date().toISOString(),
      mentions: [agent.handle],
      toolExecutions: [],
      isStreaming: true
    };

    onUpdate(messageState);

    const activeKey = this.getApiKey();

    if (!activeKey) {
      messageState.content = `⚠️ **Gemini API Key Required**\n\nNo API key is configured for **${agent.handle}**. Click the **🔑 Set API Key** button in the top navbar or set the \`GEMINI_API_KEY\` environment variable to enable live LLM responses and tool execution.`;
      messageState.isStreaming = false;
      onUpdate(messageState);
      return messageState;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: activeKey });

      const fileContextSnippet = workspaceFiles.length > 0
        ? workspaceFiles.map(f => `--- FILE: ${f.path} ---\n${f.content.slice(0, 800)}`).join('\n\n')
        : '(Shared workspace directory is empty. Use create_file to initialize files.)';

      const systemPrompt = `You are ${agent.name} (${agent.handle}), an autonomous software engineering agent in a multiplayer collaborative coding session powered by Google Antigravity (AGY).
Your role: ${agent.roleDescription}
Connected Repositories: ${repos.map(r => `${r.owner}/${r.repo}`).join(', ') || 'None'}

Current Workspace Codebase:
${fileContextSnippet}

AUTONOMOUS AGENT DIRECTIVES:
1. You have tools: view_file, create_file, edit_file, run_command, git_commit, generate_diagram.
2. DO NOT just say what code to write — USE YOUR TOOLS to create files, execute scripts, check results, and fix any errors!
3. IMPORTANT: When using edit_file, ensure the target string matches existing file content EXACTLY. If edit_file fails, use view_file to check exact contents or use create_file to overwrite the file cleanly.
4. If a command fails or has a bug, inspect the error output, fix the file, and run_command again to verify the fix!
5. Explain your reasoning clearly and summarize the final verified results for the team.`;

      const recentChatSummary = conversationHistory
        .slice(-8)
        .map(m => `${m.sender.name} (${m.sender.role}): ${m.content}`)
        .join('\n');

      const userPrompt = `[Multiplayer Session History]\n${recentChatSummary}\n\n[User Request to ${agent.handle}]\n${userMessage.sender.name}: ${userMessage.content}`;

      const MAX_TURNS = 10;
      let currentTurn = 0;
      let conversationContents: any[] = [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
      ];

      const reasoningTraces: string[] = [];

      while (currentTurn < MAX_TURNS) {
        currentTurn++;

        const primaryModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
        let response;
        try {
          response = await ai.models.generateContent({
            model: primaryModel,
            contents: conversationContents,
            config: {
              tools: [{ functionDeclarations: AGY_TOOLS }]
            }
          });
        } catch (mErr: any) {
          const errMsg = mErr?.message || String(mErr);
          if (mErr?.status === 404 || errMsg.includes('404') || errMsg.includes('not found') || errMsg.includes('no longer available')) {
            console.warn(`⚠️ Model '${primaryModel}' unavailable (${errMsg.slice(0, 80)}...). Falling back to 'gemini-2.0-flash'...`);
            try {
              response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: conversationContents,
                config: {
                  tools: [{ functionDeclarations: AGY_TOOLS }]
                }
              });
            } catch (fallbackErr: any) {
              console.warn(`⚠️ Fallback to gemini-2.0-flash failed, trying 'gemini-1.5-flash'...`);
              response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: conversationContents,
                config: {
                  tools: [{ functionDeclarations: AGY_TOOLS }]
                }
              });
            }
          } else {
            throw mErr;
          }
        }

        const candidate = response.candidates?.[0];
        const parts = candidate?.content?.parts || [];
        const functionCalls = parts.filter(p => p.functionCall).map(p => p.functionCall!);

        const textResponse = response.text || '';
        if (textResponse) {
          messageState.content = textResponse;
          reasoningTraces.push(`Turn ${currentTurn}: ${textResponse}`);
        }

        if (functionCalls.length === 0) {
          break;
        }

        if (candidate?.content) {
          conversationContents.push(candidate.content);
        }

        const functionResponses: any[] = [];

        for (const fc of functionCalls) {
          if (!fc || !fc.name) continue;
          const toolName = fc.name as any;
          const args = (fc.args || {}) as Record<string, any>;

          const toolExec: ToolExecution = {
            id: `tool-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            toolName: toolName === 'create_file' || toolName === 'edit_file' ? 'write_file' : toolName,
            status: 'running',
            args
          };

          messageState.toolExecutions = [...(messageState.toolExecutions || []), toolExec];
          onUpdate(messageState);

          let toolResult = '';
          if (toolName === 'view_file') {
            const f = fileSystemStore.getFile(args.path);
            toolResult = f ? `Content of ${args.path}:\n${f.content}` : `File '${args.path}' not found in workspace`;
            toolExec.status = 'success';
          } else if (toolName === 'create_file') {
            fileSystemStore.updateFile(args.path, args.content, agent.name);
            toolResult = `Created/overwrote file '${args.path}' (${args.content.length} bytes)`;
            toolExec.status = 'success';
          } else if (toolName === 'edit_file') {
            const existing = fileSystemStore.getFile(args.path);
            if (!existing) {
              toolResult = `Error: File '${args.path}' not found in workspace. Use create_file to create it.`;
              toolExec.status = 'failed';
            } else if (!existing.content.includes(args.target)) {
              toolResult = `Error: Target string not found in '${args.path}'. Please use view_file to check exact contents or create_file to overwrite.`;
              toolExec.status = 'failed';
            } else {
              const oldContent = existing.content;
              const newContent = oldContent.replace(args.target, args.replacement);
              fileSystemStore.updateFile(args.path, newContent, agent.name);
              toolExec.diff = { path: args.path, oldContent: args.target, newContent: args.replacement };
              toolResult = `Successfully edited '${args.path}'`;
              toolExec.status = 'success';
            }
          } else if (toolName === 'run_command') {
            toolResult = await executeRealShellCommand(args.command);
            toolExec.status = 'success';
          } else if (toolName === 'git_commit') {
            const commit = fileSystemStore.createGitCommit(args.message, agent.name);
            toolResult = `Git commit ${commit.hash}: "${commit.message}" (${commit.filesChanged} files updated)`;
            toolExec.status = 'success';
          } else if (toolName === 'generate_diagram') {
            messageState.architectureDiagram = args.mermaid_spec;
            toolResult = `Generated Mermaid architecture diagram`;
            toolExec.status = 'success';
          }

          toolExec.result = toolResult;
          messageState.toolExecutions = [...messageState.toolExecutions!];
          onUpdate(messageState);

          functionResponses.push({
            name: fc.name,
            response: { output: toolResult }
          });
        }

        conversationContents.push({
          role: 'user',
          parts: functionResponses.map(fr => ({ functionResponse: fr }))
        });
      }

      if (reasoningTraces.length > 0) {
        messageState.reasoningTrace = reasoningTraces.join('\n');
      }

      const mermaidMatch = (messageState.content || '').match(/```mermaid([\s\S]*?)```/);
      if (mermaidMatch && mermaidMatch[1]) {
        messageState.architectureDiagram = mermaidMatch[1].trim();
      }

      messageState.isStreaming = false;
      onUpdate(messageState);
      return messageState;

    } catch (err: any) {
      console.error('Autonomous AGY Execution Error:', err);
      const errStr = err?.message || String(err);
      if (errStr.includes('leaked') || errStr.includes('API_KEY_INVALID') || errStr.includes('403')) {
        messageState.content = `🔑 **Gemini API Key Expired or Revoked**\n\nGoogle AI Studio automatically revoked the active API key because it was detected in git commit history or public logs.\n\n**To Fix:** Click the **🔑 Set API Key** (or **API Key Active**) button in the top navbar to enter a fresh Gemini API key!`;
      } else {
        messageState.content = `❌ **AGY Execution Error**: ${errStr}`;
      }
      messageState.isStreaming = false;
      onUpdate(messageState);
      return messageState;
    }
  }
}

export const agentEngine = new AgentEngine();
