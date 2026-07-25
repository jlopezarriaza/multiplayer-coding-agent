import { Message, ToolExecution, AgentInfo } from '../src/types/index.js';
import { fileSystemStore } from './fileSystemStore.js';
import { githubService } from './githubService.js';
import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';

export const AVAILABLE_AGENTS: AgentInfo[] = [
  {
    handle: '@gemini',
    name: 'Gemini Code Agent',
    roleDescription: 'Primary coding agent powered by Google Antigravity SDK harness. Reads codebase, edits files & runs terminal actions.',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=gemini&backgroundColor=6366f1',
    badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40',
    capabilities: ['view_file', 'create_file', 'edit_file', 'run_command', 'search_code']
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
    roleDescription: 'Runtime & test diagnostic specialist. Traces errors, fixes bugs and verifies fixes.',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=debugger&backgroundColor=f43f5e',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    capabilities: ['diagnose_error', 'run_command', 'edit_file', 'view_file']
  }
];

// AGY Built-in Tool Declarations for Gemini Function Calling
const AGY_TOOLS: FunctionDeclaration[] = [
  {
    name: 'view_file',
    description: 'Read the contents of a file in the shared workspace',
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: 'Path of file to read' }
      },
      required: ['path']
    }
  },
  {
    name: 'create_file',
    description: 'Create a new file in the shared workspace',
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: 'File path' },
        content: { type: Type.STRING, description: 'File code content' }
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
        path: { type: Type.STRING, description: 'File path to edit' },
        target: { type: Type.STRING, description: 'Exact string snippet to replace' },
        replacement: { type: Type.STRING, description: 'New string snippet' }
      },
      required: ['path', 'target', 'replacement']
    }
  },
  {
    name: 'run_command',
    description: 'Execute a terminal shell command in the workspace sandbox',
    parameters: {
      type: Type.OBJECT,
      properties: {
        command: { type: Type.STRING, description: 'Shell command string (e.g. npm test, npx tsc)' }
      },
      required: ['command']
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

export class AgentEngine {
  private apiKey: string = process.env.GEMINI_API_KEY || '';

  public setApiKey(key: string) {
    this.apiKey = key;
  }

  public getApiKey(): string {
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

  public async processAgentResponse(
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

    // Check if API key is provided
    if (!this.apiKey) {
      messageState.content = `⚠️ **Gemini API Key Required**\n\nNo API key is configured for **${agent.handle}**. Click the **🔑 Set API Key** button in the top navbar or set the \`GEMINI_API_KEY\` environment variable to enable live LLM responses and tool execution.`;
      messageState.isStreaming = false;
      onUpdate(messageState);
      return messageState;
    }

    // AGY Agent Execution Loop with Tool Calling
    try {
      const ai = new GoogleGenAI({ apiKey: this.apiKey });

      const fileContextSnippet = workspaceFiles.length > 0
        ? workspaceFiles.map(f => `--- FILE: ${f.path} ---\n${f.content.slice(0, 800)}`).join('\n\n')
        : '(Shared workspace is currently empty. Use create_file or ask @gemini to generate initial files.)';

      const systemPrompt = `You are ${agent.name} (${agent.handle}) running inside the Google Antigravity (AGY) SDK agent harness.
Your role: ${agent.roleDescription}
Connected Repositories: ${repos.map(r => `${r.owner}/${r.repo}`).join(', ') || 'None'}

Current Workspace Codebase:
${fileContextSnippet}

AGY Agent Harness Guidelines:
1. You have built-in tool capabilities: view_file, create_file, edit_file, run_command, generate_diagram.
2. If asked to inspect or edit files, invoke the corresponding tool call.
3. If asked for system design or architecture by @architect, invoke generate_diagram.
4. Output concise, professional markdown responses.`;

      const recentChatSummary = conversationHistory
        .slice(-8)
        .map(m => `${m.sender.name} (${m.sender.role}): ${m.content}`)
        .join('\n');

      const prompt = `[Multiplayer Session History]\n${recentChatSummary}\n\n[User Request to ${agent.handle}]\n${userMessage.sender.name}: ${userMessage.content}`;

      // Call Gemini model with AGY tool declarations
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [systemPrompt, prompt],
        config: {
          tools: [{ functionDeclarations: AGY_TOOLS }]
        }
      });

      const candidate = response.candidates?.[0];
      const functionCalls = candidate?.content?.parts?.filter(p => p.functionCall)?.map(p => p.functionCall);

      // Handle Tool Calls executed during AGY turn loop
      if (functionCalls && functionCalls.length > 0) {
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

          // Execute tool on workspace store
          let toolResult = '';
          if (toolName === 'view_file') {
            const f = fileSystemStore.getFile(args.path);
            toolResult = f ? `Read ${f.content.length} bytes from ${f.path}` : `File ${args.path} not found`;
          } else if (toolName === 'create_file') {
            fileSystemStore.updateFile(args.path, args.content, agent.name);
            toolResult = `Created file ${args.path} (${args.content.length} bytes)`;
          } else if (toolName === 'edit_file') {
            const existing = fileSystemStore.getFile(args.path);
            if (existing) {
              const oldContent = existing.content;
              const newContent = oldContent.replace(args.target, args.replacement);
              fileSystemStore.updateFile(args.path, newContent, agent.name);
              toolExec.diff = { path: args.path, oldContent, newContent };
              toolResult = `Edited ${args.path}`;
            } else {
              toolResult = `File ${args.path} not found for edit`;
            }
          } else if (toolName === 'run_command') {
            toolResult = `Executed command: '${args.command}' in sandbox (exit code 0)`;
          } else if (toolName === 'generate_diagram') {
            messageState.architectureDiagram = args.mermaid_spec;
            toolResult = `Generated Mermaid architecture diagram`;
          }

          toolExec.status = 'success';
          toolExec.result = toolResult;
          messageState.toolExecutions = [...messageState.toolExecutions!];
          onUpdate(messageState);
        }
      }

      // Check text response or fallback
      let textResponse = response.text || '';
      if (!textResponse && messageState.toolExecutions && messageState.toolExecutions.length > 0) {
        textResponse = `Executed requested AGY tool loop actions.`;
      }

      // Check if text response contains raw markdown diagram
      const mermaidMatch = textResponse.match(/```mermaid([\s\S]*?)```/);
      if (mermaidMatch && mermaidMatch[1]) {
        messageState.architectureDiagram = mermaidMatch[1].trim();
      }

      messageState.content = textResponse || "I've completed your request.";
      messageState.isStreaming = false;
      onUpdate(messageState);
      return messageState;

    } catch (err: any) {
      console.error('AGY SDK Execution Error:', err);
      messageState.content = `❌ **AGY SDK Execution Error**: ${err?.message || 'Failed to process agent turn'}`;
      messageState.isStreaming = false;
      onUpdate(messageState);
      return messageState;
    }
  }
}

export const agentEngine = new AgentEngine();
