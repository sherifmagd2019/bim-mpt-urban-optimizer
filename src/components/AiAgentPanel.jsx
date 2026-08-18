import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  Lightbulb, 
  Terminal 
} from 'lucide-react';

export const AiAgentPanel = ({
  messages,
  onSendMessage,
  isLoading,
  onExecuteAgentAction,
  currentScenario,
  onApplyOptimalWeights
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const samplePrompts = [
    'Optimize parcel layout for Maximum Sharpe Ratio',
    'Push current layout to Revit 2027 via Live Bridge',
    'Stress-test steel commodity shock +35% and high correlation',
    'Compare current design with Table 1 research benchmarks',
    'Explain the analytical JavaScript subspace vectors g and h'
  ];

  return (
    <div id="ai-agent-panel-container" className="sleek-glass rounded-2xl flex flex-col h-full min-h-[580px] overflow-hidden shadow-2xl">
      {/* Agent Header */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white tracking-wider uppercase">
                BIM Quant AI Agent Co-Pilot
              </h3>
              <span className="badge badge-online flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Autonomous architectural financial engineering co-pilot (Pure JavaScript Runtime)
            </p>
          </div>
        </div>

        {/* Telemetry pill */}
        <div className="text-right text-[11px] font-mono hidden sm:flex items-center gap-2">
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 text-slate-400">
            <span className="text-slate-500">Regime:</span> <strong className="text-indigo-300 capitalize">{currentScenario.covarianceRegime} Corr</strong>
          </div>
        </div>
      </div>

      {/* Suggested Quick Prompts Bar */}
      <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/60 overflow-x-auto flex items-center gap-2 text-[11px]">
        <span className="text-slate-400 flex items-center gap-1 shrink-0 font-semibold uppercase tracking-wider text-[10px]">
          <Lightbulb className="h-3 w-3 text-amber-400" />
          Prompts:
        </span>
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            id={`quick-prompt-btn-${idx}`}
            onClick={() => onSendMessage(prompt)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg bg-slate-900/70 text-slate-300 border border-slate-800 hover:border-indigo-500/50 hover:text-white transition-all whitespace-nowrap text-left shrink-0 text-[11px] disabled:opacity-50 cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div id="agent-chat-stream" className="flex-1 p-4 lg:p-5 overflow-y-auto space-y-4 bg-slate-950/20 text-xs">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              id={`chat-message-${msg.id}`}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  isUser
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-800 border border-slate-700 text-indigo-400'
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[88%] ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm p-4 shadow-lg shadow-indigo-600/20'
                    : 'sleek-thought-bubble text-slate-200 shadow-xl'
                }`}
              >
                {!isUser && (
                  <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Terminal className="h-3 w-3" />
                    <span>Analytical Synthesis</span>
                  </div>
                )}

                {/* Message Content */}
                <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                  {msg.content}
                </div>

                {/* Agent Reasoning Steps */}
                {!isUser && msg.reasoningSteps && msg.reasoningSteps.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Execution Trace:
                    </span>
                    <ul className="space-y-1 font-mono text-[10px] text-slate-300">
                      {msg.reasoningSteps.map((step, sIdx) => {
                        const isAction = step.toLowerCase().includes('executed') || step.toLowerCase().includes('solved') || step.toLowerCase().includes('inverting');
                        return (
                          <li key={sIdx} className="flex items-center gap-2 p-1.5 rounded bg-slate-900/60 border border-slate-800/60">
                            <CheckCircle2 className={`h-3 w-3 shrink-0 ${isAction ? 'text-pink-400' : 'text-emerald-400'}`} />
                            <span className="truncate">{step}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Suggested Action Pill */}
                {!isUser && msg.suggestedAction && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between bg-slate-900/90 p-3 rounded-xl border border-indigo-500/30">
                    <div className="pr-3">
                      <p className="font-bold text-white text-[11px]">
                        {msg.suggestedAction.title}
                      </p>
                      <p className="text-slate-400 text-[10px] truncate">
                        {msg.suggestedAction.description}
                      </p>
                    </div>
                    <button
                      id={`execute-action-btn-${msg.suggestedAction.id || 'default'}`}
                      onClick={() => onExecuteAgentAction && onExecuteAgentAction(msg.suggestedAction)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-[11px] flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 shrink-0 cursor-pointer transition-all"
                    >
                      <span>Apply</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div id="agent-loading-indicator" className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-slate-800 border border-slate-700 text-indigo-400 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 animate-spin text-indigo-400" />
            </div>
            <div className="sleek-thought-bubble sleek-thought-bubble-pink text-slate-300 text-xs flex items-center gap-2.5">
              <RefreshCw className="h-3.5 w-3.5 text-pink-400 animate-spin" />
              <span>Inverting covariance matrix and synthesizing Markowitz subspace vectors in JavaScript...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar - Sleek Glass container with circular action button */}
      <div className="p-3 bg-slate-950/60 border-t border-slate-800/80">
        <form onSubmit={handleSubmit} className="sleek-glass-card rounded-xl p-2 flex items-center gap-3">
          <div className="flex-1 pl-2">
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Instruction</div>
            <input
              id="agent-user-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder='e.g. "Rebalance zoning for maximum Sharpe" or "Simulate +20% steel cost"'
              disabled={isLoading}
              className="w-full bg-transparent border-none outline-none text-slate-100 placeholder:text-slate-500 text-xs font-medium"
            />
          </div>
          <button
            id="agent-submit-btn"
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center cursor-pointer shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
