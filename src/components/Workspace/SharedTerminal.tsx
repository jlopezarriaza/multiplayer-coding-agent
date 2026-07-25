import React, { useState } from 'react';
import { Terminal as TerminalIcon, Play, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface TerminalLog {
  id: string;
  command: string;
  output: string;
  executedBy: string;
  status: 'success' | 'error';
  timestamp: string;
}

export const SharedTerminal: React.FC = () => {
  const [logs, setLogs] = useState<TerminalLog[]>([
    {
      id: 'log-1',
      command: 'npm run test',
      output: 'PASS src/tests/stateEngine.test.ts\nPASS src/tests/agentRouter.test.ts\nTest Suites: 2 passed, 2 total',
      executedBy: '@debugger',
      status: 'success',
      timestamp: new Date(Date.now() - 300000).toLocaleTimeString()
    },
    {
      id: 'log-2',
      command: 'npx tsc --noEmit',
      output: '✨ Type check passed with 0 errors!',
      executedBy: '@gemini',
      status: 'success',
      timestamp: new Date(Date.now() - 120000).toLocaleTimeString()
    }
  ]);
  const [inputCmd, setInputCmd] = useState('');

  const handleRunCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCmd.trim()) return;

    const newLog: TerminalLog = {
      id: `log-${Date.now()}`,
      command: inputCmd,
      output: `Executing command '${inputCmd}' in shared workspace... process exited with code 0`,
      executedBy: 'You',
      status: 'success',
      timestamp: new Date().toLocaleTimeString()
    };

    setLogs((prev) => [...prev, newLog]);
    setInputCmd('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-dark-950/90 font-mono text-xs overflow-hidden">
      {/* Terminal Bar */}
      <div className="h-10 px-4 border-b border-slate-800 bg-dark-900 flex items-center justify-between text-xs select-none">
        <div className="flex items-center space-x-2">
          <TerminalIcon className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-slate-200">Shared Sandbox Terminal Output</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          Environment: Node v20.17.0 / macOS
        </span>
      </div>

      {/* Terminal Output Scroll Area */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-dark-950/95 font-mono text-[11px]">
        {logs.map((log) => (
          <div key={log.id} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1 text-[10px]">
              <span className="flex items-center space-x-1 text-slate-300 font-semibold">
                <span className="text-amber-400">$</span>
                <span>{log.command}</span>
              </span>
              <span className="flex items-center space-x-1 text-slate-400">
                <span>by <strong>{log.executedBy}</strong></span>
                <span>at {log.timestamp}</span>
              </span>
            </div>
            <pre className="text-slate-300 whitespace-pre-wrap font-mono text-[10px] bg-dark-950 p-2 rounded border border-slate-800/80">
              {log.output}
            </pre>
          </div>
        ))}
      </div>

      {/* Terminal Prompt Input */}
      <form onSubmit={handleRunCommand} className="p-2 bg-dark-900 border-t border-slate-800 flex items-center space-x-2">
        <span className="text-amber-400 font-bold px-2">$</span>
        <input
          type="text"
          value={inputCmd}
          onChange={(e) => setInputCmd(e.target.value)}
          placeholder="Run command in shared workspace (e.g. npm test, git status)..."
          className="flex-1 bg-transparent text-slate-200 text-xs font-mono focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputCmd.trim()}
          className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 rounded text-xs font-semibold transition"
        >
          Run
        </button>
      </form>
    </div>
  );
};
