# 🚀 Multiplayer AGY Coding Platform

An enterprise-grade, real-time multiplayer AI pair-programming and workspace engine powered by the **Google Antigravity (AGY) SDK** and **Gemini 2.5**.

Designed to give engineering teams a native, collaborative Google Antigravity experience where human developers and autonomous AI agents work together in real-time on a shared workspace.

---

## ✨ Key Features

- 🤖 **Google Antigravity (AGY) Autonomous ReAct Loop**:
  - Up to 10 autonomous iterations per agent turn.
  - Native function calling tool execution (`view_file`, `create_file`, `edit_file`, `run_command`, `git_commit`, `generate_diagram`).
  - Strict error validation on targeted line replacements to prevent silent no-op edits.

- 🧠 **Collapsible AGY Reasoning & Thought Trace**:
  - Live accordion UI displaying step-by-step LLM reasoning traces, decision logs, and tool execution rationale.

- 🛠️ **Real Workspace Disk Execution**:
  - Full synchronization with physical disk workspace (`workspace/`).
  - Real Node.js subshell command execution capturing `stdout`, `stderr`, and exit codes.

- 🤼 **Multi-Agent Specialized Roles & Handoffs**:
  - **`@gemini`**: Code generation, execution, testing, and git commits.
  - **`@architect`**: System design & interactive Mermaid.js diagram generation.
  - **`@reviewer`**: Code quality, edge-case, and security auditing.
  - **`@debugger`**: Runtime traceback diagnosis and bug fixing.
  - **Autonomous Handoff Chains**: Agents automatically trigger downstream agents (e.g. `@architect` tags `@gemini` -> `@reviewer`).

- 🚦 **Per-Agent FIFO Task Queue (`AgentQueueManager`)**:
  - Sequential, race-condition-free instruction queuing for individual agent handles.
  - Cross-agent parallelism allowing `@architect` and `@gemini` to run concurrently.

- 🔌 **Real-time WebSocket Synchronization**:
  - Instant live streaming of tool execution cards, active user presence, typing indicators, and file system updates.

---

## 🏗️ Architecture Overview

```mermaid
graph TD
    User["👥 Multiplayer Clients (React UI)"] <-->|WebSocket ws://localhost:3001/ws| WSServer["🔌 WebSocket Handler & REST API"]
    WSServer <--> Queue["🚦 Agent Queue Manager (Per-Handle FIFO)"]
    Queue <--> Engine["🧠 AGY Agent Engine (ReAct Loop)"]
    Engine <-->|@google/genai SDK| Gemini["✨ Gemini 2.5 Flash API"]
    Engine <--> FSStore["📁 File System Store (Real Disk Sync)"]
    FSStore <--> Disk["💻 Workspace Directory (workspace/)"]
    Engine <--> Shell["🐚 Subshell Command Runner"]
```

---

## 🚀 Quickstart

### Prerequisites
- Node.js `v18+`
- Python `3.10+` (for TUI benchmark games)
- Gemini API Key ([Google AI Studio](https://aistudio.google.com/))

### Installation
```bash
git clone https://github.com/jlopezarriaza/multiplayer-coding-agent.git
cd multiplayer-coding-agent
npm install
```

### Environment Configuration
Optionally create a `.env` file or export your key:
```bash
export GEMINI_API_KEY="your-gemini-api-key"
```

### Running the App
Start both the Express/WebSocket server and Vite dev server:
```bash
npm run dev
```

- **Frontend Application**: `http://localhost:3000`
- **Backend API & WebSocket Server**: `http://localhost:3001`

---

## 🧪 Benchmark & Verification Suite

The repository includes automated simulation scripts to verify multiplayer interactions, agent handoffs, and multi-turn autonomous game builds:

```bash
# 1. Test 2-Player Multiplayer Game Build (Snake TUI)
GEMINI_API_KEY=your-key npx tsx scripts/test_multiplayer_game_build.ts

# 2. Test 5-Turn Complex Benchmark (Space Invaders TUI + Unit Tests + JSON Persistence)
GEMINI_API_KEY=your-key npx tsx scripts/test_complex_multiplayer_game_build.ts

# 3. Test Multi-Agent Parallel Tagging (@architect + @gemini)
GEMINI_API_KEY=your-key npx tsx scripts/test_multi_agent_tagging.ts

# 4. Test Autonomous Agent-to-Agent Handoff Chain (@architect -> @gemini)
GEMINI_API_KEY=your-key npx tsx scripts/test_agent_handoff_chain.ts
```

---

## 🎮 Playing the Generated TUI Games

All generated games reside physically in `workspace/`:

```bash
# Run Space Invaders TUI unit test suite:
python3 workspace/space_invaders_tui.py --run-tests

# Run Space Invaders TUI 40-frame automated demo:
python3 workspace/space_invaders_tui.py --demo

# Play Space Invaders interactively:
python3 workspace/space_invaders_tui.py

# Play Snake TUI interactively:
python3 workspace/snake_tui.py
```

---

## 📄 License
MIT License. Created with Google Antigravity SDK.
