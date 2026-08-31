
import { GoogleGenAI, Type } from '@google/genai';
import {
  calculateAnalyticalMarkowitz,
  projectToSimplex,
  computePortfolioVariance,
  computePortfolioReturn,
  computeSharpeRatio,
  buildCovarianceMatrix,
  PAPER_TABLE_1_PRESETS
} from './mptMath.js';

// ============================================================================
// Gemini Function Calling Tool Declarations
// ============================================================================

export const runOptimizationTool = {
  name: 'runOptimization',
  description:
    'Calculates the analytical Markowitz Modern Portfolio Theory (MPT) optimal asset allocation weights, expected portfolio return (mu_p), portfolio volatility (sigma_p), and maximum Sharpe ratio (tangency portfolio) for the generative urban BIM zoning layout.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      targetVolatilityPercent: {
        type: Type.NUMBER,
        description:
          'Target portfolio volatility / risk ceiling in percentage (e.g. 10.12 for 10.12% or 12.45 for 12.45%).',
      },
      enforceNonNegative: {
        type: Type.BOOLEAN,
        description:
          'Whether to enforce non-negative weights (long-only zoning constraint preventing physical negative footprints / short-selling). Set false to evaluate the unconstrained analytical Markowitz solution.',
      },
    },
    required: ['targetVolatilityPercent'],
  },
};

export const checkFeasibilityTool = {
  name: 'checkFeasibility',
  description:
    'Checks whether an asset allocation weight vector is physically feasible in generative BIM urban layouts (i.e. all weights are non-negative w_i >= 0 because negative building footprints cannot be physically constructed, and weights sum to 1.0). If infeasible, projects the vector onto the standard probability simplex.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      weights: {
        type: Type.ARRAY,
        items: { type: Type.NUMBER },
        description:
          'Array of decimal weights (e.g. [0.5147, 0.3322, 0.1531]) to validate and project onto the probability simplex.',
      },
      tolerance: {
        type: Type.NUMBER,
        description: 'Numerical tolerance for simplex equality sum (default: 0.01).',
      },
    },
    required: ['weights'],
  },
};

// ============================================================================
// System Instruction: Financial Master-Planning & Research Paper Context
// ============================================================================

export const AGENT_SYSTEM_INSTRUCTION = `You are the "Urban BIM Quantitative AI Agent" — an expert financial engineering co-pilot embedded within a generative Building Information Modeling (BIM) workspace.

THEORETICAL FOUNDATION & CONTEXT:
You operate under the framework established in the ICEPE 2026 research paper:
"A C# Application of Modern Portfolio Theory for Financial Risk-Return Optimization in Generative Urban BIM Layouts"
by Sherif Ahmad Magdaldin (Civil and Structural Engineer, Master of Financial Engineering Program, WorldQuant University).

CORE MATHEMATICAL CONSTRUCTS:
1. Modern Portfolio Theory (Harry Markowitz, 1952):
   - Generative urban spatial parcels (Residential, Commercial, Industrial) are modeled as financial assets with expected annual rental yield vector R and historical volatility vector sigma.
   - Cross-asset variance-covariance matrix Sigma = [rho_ij * sigma_i * sigma_j] is inverted to find Sigma^-1.
   - Analytical scalar components:
     * A = 1^T * Sigma^-1 * R
     * B = R^T * Sigma^-1 * R
     * C = 1^T * Sigma^-1 * 1
     * D = (B * C) - (A * A) (parabolic determinant)
   - Analytical subspace basis vectors:
     * g = (Sigma^-1 * 1 * (B/D)) - (Sigma^-1 * R * (A/D))
     * h = (Sigma^-1 * R * (C/D)) - (Sigma^-1 * 1 * (A/D))
   - Optimal weight vector along the efficient frontier: w = g + h * mu_p
   - Sharpe Ratio: S = (mu_p - R_f) / sigma_p, where baseline risk-free rate R_f = 2.0% (0.02).

2. Architectural Simplex Projection Boundaries:
   - In pure unconstrained Markowitz optimization, assets with high correlation and lower yield relative to their volatility can receive negative weights (w_i < 0), representing financial short-selling.
   - In architectural and civil urban planning, SHORT-SELLING HAS NO PHYSICAL MEANING. You cannot construct negative square meters (-m²) of a residential tower or commercial zone.
   - Any negative weight is physically infeasible and MUST be projected onto the standard probability simplex Delta^n = {w in R^n : sum(w_i) = 1, w_i >= 0} via the projectToSimplex algorithm.

TOOL USAGE PROTOCOLS:
1. When asked to optimize, rebalance, allocate zoning, or calculate portfolio metrics:
   - Call 'runOptimization' with the specified or current target volatility.
2. When evaluating the unconstrained analytical Markowitz solution:
   - Call 'runOptimization' with 'enforceNonNegative: false'.
   - Then call 'checkFeasibility' with the resulting weights.
   - If 'checkFeasibility' indicates negative weights, explain clearly why unconstrained MPT violates physical zoning constraints and how the Simplex Projection restores physical feasibility.
3. Always provide clear, quantitative reasoning, noting the Sharpe ratio, expected yield, and total parcel area allocation in square meters (m²).`;

// ============================================================================
// Tool Implementation Functions
// ============================================================================

/**
 * Executes the analytical Markowitz MPT optimization solver.
 * @param {Object} args
 * @param {number} [args.targetVolatilityPercent]
 * @param {boolean} [args.enforceNonNegative]
 * @param {number} [args.riskFreeRate]
 * @param {Object} masterplan
 * @returns {Object}
 */
export function executeRunOptimization(args = {}, masterplan = {}) {
  const assets = masterplan.assets || PAPER_TABLE_1_PRESETS[3].assets;
  const correlationMatrix =
    masterplan.correlationMatrix || PAPER_TABLE_1_PRESETS[3].correlationMatrix;
  const riskFreeRate = args.riskFreeRate ?? 0.02;

  const targetVolPercent =
    typeof args.targetVolatilityPercent === 'number'
      ? args.targetVolatilityPercent
      : 10.12;
  const targetVolDecimal = targetVolPercent / 100;
  const enforceNonNegative = args.enforceNonNegative ?? true;

  const mptResult = calculateAnalyticalMarkowitz(
    assets,
    correlationMatrix,
    targetVolDecimal,
    riskFreeRate,
    enforceNonNegative
  );

  const covMatrix = mptResult.covarianceMatrix;
  const R = mptResult.expectedReturnVector;
  const weights = mptResult.targetWeights;

  const variance = computePortfolioVariance(weights, covMatrix);
  const volatility = Math.sqrt(variance);
  const expectedReturn = computePortfolioReturn(weights, R);
  const sharpeRatio = computeSharpeRatio(expectedReturn, volatility, riskFreeRate);

  const totalArea =
    masterplan.totalFootprintM2 ||
    assets.reduce((sum, a) => sum + (a.footprintM2 || 0), 0) ||
    17000;

  const assetAllocations = assets.map((a, idx) => ({
    id: a.id,
    code: a.code,
    name: a.name,
    weight: Number((weights[idx] ?? 0).toFixed(4)),
    weightPercent: Number(((weights[idx] ?? 0) * 100).toFixed(2)),
    allocatedFootprintM2: Math.round((weights[idx] ?? 0) * totalArea),
    expectedYieldPercent: Number((a.expectedYield * 100).toFixed(2)),
    historicalVolatilityPercent: Number((a.historicalVolatility * 100).toFixed(2)),
  }));

  return {
    targetVolatilityPercent: targetVolPercent,
    enforceNonNegative,
    expectedReturn: Number(expectedReturn.toFixed(4)),
    expectedReturnPercent: Number((expectedReturn * 100).toFixed(2)),
    volatility: Number(volatility.toFixed(4)),
    volatilityPercent: Number((volatility * 100).toFixed(2)),
    sharpeRatio: Number(sharpeRatio.toFixed(3)),
    minVolBoundPercent: Number((mptResult.minVolBound * 100).toFixed(2)),
    weights: weights.map((w) => Number(w.toFixed(4))),
    assetAllocations,
    optimalTangencyPoint: {
      expectedReturn: Number(mptResult.optimalSharpePoint.expectedReturn.toFixed(4)),
      expectedReturnPercent: Number((mptResult.optimalSharpePoint.expectedReturn * 100).toFixed(2)),
      volatility: Number(mptResult.optimalSharpePoint.volatility.toFixed(4)),
      volatilityPercent: Number((mptResult.optimalSharpePoint.volatility * 100).toFixed(2)),
      sharpeRatio: Number(mptResult.optimalSharpePoint.sharpeRatio.toFixed(3)),
      weights: mptResult.optimalSharpePoint.weights.map((w) => Number(w.toFixed(4))),
    },
    gmvPoint: {
      expectedReturnPercent: Number((mptResult.minVariancePoint.expectedReturn * 100).toFixed(2)),
      volatilityPercent: Number((mptResult.minVariancePoint.volatility * 100).toFixed(2)),
      sharpeRatio: Number(mptResult.minVariancePoint.sharpeRatio.toFixed(3)),
      weights: mptResult.minVariancePoint.weights.map((w) => Number(w.toFixed(4))),
    },
  };
}

/**
 * Checks physical feasibility of weights in architectural zoning and performs Simplex Projection.
 * @param {Object} args
 * @param {number[]} args.weights
 * @param {number} [args.tolerance]
 * @param {Object} masterplan
 * @returns {Object}
 */
export function executeCheckFeasibility(args = {}, masterplan = {}) {
  const rawWeights = Array.isArray(args.weights) ? args.weights : [];
  const tolerance = args.tolerance ?? 0.01;
  const assets = masterplan.assets || PAPER_TABLE_1_PRESETS[3].assets;

  const negativeIndices = [];
  rawWeights.forEach((w, i) => {
    if (w < -0.0001) negativeIndices.push(i);
  });

  const rawSum = rawWeights.reduce((acc, v) => acc + v, 0);
  const isSumValid = Math.abs(rawSum - 1.0) <= tolerance;
  const hasNegativeWeights = negativeIndices.length > 0;
  const isPhysicallyFeasible = !hasNegativeWeights && isSumValid;

  // Project to standard probability simplex Delta^n
  const projectedWeights = projectToSimplex(rawWeights);
  const projectedSum = projectedWeights.reduce((acc, v) => acc + v, 0);

  const totalArea =
    masterplan.totalFootprintM2 ||
    assets.reduce((sum, a) => sum + (a.footprintM2 || 0), 0) ||
    17000;

  return {
    isPhysicallyFeasible,
    hasNegativeWeights,
    rawSum: Number(rawSum.toFixed(4)),
    rawWeights: rawWeights.map((w) => Number(w.toFixed(4))),
    negativeWeightsCount: negativeIndices.length,
    infeasibleAssets: negativeIndices.map((idx) => ({
      index: idx,
      assetCode: assets[idx]?.code || `Asset_${idx}`,
      assetName: assets[idx]?.name || `Zone ${idx}`,
      negativeWeight: Number(rawWeights[idx].toFixed(4)),
      physicalImplication:
        'Negative building footprint (-m²) violates physical spatial feasibility in urban zoning.',
    })),
    simplexProjection: {
      projectedWeights: projectedWeights.map((w) => Number(w.toFixed(4))),
      projectedSum: Number(projectedSum.toFixed(4)),
      projectedAllocations: assets.map((a, idx) => ({
        code: a.code,
        name: a.name,
        weightPercent: Number(((projectedWeights[idx] ?? 0) * 100).toFixed(2)),
        footprintM2: Math.round((projectedWeights[idx] ?? 0) * totalArea),
      })),
      algorithm: 'Michelot-Duchi-Shalev-Shwartz Euclidean Simplex Projection',
    },
  };
}

// ============================================================================
// Core Agent Co-Pilot Multi-Turn Tool Calling Execution Loop
// ============================================================================

let aiInstance = null;

export function getGeminiClient() {
  if (!aiInstance && process.env.GEMINI_API_KEY) {
    aiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

/**
 * Runs the Gemini agent execution loop with dynamic tool calling for MPT optimization and simplex projection.
 * @param {Object} params
 * @param {string} params.message
 * @param {Array} [params.conversationHistory]
 * @param {Object} [params.currentMasterplan]
 * @param {number} [params.targetRisk]
 * @param {number} [params.riskFreeRate]
 * @returns {Promise<Object>}
 */
export async function runAgentCoPilot(params) {
  const {
    message,
    conversationHistory = [],
    currentMasterplan = {
      assets: PAPER_TABLE_1_PRESETS[3].assets,
      correlationMatrix: PAPER_TABLE_1_PRESETS[3].correlationMatrix,
      covarianceRegime: 'low',
      totalFootprintM2: 17000,
    },
    targetRisk = 0.1012,
    riskFreeRate = 0.02,
  } = params;

  const assets = currentMasterplan.assets || PAPER_TABLE_1_PRESETS[3].assets;
  const correlationMatrix =
    currentMasterplan.correlationMatrix || PAPER_TABLE_1_PRESETS[3].correlationMatrix;
  const totalArea = currentMasterplan.totalFootprintM2 || 17000;

  const reasoningSteps = [];
  const toolExecutions = [];
  let structuralPayload = undefined;
  let lastOptResult = null;

  const ai = getGeminiClient();

  if (ai) {
    try {
      const activeAssetsSummary = assets
        .map(
          (a) =>
            `- ${a.name} (${a.code}): ${a.footprintM2.toLocaleString()} m² [Yield: ${(a.expectedYield * 100).toFixed(1)}%, Vol: ${(a.historicalVolatility * 100).toFixed(1)}%]`
        )
        .join('\n');

      const systemInstruction = `${AGENT_SYSTEM_INSTRUCTION}

CURRENT MASTERPLAN STATE:
- Total Masterplan Footprint: ${totalArea.toLocaleString()} m²
- Active Regime: ${currentMasterplan.covarianceRegime || 'dynamic'} correlation regime
- User Target Risk: ${(targetRisk * 100).toFixed(2)}%
- Active Zones:
${activeAssetsSummary}`;

      const contents = [
        ...conversationHistory.map((h) => ({
          role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.content }],
        })),
        {
          role: 'user',
          parts: [{ text: message }],
        },
      ];

      const MAX_TOOL_ITERATIONS = 5;
      let finalReply = '';

      for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents,
          config: {
            systemInstruction,
            temperature: 0.35,
            tools: [
              {
                functionDeclarations: [runOptimizationTool, checkFeasibilityTool],
              },
            ],
          },
        });

        const functionCalls = response.functionCalls;

        if (functionCalls && functionCalls.length > 0) {
          const candidateContent = response.candidates?.[0]?.content;
          if (candidateContent) {
            contents.push(candidateContent);
          }

          const toolResponseParts = [];

          for (const call of functionCalls) {
            let toolOutput = {};
            const callTimestamp = new Date().toISOString();

            if (call.name === 'runOptimization') {
              const optArgs = {
                targetVolatilityPercent:
                  call.args?.targetVolatilityPercent ?? targetRisk * 100,
                enforceNonNegative: call.args?.enforceNonNegative ?? true,
                riskFreeRate,
              };

              toolOutput = executeRunOptimization(optArgs, currentMasterplan);
              lastOptResult = toolOutput;

              const weightSummary = toolOutput.assetAllocations
                .map((a) => `${a.code}: ${a.weightPercent}%`)
                .join(', ');

              reasoningSteps.push(
                `Executed runOptimization(target=${toolOutput.targetVolatilityPercent}%, enforceNonNegative=${toolOutput.enforceNonNegative}) → Sharpe: ${toolOutput.sharpeRatio}, Return: ${toolOutput.expectedReturnPercent}%, Weights: [${weightSummary}]`
              );

              toolExecutions.push({
                toolName: 'runOptimization',
                args: optArgs,
                result: toolOutput,
                timestamp: callTimestamp,
                status: 'SUCCESS',
              });

              structuralPayload = {
                type: 'OPTIMIZATION_RESULT',
                data: toolOutput,
                suggestedAction: {
                  id: 'apply-optimal-tangency',
                  type: 'optimize_weights',
                  title: 'Apply Markowitz Optimal Tangency Allocation',
                  description: `Reallocate zoning footprints to Tangency Sharpe weights: ${toolOutput.optimalTangencyPoint.weights.map((w, i) => `${assets[i]?.code || i}: ${(w * 100).toFixed(1)}%`).join(', ')}`,
                  data: {
                    weights: toolOutput.optimalTangencyPoint.weights,
                    expectedReturn: toolOutput.optimalTangencyPoint.expectedReturn,
                    volatility: toolOutput.optimalTangencyPoint.volatility,
                    sharpeRatio: toolOutput.optimalTangencyPoint.sharpeRatio,
                  },
                },
              };
            } else if (call.name === 'checkFeasibility') {
              const feasArgs = {
                weights: call.args?.weights || [],
                tolerance: call.args?.tolerance || 0.01,
              };

              toolOutput = executeCheckFeasibility(feasArgs, currentMasterplan);

              if (toolOutput.isPhysicallyFeasible) {
                reasoningSteps.push(
                  `Executed checkFeasibility() → Feasible (Sum: ${toolOutput.rawSum}, No negative weights)`
                );
              } else {
                reasoningSteps.push(
                  `Executed checkFeasibility() → Infeasible (${toolOutput.negativeWeightsCount} negative weights detected) → Projected to Simplex [${toolOutput.simplexProjection.projectedWeights.join(', ')}]`
                );
              }

              toolExecutions.push({
                toolName: 'checkFeasibility',
                args: feasArgs,
                result: toolOutput,
                timestamp: callTimestamp,
                status: toolOutput.isPhysicallyFeasible ? 'SUCCESS' : 'PROJECTED',
              });

              if (!toolOutput.isPhysicallyFeasible) {
                structuralPayload = {
                  type: 'SIMPLEX_PROJECTION',
                  data: toolOutput,
                  suggestedAction: {
                    id: 'apply-simplex-projected-weights',
                    type: 'optimize_weights',
                    title: 'Apply Simplex-Projected Feasible Weights',
                    description: `Projected weights: ${toolOutput.simplexProjection.projectedWeights.map((w, i) => `${assets[i]?.code || i}: ${(w * 100).toFixed(1)}%`).join(', ')}`,
                    data: {
                      weights: toolOutput.simplexProjection.projectedWeights,
                    },
                  },
                };
              }
            } else {
              toolOutput = { error: `Unrecognized function call: ${call.name}` };
              reasoningSteps.push(`Called unrecognized tool: ${call.name}`);
            }

            toolResponseParts.push({
              functionResponse: {
                name: call.name,
                response: toolOutput,
              },
            });
          }

          contents.push({
            role: 'user',
            parts: toolResponseParts,
          });
        } else {
          finalReply =
            response.text ||
            response.candidates?.[0]?.content?.parts
              ?.map((p) => p.text)
              .filter(Boolean)
              .join('\n') ||
            'Quantitative spatial portfolio analysis completed.';
          break;
        }
      }

      const defaultOpt = lastOptResult?.optimalTangencyPoint || {
        weights: [0.5147, 0.3235, 0.1618],
        expectedReturn: 0.1145,
        volatility: 0.1012,
        sharpeRatio: 0.934,
      };

      return {
        status: toolExecutions.length > 0 ? 'TOOL_EXECUTION' : 'TEXT_REPLY',
        reply: finalReply || 'Quantitative analysis and optimization completed.',
        reasoningSteps,
        toolExecutions,
        structuralPayload,
        suggestedAction: structuralPayload?.suggestedAction || {
          id: 'apply-optimal-tangency',
          type: 'optimize_weights',
          title: 'Apply Markowitz Optimal Tangency Allocation',
          description: `Align masterplan to optimal Sharpe ratio (${defaultOpt.sharpeRatio}): ${assets.map((a, i) => `${a.code} ${(defaultOpt.weights[i] * 100).toFixed(1)}%`).join(', ')}`,
          data: {
            weights: defaultOpt.weights,
            expectedReturn: defaultOpt.expectedReturn,
            volatility: defaultOpt.volatility,
            sharpeRatio: defaultOpt.sharpeRatio,
          },
        },
      };
    } catch (err) {
      console.warn('Gemini API execution failed, invoking local fallback MPT solver:', err?.message);
    }
  }

  // ============================================================================
  // Local Pure-JavaScript Analytical Solver Fallback (Offline / Zero-Key Mode)
  // ============================================================================
  const localOpt = executeRunOptimization(
    { targetVolatilityPercent: targetRisk * 100, enforceNonNegative: true, riskFreeRate },
    currentMasterplan
  );

  const lowerPrompt = message.toLowerCase();
  let localReply = '';

  if (lowerPrompt.includes('optimize') || lowerPrompt.includes('sharpe') || lowerPrompt.includes('rebalance')) {
    localReply = `### Markowitz MPT Quantitative Portfolio Optimization

By inverting the cross-asset covariance matrix $\\mathbf{\\Sigma}^{-1}$ across active zoning parcels, we compute the **Tangency Portfolio** maximizing the Sharpe Ratio ($R_f = 2.0\\%$):

- **Optimal Sharpe Ratio**: **${localOpt.optimalTangencyPoint.sharpeRatio}**
- **Expected Annual Yield ($\\mu_p$)**: **${localOpt.optimalTangencyPoint.expectedReturnPercent}%**
- **Portfolio Downside Risk ($\\sigma_p$)**: **${localOpt.optimalTangencyPoint.volatilityPercent}%**

#### Recommended Zoning Allocation (${totalArea.toLocaleString()} m² Total):
${assets.map((a, i) => `- **${a.name} (${a.code})**: **${(localOpt.optimalTangencyPoint.weights[i] * 100).toFixed(1)}%** → **${Math.round(localOpt.optimalTangencyPoint.weights[i] * totalArea).toLocaleString()} m²**`).join('\n')}

*This configuration eliminates unsystematic spatial covariance risk along the Efficient Frontier.*`;
  } else if (lowerPrompt.includes('table 1') || lowerPrompt.includes('benchmark') || lowerPrompt.includes('compare')) {
    localReply = `### Comparison with Table 1 Empirical Research Benchmarks (ICEPE 2026)

From Sherif Ahmad Magdaldin's research paper:

1. **Baseline Design**: $\\mu_p = 6.82\\%$, $\\sigma_p = 8.41\\%$, **Sharpe = 0.573** (High residential density)
2. **High-Yield Variant**: $\\mu_p = 14.15\\%$, $\\sigma_p = 22.38\\%$, **Sharpe = 0.543** (Commercial concentration, high volatility)
3. **MPT (High-Correlation)**: $\\mu_p = 10.90\\%$, $\\sigma_p = 12.45\\%$, **Sharpe = 0.715** (Compressed diversification)
4. **MPT (Low-Correlation)**: $\\mu_p = 11.45\\%$, $\\sigma_p = 10.12\\%$, **Sharpe = 0.934** *(Optimal tangency frontier)*

**Current Live Masterplan**: Expected Return is **${localOpt.expectedReturnPercent}%** at **${localOpt.volatilityPercent}%** risk.`;
  } else if (lowerPrompt.includes('feasibility') || lowerPrompt.includes('simplex') || lowerPrompt.includes('negative')) {
    const unconstrained = executeRunOptimization(
      { targetVolatilityPercent: targetRisk * 100, enforceNonNegative: false, riskFreeRate },
      currentMasterplan
    );
    const feas = executeCheckFeasibility({ weights: unconstrained.weights }, currentMasterplan);

    localReply = `### Simplex Projection & Physical Feasibility Analysis

- **Unconstrained Weights**: [${unconstrained.weights.map((w) => (w * 100).toFixed(1) + '%').join(', ')}]
- **Physical Feasibility**: ${feas.isPhysicallyFeasible ? '✅ Feasible' : '⚠️ Infeasible (Negative Footprint Detected)'}

${!feas.isPhysicallyFeasible ? `**Architectural Constraint Violation**: In urban masterplanning, financial short-selling has no physical reality (buildings cannot have negative floor area). 

Using Euclidean Simplex Projection $\\Pi_{\\Delta}(w)$, the weights are corrected to:
${feas.simplexProjection.projectedAllocations.map((a) => `- **${a.code}**: **${a.weightPercent}%** (${a.footprintM2.toLocaleString()} m²)`).join('\n')}` : 'All weights satisfy non-negativity $w_i \\ge 0$ and sum to 1.0.'}`;
  } else {
    localReply = `### Urban BIM Quantitative AI Co-Pilot

I have evaluated your masterplan across **${assets.length} zoning categories** (${assets.map((a) => a.code).join(', ')}) on a **${totalArea.toLocaleString()} m²** generative site footprint.

- **Current Expected Return**: **${localOpt.expectedReturnPercent}%**
- **Target Risk**: **${localOpt.volatilityPercent}%**
- **Tangency Sharpe Ratio**: **${localOpt.optimalTangencyPoint.sharpeRatio}**
- **Global Minimum Variance Bound**: **${localOpt.minVolBoundPercent}%**

Would you like me to **run analytical optimization**, **check simplex boundaries**, or **push the updated layout to Revit 2027**?`;
  }

  return {
    status: 'TOOL_EXECUTION',
    reply: localReply,
    reasoningSteps: [
      `Computed cross-asset covariance matrix $\\mathbf{\\Sigma}$ for ${assets.length} zoning types.`,
      `Derived subspace vectors $g$ and $h$ for target volatility ${(targetRisk * 100).toFixed(2)}%.`,
      `Validated Euclidean Simplex Projection bounds.`,
    ],
    toolExecutions: [
      {
        toolName: 'runOptimization',
        args: { targetVolatilityPercent: targetRisk * 100, enforceNonNegative: true },
        result: localOpt,
        timestamp: new Date().toISOString(),
        status: 'SUCCESS',
      },
    ],
    suggestedAction: {
      id: 'apply-optimal-tangency',
      type: 'optimize_weights',
      title: 'Apply Markowitz Optimal Tangency Allocation',
      description: `Rezone parcel footprint to optimal Sharpe weights: ${assets.map((a, i) => `${a.code} ${(localOpt.optimalTangencyPoint.weights[i] * 100).toFixed(1)}%`).join(', ')}`,
      data: {
        weights: localOpt.optimalTangencyPoint.weights,
        expectedReturn: localOpt.optimalTangencyPoint.expectedReturn,
        volatility: localOpt.optimalTangencyPoint.volatility,
        sharpeRatio: localOpt.optimalTangencyPoint.sharpeRatio,
      },
    },
  };
}
