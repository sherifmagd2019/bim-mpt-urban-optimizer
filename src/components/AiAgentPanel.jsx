import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Lightbulb,
  Terminal,
  Cpu,
  Layers,
  Scale,
  TrendingUp,
  ShieldCheck,
  Percent,
  Check
} from 'lucide-react';

export const AiAgentPanel = ({
  messages = [],
  onSendMessage,
  isLoading = false,
  onExecuteAgentAction,
  currentScenario = { covarianceRegime: 'low' },
  onApplyOptimalWeights
}) => {
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'telemetry'
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
    if (onSendMessage) {
      onSendMessage(inputText.trim());
    }
    setInputText('');
  };

  const samplePrompts = [
    'Optimize parcel layout for Maximum Sharpe Ratio',
    'Evaluate unconstrained MPT & check Simplex Feasibility',
    'Compare current design with Table 1 research benchmarks',
    'Stress-test steel commodity shock +35% and high correlation',
    'Explain the analytical JavaScript subspace vectors g and h'
  ];

  return (
    <div
      id="ai-agent-panel-container"
      className="sleek-glass rounded-2xl flex flex-col h-full min-h-[620px] overflow-hidden shadow-2xl border border-slate-800/80"
    >
      {/* ==================================================================== */}
      {/* 1. Header & Telemetry Bar                                            */}
      {/* ==================================================================== */}
      <div className="p-4 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white tracking-wider uppercase">
                ICEPE 2026 AI Co-Pilot
              </h3>
              <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                Sherif Ahmad Magdaldin
              </span>
              <span className="badge badge-online flex items-center gap-1 text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Gemini 3.7 Tool Loop
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Modern Portfolio Theory in Generative Urban BIM Layouts (Pure JavaScript Runtime)
            </p>
          </div>
        </div>

        {/* Telemetry pill */}
        <div className="text-right text-[11px] font-mono hidden sm:flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-400 flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-slate-500">Regime:</span>
            <strong className="text-indigo-300 capitalize">
              {currentScenario?.covarianceRegime || 'Low'} Corr
            </strong>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. Suggested Quick Action Prompts Bar                                */}
      {/* ==================================================================== */}
      <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/60 overflow-x-auto flex items-center gap-2 text-[11px]">
        <span className="text-slate-400 flex items-center gap-1 shrink-0 font-semibold uppercase tracking-wider text-[10px]">
          <Lightbulb className="h-3 w-3 text-amber-400" />
          Prompts:
        </span>
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            id={`quick-prompt-btn-${idx}`}
            onClick={() => onSendMessage && onSendMessage(prompt)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg bg-slate-900/70 text-slate-300 border border-slate-800 hover:border-indigo-500/50 hover:text-white transition-all whitespace-nowrap text-left shrink-0 text-[11px] disabled:opacity-50 cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* ==================================================================== */}
      {/* 3. Main Message Stream & Tool Execution Traces                       */}
      {/* ==================================================================== */}
      <div
        id="agent-chat-stream"
        className="flex-1 p-4 lg:p-5 overflow-y-auto space-y-4 bg-slate-950/20 text-xs"
      >
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const hasToolExecutions =
            msg.toolExecutions && Array.isArray(msg.toolExecutions) && msg.toolExecutions.length > 0;
          const hasStructuralPayload = Boolean(msg.structuralPayload);

          return (
            <div
              key={msg.id || `msg-${index}`}
              id={`chat-message-${msg.id || index}`}
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

              {/* Chat Bubble */}
              <div
                className={`max-w-[90%] ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm p-4 shadow-lg shadow-indigo-600/20'
                    : 'sleek-thought-bubble text-slate-200 shadow-xl w-full'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800/80">
                    <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <Terminal className="h-3 w-3" />
                      <span>Quantitative Gemini Co-Pilot</span>
                    </div>
                    {msg.status === 'TOOL_EXECUTION' && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] flex items-center gap-1">
                        <Cpu className="h-2.5 w-2.5" />
                        Tool Invocation
                      </span>
                    )}
                  </div>
                )}

                {/* Markdown / Message Content */}
                <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed space-y-2">
                  {msg.content}
                </div>

                {/* ========================================================== */}
                {/* TOOL EXECUTION TRACE BLOCK (Real-Time Function Calling)     */}
                {/* ========================================================== */}
                {!isUser && hasToolExecutions && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1 text-indigo-400">
                        <Layers className="h-3 w-3" />
                        Gemini Function Calls:
                      </span>
                      <span className="font-mono text-slate-500">
                        {msg.toolExecutions.length} executed
                      </span>
                    </div>

                    <div className="space-y-1.5 font-mono text-[10px]">
                      {msg.toolExecutions.map((exec, eIdx) => (
                        <div
                          key={eIdx}
                          className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1"
                        >
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="font-bold text-cyan-300 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-cyan-400" />
                              {exec.toolName}()
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                                exec.status === 'SUCCESS'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : exec.status === 'PROJECTED'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {exec.status}
                            </span>
                          </div>

                          {/* Arguments & Returns */}
                          <div className="text-[9px] text-slate-400 bg-slate-950/80 p-1.5 rounded border border-slate-800/50">
                            {exec.toolName === 'runOptimization' && (
                              <div>
                                <span className="text-slate-500">Args:</span> target=
                                {exec.args?.targetVolatilityPercent}%, nonNegative=
                                {String(exec.args?.enforceNonNegative)}
                                <br />
                                <span className="text-slate-500">Returns:</span> Return=
                                <strong className="text-emerald-400">
                                  {exec.result?.expectedReturnPercent}%
                                </strong>
                                , Volatility=
                                <strong className="text-amber-400">
                                  {exec.result?.volatilityPercent}%
                                </strong>
                                , Sharpe=
                                <strong className="text-cyan-400">
                                  {exec.result?.sharpeRatio}
                                </strong>
                              </div>
                            )}

                            {exec.toolName === 'checkFeasibility' && (
                              <div>
                                <span className="text-slate-500">Validation:</span>{' '}
                                {exec.result?.isPhysicallyFeasible ? (
                                  <span className="text-emerald-400">
                                    All weights strictly non-negative w_i ≥ 0 (Feasible)
                                  </span>
                                ) : (
                                  <span className="text-amber-400">
                                    {exec.result?.negativeWeightsCount} negative weights detected →
                                    Euclidean Simplex Projection applied
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ========================================================== */}
                {/* REASONING STEP LOGS                                        */}
                {/* ========================================================== */}
                {!isUser && msg.reasoningSteps && msg.reasoningSteps.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Execution Trace:
                    </span>
                    <ul className="space-y-1 font-mono text-[10px] text-slate-300">
                      {msg.reasoningSteps.map((step, sIdx) => {
                        const isAction =
                          step.toLowerCase().includes('executed') ||
                          step.toLowerCase().includes('solved') ||
                          step.toLowerCase().includes('inverting') ||
                          step.toLowerCase().includes('projected');
                        return (
                          <li
                            key={sIdx}
                            className="flex items-center gap-2 p-1.5 rounded bg-slate-900/60 border border-slate-800/60"
                          >
                            <CheckCircle2
                              className={`h-3 w-3 shrink-0 ${
                                isAction ? 'text-cyan-400' : 'text-emerald-400'
                              }`}
                            />
                            <span className="truncate">{step}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* ========================================================== */}
                {/* SUGGESTED ACTION CARD (Apply to Masterplan Canvas)         */}
                {/* ========================================================== */}
                {!isUser && msg.suggestedAction && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between bg-slate-900/90 p-3 rounded-xl border border-indigo-500/30 shadow-lg">
                    <div className="pr-3">
                      <p className="font-bold text-white text-[11px] flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
                        {msg.suggestedAction.title}
                      </p>
                      <p className="text-slate-400 text-[10px] truncate max-w-xs sm:max-w-md">
                        {msg.suggestedAction.description}
                      </p>
                    </div>
                    <button
                      id={`execute-action-btn-${msg.suggestedAction.id || 'default'}`}
                      onClick={() => {
                        if (msg.suggestedAction.type === 'optimize_weights') {
                          if (onApplyOptimalWeights) {
                            onApplyOptimalWeights();
                          } else if (onExecuteAgentAction) {
                            onExecuteAgentAction(msg.suggestedAction);
                          }
                        } else if (onExecuteAgentAction) {
                          onExecuteAgentAction(msg.suggestedAction);
                        }
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-[11px] flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 shrink-0 cursor-pointer transition-all active:scale-95"
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
            <div className="sleek-thought-bubble text-slate-300 text-xs flex items-center gap-2.5 bg-slate-900/90 border border-indigo-500/30 shadow-xl">
              <RefreshCw className="h-3.5 w-3.5 text-indigo-400 animate-spin" />
              <span>
                Calling Gemini 3.7 tool loop: inverting covariance matrix Σ⁻¹ and
                checking simplex feasibility...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ==================================================================== */}
      {/* 4. Chat Input Bar                                                    */}
      {/* ==================================================================== */}
      <div className="p-3 bg-slate-950/70 border-t border-slate-800/80">
        <form onSubmit={handleSubmit} className="sleek-glass-card rounded-xl p-2 flex items-center gap-3">
          <div className="flex-1 pl-2">
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">
              Instruction / Terminal Query
            </div>
            <input
              id="agent-user-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder='e.g. "Rebalance zoning for maximum Sharpe" or "Check simplex feasibility for steel shock"'
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
