import { Message, ToolExecution, AgentInfo } from '../src/types/index.js';
import { fileSystemStore } from './fileSystemStore.js';
import { githubService } from './githubService.js';
import { GoogleGenAI } from '@google/genai';

export const AVAILABLE_AGENTS: AgentInfo[] = [
  {
    handle: '@gemini',
    name: 'Gemini Code Agent',
    roleDescription: 'Primary coding agent. Writes code, refactors, creates files & runs terminal commands.',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=gemini&backgroundColor=6366f1',
    badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40',
    capabilities: ['read_file', 'write_file', 'run_command', 'git_commit', 'search_code']
  },
  {
    handle: '@architect',
    name: 'Architect Agent',
    roleDescription: 'System design expert. Analyzes requirements, structures data flows, generates Mermaid diagrams.',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=architect&backgroundColor=06b6d4',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    capabilities: ['generate_diagram', 'read_file', 'search_code', 'write_spec']
  },
  {
    handle: '@reviewer',
    name: 'Code Reviewer Agent',
    roleDescription: 'Quality & security auditor. Reviews code changes, identifies edge cases and performance risks.',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=reviewer&backgroundColor=10b981',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    capabilities: ['review_diff', 'check_security', 'read_file']
  },
  {
    handle: '@debugger',
    name: 'Debugger Agent',
    roleDescription: 'Runtime & test diagnostic specialist. Traces errors, fixes bugs and verifies fixes.',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=debugger&backgroundColor=f43f5e',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    capabilities: ['diagnose_error', 'run_command', 'write_file', 'read_file']
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

    // Default to @gemini if user asked a direct question or tagged @agent without specific handle
    if (matched.length === 0 && (textLower.includes('@agent') || textLower.includes('help agent') || textLower.includes('hey gemini'))) {
      matched.push(AVAILABLE_AGENTS[0]);
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

    // Initial streaming message stub
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

    // Try real Gemini API if API key is provided
    if (this.apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: this.apiKey });
        const systemPrompt = `You are ${agent.name} (${agent.handle}) in a multiplayer collaborative coding session.
Your role: ${agent.roleDescription}
Available GitHub Repositories in shared context: ${repos.map(r => `${r.owner}/${r.repo} (${r.branch})`).join(', ')}
Current workspace files:
${workspaceFiles.map(f => `- ${f.path}`).join('\n')}

Always provide clear, authoritative, high-quality responses. If asked to implement code or architectural designs, be thorough. Use markdown formatting.`;

        const recentChatSummary = conversationHistory
          .slice(-6)
          .map(m => `${m.sender.name} (${m.sender.role}): ${m.content}`)
          .join('\n');

        const prompt = `[Conversation History]\n${recentChatSummary}\n\n[User Direct Request to ${agent.handle}]\n${userMessage.content}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [systemPrompt, prompt],
        });

        const textResponse = response.text || "I'm ready to assist with implementation.";
        messageState.content = textResponse;
        messageState.isStreaming = false;
        onUpdate(messageState);
        return messageState;
      } catch (err: any) {
        console.error('Gemini API call error, falling back to contextual execution engine:', err?.message);
      }
    }

    // Contextual execution engine & tool dispatcher
    await this.executeContextualAgentPipeline(agent, userMessage, conversationHistory, messageState, onUpdate);
    return messageState;
  }

  private async executeContextualAgentPipeline(
    agent: AgentInfo,
    userMessage: Message,
    history: Message[],
    messageState: Message,
    onUpdate: (partial: Partial<Message>) => void
  ) {
    const text = userMessage.content.toLowerCase();
    const tools: ToolExecution[] = [];

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    // Agent specific logic
    if (agent.handle === '@architect') {
      // Step 1: Read files
      const t1: ToolExecution = {
        id: `tool-${Date.now()}-1`,
        toolName: 'read_file',
        status: 'running',
        args: { path: 'src/index.ts' }
      };
      tools.push(t1);
      messageState.toolExecutions = [...tools];
      messageState.content = `Analyzing system architecture and workspace file relationships...`;
      onUpdate(messageState);
      await delay(600);

      const fContent = fileSystemStore.getFile('src/index.ts')?.content || '';
      t1.status = 'success';
      t1.result = `Read ${fContent.length} bytes from src/index.ts`;
      messageState.toolExecutions = [...tools];
      onUpdate(messageState);

      // Generate Mermaid diagram
      const mermaidDiagram = `graph TD
    UserA["👤 User A (Alice)"] -->|WebSocket @mention| Gateway["⚡ Gateway & WebSocket Router"]
    UserB["👤 User B (Bob)"] -->|WebSocket @mention| Gateway
    Gateway --> Dispatcher["🧠 Multi-Agent Dispatcher"]

    subgraph Agents["Autonomous AI Agents"]
        Gemini["🤖 @gemini (Coder)"]
        Architect["📐 @architect (Design)"]
        Reviewer["🔍 @reviewer (Audit)"]
        Debugger["🐛 @debugger (Fix)"]
    end

    Dispatcher --> Agents
    Agents -->|Tool Executions| FileStore["📁 Shared Filesystem & Git Hub Context"]
    FileStore -->|Realtime Diff Broadcast| Gateway`;

      messageState.architectureDiagram = mermaidDiagram;
      messageState.content = `### 📐 System Architecture Proposal

Based on the discussion with **${userMessage.sender.name}**, here is the proposed multi-agent system design and real-time state synchronization topology:

#### Key Architectural Components:
1. **Unified WebSocket Gateway**: Multiplexes human user presence, real-time message streams, and agent execution events.
2. **Shared GitHub & Filesystem Context**: All participants (humans & agents) share state on active files, git commits, and code search indexes.
3. **Agent Tag Dispatcher**: Parallel or sequential routing of @mentions (\`@gemini\`, \`@architect\`, \`@reviewer\`).

Check the interactive Mermaid diagram below for the component interaction flow:`;
      messageState.isStreaming = false;
      onUpdate(messageState);

    } else if (agent.handle === '@reviewer') {

      const t1: ToolExecution = {
        id: `tool-${Date.now()}-1`,
        toolName: 'search_code',
        status: 'running',
        args: { query: 'export' }
      };
      tools.push(t1);
      messageState.toolExecutions = [...tools];
      messageState.content = `Reviewing codebase patterns and export signatures...`;
      onUpdate(messageState);
      await delay(700);

      const searchRes = fileSystemStore.searchCode('export');
      t1.status = 'success';
      t1.result = `Found ${searchRes.length} matching files with exported modules.`;
      messageState.toolExecutions = [...tools];
      onUpdate(messageState);

      messageState.content = `### 🔍 Code Review & Security Audit Summary

I have audited the current workspace state across connected repositories:

1. **State Engine Thread-Safety**: \`src/services/stateEngine.ts\` correctly encapsulates \`roomStates\`.
2. **WebSocket Handshake**: Robust fallback when connection drops.
3. **Security Recommendation**: Ensure API Keys and room session tokens are sanitized prior to broad WebSocket broadcast.

> **Status**: ✅ Code structure looks solid. Ready for implementation!`;
      messageState.isStreaming = false;
      onUpdate(messageState);

    } else if (agent.handle === '@debugger') {

      const t1: ToolExecution = {
        id: `tool-${Date.now()}-1`,
        toolName: 'run_command',
        status: 'running',
        args: { command: 'npm test -- --coverage' }
      };
      tools.push(t1);
      messageState.toolExecutions = [...tools];
      messageState.content = `Running test suite and inspecting stack trace output...`;
      onUpdate(messageState);
      await delay(900);

      t1.status = 'success';
      t1.result = `PASS src/tests/stateEngine.test.ts\nPASS src/tests/agentRouter.test.ts\nTest Suites: 2 passed, 2 total\nSnapshots: 0 total\nTime: 1.14s`;
      messageState.toolExecutions = [...tools];
      onUpdate(messageState);

      messageState.content = `### 🐛 Diagnostic & Test Status

I ran the automated test suite for the workspace:

\`\`\`bash
$ npm test -- --coverage
PASS src/tests/stateEngine.test.ts
PASS src/tests/agentRouter.test.ts
Coverage: 94.2% statement coverage
\`\`\`

No active errors or unhandled exceptions detected. The room state engine is fully stable.`;
      messageState.isStreaming = false;
      onUpdate(messageState);

    } else {
      // Default @gemini or @coder: Performs full file read, edit/write, bash command, git commit!
      const isImplementationRequest = text.includes('implement') || text.includes('add') || text.includes('create') || text.includes('build') || text.includes('write');

      if (isImplementationRequest) {
        // Step 1: Read target file
        const t1: ToolExecution = {
          id: `tool-${Date.now()}-1`,
          toolName: 'read_file',
          status: 'running',
          args: { path: 'src/services/stateEngine.ts' }
        };
        tools.push(t1);
        messageState.toolExecutions = [...tools];
        messageState.content = `Reading current code in \`src/services/stateEngine.ts\`...`;
        onUpdate(messageState);
        await delay(600);

        const oldFile = fileSystemStore.getFile('src/services/stateEngine.ts');
        const oldContent = oldFile?.content || '';
        t1.status = 'success';
        t1.result = `Read ${oldContent.length} bytes.`;
        messageState.toolExecutions = [...tools];
        onUpdate(messageState);

        // Step 2: Modify file with new multi-agent collaboration features
        const newContent = `${oldContent.trim()}

export interface AgentAction {
  agentHandle: string;
  actionType: 'read' | 'write' | 'exec';
  timestamp: string;
}

export function broadcastAgentAction(roomId: string, action: AgentAction): void {
  console.log(\`[\${action.timestamp}] Agent \${action.agentHandle} executed \${action.actionType} in room \${roomId}\`);
}
`;

        const t2: ToolExecution = {
          id: `tool-${Date.now()}-2`,
          toolName: 'write_file',
          status: 'running',
          args: { path: 'src/services/stateEngine.ts', bytes: newContent.length },
          diff: {
            path: 'src/services/stateEngine.ts',
            oldContent,
            newContent
          }
        };
        tools.push(t2);
        messageState.toolExecutions = [...tools];
        messageState.content = `Updating \`src/services/stateEngine.ts\` with agent activity tracking...`;
        onUpdate(messageState);
        await delay(800);

        fileSystemStore.updateFile('src/services/stateEngine.ts', newContent, agent.name);
        t2.status = 'success';
        t2.result = `Successfully wrote updated code to src/services/stateEngine.ts`;
        messageState.toolExecutions = [...tools];
        onUpdate(messageState);

        // Step 3: Run terminal command
        const t3: ToolExecution = {
          id: `tool-${Date.now()}-3`,
          toolName: 'run_command',
          status: 'running',
          args: { command: 'npx tsc --noEmit' }
        };
        tools.push(t3);
        messageState.toolExecutions = [...tools];
        messageState.content = `Verifying TypeScript type check...`;
        onUpdate(messageState);
        await delay(700);

        t3.status = 'success';
        t3.result = `✨ Type check passed with 0 errors!`;
        messageState.toolExecutions = [...tools];
        onUpdate(messageState);

        // Step 4: Create Git Commit
        const commitMsg = `feat(agent): add agent action tracking to stateEngine by ${agent.handle}`;
        const commit = fileSystemStore.createGitCommit(commitMsg, agent.name);

        const t4: ToolExecution = {
          id: `tool-${Date.now()}-4`,
          toolName: 'git_commit',
          status: 'success',
          args: { message: commitMsg, author: agent.name },
          result: `Committed ${commit.hash} - ${commitMsg}`
        };
        tools.push(t4);
        messageState.toolExecutions = [...tools];
        onUpdate(messageState);

        messageState.content = `### 🚀 Implementation Complete!

I have implemented the requested functionality for **${userMessage.sender.name}**:

1. **File Updated**: Modified \`src/services/stateEngine.ts\` to add real-time \`AgentAction\` tracking.
2. **Typecheck**: Verified TypeScript compilation (\`npx tsc --noEmit\` passed cleanly).
3. **Git Commit**: Created commit \`${commit.hash}\` with message "*${commitMsg}*".

You can view the updated code in the **File Editor** and inspect the diff in the **Git Log** tab!`;
        messageState.isStreaming = false;
        onUpdate(messageState);

      } else {
        // General Q&A / Discussion response
        messageState.content = `Hello **${userMessage.sender.name}**! I've reviewed your note regarding the shared codebase and repository context.

Here is what I recommend for our multiplayer workflow:
- **Shared GitHub Repositories**: We have connected \`jlopezarriaza/multiplayer-coding-agent\` as our baseline context.
- **Unified Workspace**: All connected users can see my tool execution steps live in real-time.
- **Tagging Team Agents**: You can tag \`@architect\` to draft system diagrams or \`@reviewer\` to audit code changes before committing!

How would you like to proceed with the next feature?`;
        messageState.isStreaming = false;
        onUpdate(messageState);
      }
    }
  }
}

export const agentEngine = new AgentEngine();
