import React from 'react';
import { AgentInfo } from '../../types/index.js';
import { Bot, Sparkles, Code2, ShieldAlert, Cpu, Plus, Command } from 'lucide-react';

interface AgentListProps {
  agents: AgentInfo[];
  onSelectAgent: (handle: string) => void;
}

export const AgentList: React.FC<AgentListProps> = ({ agents, onSelectAgent }) => {
  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
          <Bot className="w-3.5 h-3.5 text-indigo-400" />
          <span>Active Coding Agents</span>
        </h3>
        <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20">
          {agents.length} Online
        </span>
      </div>

      <div className="space-y-2">
        {agents.map((agent) => (
          <div
            key={agent.handle}
            onClick={() => onSelectAgent(agent.handle)}
            className="group glass-card hover:bg-slate-800/80 p-2.5 rounded-xl border border-slate-800 hover:border-indigo-500/40 transition cursor-pointer"
          >
            <div className="flex items-start space-x-2.5">
              <img
                src={agent.avatar}
                alt={agent.name}
                className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700/80 group-hover:scale-105 transition"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-200 group-hover:text-white flex items-center gap-1">
                    {agent.name}
                  </span>
                  <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border ${agent.badgeColor}`}>
                    {agent.handle}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                  {agent.roleDescription}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {agent.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="text-[9px] font-mono bg-slate-900/90 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
