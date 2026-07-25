import { Message, ToolExecution, AgentInfo } from '../src/types/index.js';
import { fileSystemStore } from './fileSystemStore.js';
import { githubService } from './githubService.js';
import { GoogleGenAI } from '@google/genai';

export const AVAILABLE_AGENTS: AgentInfo[] = [
  {
    handle: '@gemini',
    name: 'Gemini Code Agent',
    roleDescription: 'Primary coding agent. Writes code, refactors, creates files & executes implementation requests.',
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

    // Call Real Gemini API
    try {
      const ai = new GoogleGenAI({ apiKey: this.apiKey });

      // Gather codebase file snippets for context
      const fileContextSnippet = workspaceFiles
        .map(f => `--- FILE: ${f.path} ---\n${f.content.slice(0, 800)}`)
        .join('\n\n');

      const systemPrompt = `You are ${agent.name} (${agent.handle}) in a multiplayer collaborative coding session.
Your role: ${agent.roleDescription}
Connected GitHub Repositories: ${repos.map(r => `${r.owner}/${r.repo}`).join(', ')}

Shared Workspace Codebase:
${fileContextSnippet}

Instructions:
- Provide direct, expert, clear responses as ${agent.name}.
- If asked to write code, provide production-ready code with explanation.
- If asked for system design or architecture by @architect, include a \`\`\`mermaid\`\`\` code block diagram.
- Use markdown formatting.`;

      const recentChatSummary = conversationHistory
        .slice(-8)
        .map(m => `${m.sender.name} (${m.sender.role}): ${m.content}`)
        .join('\n');

      const prompt = `[Multiplayer Conversation History]\n${recentChatSummary}\n\n[User Request to ${agent.handle}]\n${userMessage.sender.name}: ${userMessage.content}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [systemPrompt, prompt],
      });

      const textResponse = response.text || "I've processed your request.";

      // Check if Gemini generated a mermaid diagram
      const mermaidMatch = textResponse.match(/```mermaid([\s\S]*?)```/);
      if (mermaidMatch && mermaidMatch[1]) {
        messageState.architectureDiagram = mermaidMatch[1].trim();
      }

      messageState.content = textResponse;
      messageState.isStreaming = false;
      onUpdate(messageState);
      return messageState;
    } catch (err: any) {
      console.error('Gemini API execution error:', err);
      messageState.content = `❌ **Gemini API Error**: ${err?.message || 'Failed to call Gemini model'}`;
      messageState.isStreaming = false;
      onUpdate(messageState);
      return messageState;
    }
  }
}

export const agentEngine = new AgentEngine();
