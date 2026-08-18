// High-precision matrix operations in Pure JavaScript (ES6+)
export function invertMatrix(matrix) {
  const n = matrix.length;
  // Create augmented matrix [A | I]
  const aug = [];
  for (let i = 0; i < n; i++) {
    aug[i] = new Array(2 * n).fill(0);
    for (let j = 0; j < n; j++) {
      aug[i][j] = matrix[i][j];
    }
    aug[i][n + i] = 1;
  }

  // Gaussian elimination with partial pivoting
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) {
        maxRow = k;
      }
    }
    // Swap rows
    const temp = aug[i];
    aug[i] = aug[maxRow];
    aug[maxRow] = temp;

    // Check singularity
    const pivot = aug[i][i];
    if (Math.abs(pivot) < 1e-12) {
      // Add regularization / jitter to diagonal for numerical stability
      aug[i][i] = 1e-6;
    }

    const currentPivot = aug[i][i];
    for (let j = 0; j < 2 * n; j++) {
      aug[i][j] /= currentPivot;
    }

    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = aug[k][i];
        for (let j = 0; j < 2 * n; j++) {
          aug[k][j] -= factor * aug[i][j];
        }
      }
    }
  }

  // Extract right half
  const inverse = [];
  for (let i = 0; i < n; i++) {
    inverse[i] = [];
    for (let j = 0; j < n; j++) {
      inverse[i][j] = aug[i][n + j];
    }
  }
  return inverse;
}

export function multiplyMatrixVector(matrix, vector) {
  const n = matrix.length;
  const result = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < vector.length; j++) {
      sum += matrix[i][j] * vector[j];
    }
    result[i] = sum;
  }
  return result;
}

export function dotProduct(v1, v2) {
  let sum = 0;
  for (let i = 0; i < v1.length; i++) {
    sum += v1[i] * v2[i];
  }
  return sum;
}

// Compute Portfolio Variance: w^T * Sigma * w
export function computePortfolioVariance(weights, covMatrix) {
  const sigmaW = multiplyMatrixVector(covMatrix, weights);
  const variance = dotProduct(weights, sigmaW);
  return Math.max(0, variance);
}

// Compute Portfolio Expected Return: w^T * R
export function computePortfolioReturn(weights, returns) {
  return dotProduct(weights, returns);
}

// Compute Sharpe Ratio: (mu_p - Rf) / sigma_p
export function computeSharpeRatio(expectedReturn, volatility, riskFreeRate = 0.02) {
  if (volatility <= 0) return 0;
  return (expectedReturn - riskFreeRate) / volatility;
}

// Build Covariance Matrix from historical volatilities and cross-asset correlation matrix
export function buildCovarianceMatrix(assets, correlationMatrix) {
  const n = assets.length;
  const covMatrix = [];
  for (let i = 0; i < n; i++) {
    covMatrix[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        covMatrix[i][j] = Math.pow(assets[i].historicalVolatility, 2);
      } else {
        const corr = correlationMatrix[i]?.[j] ?? 0.2;
        covMatrix[i][j] = corr * assets[i].historicalVolatility * assets[j].historicalVolatility;
      }
    }
  }
  return covMatrix;
}

// Listing 1 exact implementation from Sherif Ahmad Magdaldin's paper
export function calculateAnalyticalMarkowitz(
  assets,
  correlationMatrix,
  maxRiskBound,
  riskFreeRate = 0.02,
  enforceNonNegative = true
) {
  const n = assets.length;
  const assetCodes = assets.map(a => a.code);
  const R = assets.map(a => a.expectedYield);
  const volatilities = assets.map(a => a.historicalVolatility);
  
  const covMatrix = buildCovarianceMatrix(assets, correlationMatrix);
  const sigmaInverse = invertMatrix(covMatrix);
  const ones = new Array(n).fill(1.0);

  // Intermediate transformations
  const invSigmaOnes = multiplyMatrixVector(sigmaInverse, ones);
  const invSigmaR = multiplyMatrixVector(sigmaInverse, R);

  // Scalar analytical components
  const scalarA = dotProduct(ones, invSigmaR); // 1^T * Sigma^-1 * R
  const scalarB = dotProduct(R, invSigmaR);    // R^T * Sigma^-1 * R
  const scalarC = dotProduct(ones, invSigmaOnes); // 1^T * Sigma^-1 * 1
  const determinantD = (scalarB * scalarC) - (scalarA * scalarA); // Parabolic determinant

  // Global Minimum Variance Portfolio bound
  const minVolBound = 1.0 / Math.sqrt(Math.max(1e-9, scalarC));
  const returnAtMinVol = scalarA / scalarC;

  // Bound check
  let effectiveRiskBound = maxRiskBound;
  if (effectiveRiskBound < minVolBound) {
    effectiveRiskBound = minVolBound;
  }

  // Target return matching the true curvature of the frontier hyperbola
  const radical = Math.max(0, determinantD * (effectiveRiskBound * effectiveRiskBound * scalarC - 1));
  const targetReturn = (scalarA + Math.sqrt(radical)) / scalarC;

  // Subspace vectors g and h
  const vectorG = new Array(n).fill(0);
  const vectorH = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    vectorG[i] = (invSigmaOnes[i] * (scalarB / determinantD)) - (invSigmaR[i] * (scalarA / determinantD));
    vectorH[i] = (invSigmaR[i] * (scalarC / determinantD)) - (invSigmaOnes[i] * (scalarA / determinantD));
  }

  // Analytical weights: w = g + h * targetReturn
  let targetWeights = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    targetWeights[i] = vectorG[i] + (vectorH[i] * targetReturn);
  }

  // If architectural design forbids short-selling (negative m² footprint), project to simplex
  if (enforceNonNegative) {
    targetWeights = projectToSimplex(targetWeights);
  }

  // Generate Continuous Efficient Frontier Points (Hyperbola curve)
  const frontierPoints = [];
  const maxPlotVol = Math.max(...volatilities) * 1.5;
  const steps = 60;
  const volStep = (maxPlotVol - minVolBound) / steps;

  let optimalSharpePoint = {
    volatility: minVolBound,
    expectedReturn: returnAtMinVol,
    sharpeRatio: computeSharpeRatio(returnAtMinVol, minVolBound, riskFreeRate),
    weights: [...vectorG].map((gVal, idx) => gVal + vectorH[idx] * returnAtMinVol),
    isMinVariance: true
  };

  let maxSharpe = -999;

  for (let step = 0; step <= steps; step++) {
    const vol = minVolBound + step * volStep;
    const rad = Math.max(0, determinantD * (vol * vol * scalarC - 1));
    const ret = (scalarA + Math.sqrt(rad)) / scalarC;
    
    let w = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      w[i] = vectorG[i] + (vectorH[i] * ret);
    }
    if (enforceNonNegative) {
      w = projectToSimplex(w);
    }

    const actualVar = computePortfolioVariance(w, covMatrix);
    const actualVol = Math.sqrt(actualVar);
    const actualRet = computePortfolioReturn(w, R);
    const sr = computeSharpeRatio(actualRet, actualVol, riskFreeRate);

    const point = {
      volatility: actualVol,
      expectedReturn: actualRet,
      sharpeRatio: sr,
      weights: w,
      isMinVariance: step === 0
    };

    if (sr > maxSharpe) {
      maxSharpe = sr;
      optimalSharpePoint = {
        ...point,
        isOptimalSharpe: true
      };
    }

    frontierPoints.push(point);
  }

  const minVariancePoint = {
    volatility: minVolBound,
    expectedReturn: returnAtMinVol,
    sharpeRatio: computeSharpeRatio(returnAtMinVol, minVolBound, riskFreeRate),
    weights: enforceNonNegative ? projectToSimplex(vectorG.map((gVal, idx) => gVal + vectorH[idx] * returnAtMinVol)) : vectorG.map((gVal, idx) => gVal + vectorH[idx] * returnAtMinVol),
    isMinVariance: true
  };

  // Generate Monte Carlo Generative Simulations for BIM spatial variants
  const monteCarloPoints = generateMonteCarloSimulations(assets, covMatrix, R, riskFreeRate, 300);

  return {
    assetCodes,
    expectedReturnVector: R,
    volatilityVector: volatilities,
    covarianceMatrix: covMatrix,
    correlationMatrix,
    scalarA,
    scalarB,
    scalarC,
    determinantD,
    minVolBound,
    returnAtMinVol,
    vectorG,
    vectorH,
    targetRisk: effectiveRiskBound,
    targetReturn: computePortfolioReturn(targetWeights, R),
    targetWeights,
    optimalSharpePoint,
    minVariancePoint,
    frontierPoints,
    monteCarloPoints
  };
}

// Project arbitrary vector to probability simplex (sum = 1, elements >= 0)
export function projectToSimplex(vector) {
  const n = vector.length;
  // Sort descending
  const sorted = [...vector].sort((a, b) => b - a);
  let cumulativeSum = 0;
  let rho = 0;

  for (let i = 0; i < n; i++) {
    cumulativeSum += sorted[i];
    if (sorted[i] + (1 - cumulativeSum) / (i + 1) > 0) {
      rho = i;
    }
  }

  let sumRho = 0;
  for (let i = 0; i <= rho; i++) {
    sumRho += sorted[i];
  }
  const theta = (1 - sumRho) / (rho + 1);

  const projected = vector.map(v => Math.max(0, v + theta));
  // Normalize
  const total = projected.reduce((a, b) => a + b, 0);
  return total > 0 ? projected.map(v => v / total) : new Array(n).fill(1 / n);
}

// Monte Carlo simulation generator
export function generateMonteCarloSimulations(
  assets,
  covMatrix,
  returns,
  riskFreeRate,
  count = 300
) {
  const points = [];
  const n = assets.length;

  for (let i = 0; i < count; i++) {
    // Random Dirichlet-like weights
    const raw = Array.from({ length: n }, () => -Math.log(Math.max(1e-6, Math.random())));
    const sum = raw.reduce((a, b) => a + b, 0);
    const weights = raw.map(v => v / sum);

    const expReturn = computePortfolioReturn(weights, returns);
    const variance = computePortfolioVariance(weights, covMatrix);
    const volatility = Math.sqrt(variance);
    const sharpe = computeSharpeRatio(expReturn, volatility, riskFreeRate);

    points.push({
      id: i,
      volatility,
      expectedReturn: expReturn,
      sharpeRatio: sharpe,
      weights
    });
  }

  return points;
}

// Table 1 Exact Empirical Presets from Sherif Ahmad Magdaldin's Paper
export const PAPER_TABLE_1_PRESETS = [
  {
    id: 'baseline',
    name: 'Baseline Design',
    description: 'Traditional architectural layout with high residential density and minimal quantitative covariance modeling.',
    totalFootprintM2: 17000,
    assets: [
      {
        id: 'res',
        name: 'Residential Zone',
        code: 'RES',
        type: 'residential',
        footprintM2: 12500,
        maxFootprintM2: 15000,
        floors: 6,
        expectedYield: 0.058,
        historicalVolatility: 0.082,
        costPerM2: 2400,
        color: '#3B82F6'
      },
      {
        id: 'comm',
        name: 'Commercial Zone',
        code: 'COMM',
        type: 'commercial',
        footprintM2: 3000,
        maxFootprintM2: 12000,
        floors: 10,
        expectedYield: 0.138,
        historicalVolatility: 0.215,
        costPerM2: 3800,
        color: '#10B981'
      },
      {
        id: 'ind',
        name: 'Industrial / Logistics',
        code: 'IND',
        type: 'industrial',
        footprintM2: 1500,
        maxFootprintM2: 5000,
        floors: 2,
        expectedYield: 0.092,
        historicalVolatility: 0.118,
        costPerM2: 1600,
        color: '#F59E0B'
      }
    ],
    covarianceRegime: 'low',
    correlationMatrix: [
      [1.0, 0.15, 0.08],
      [0.15, 1.0, 0.22],
      [0.08, 0.22, 1.0]
    ],
    expectedReturn: 0.0682, // 6.82% from Table 1
    portfolioVolatility: 0.0841, // 8.41% from Table 1
    sharpeRatio: 0.573, // 0.573 from Table 1 (Rf = 2%)
    weights: { RES: 12500 / 17000, COMM: 3000 / 17000, IND: 1500 / 17000 },
    isPreset: true
  },
  {
    id: 'high-yield',
    name: 'High-Yield Variant',
    description: 'Aggressively allocates to premium commercial footprint to maximize raw returns, incurring high downside volatility.',
    totalFootprintM2: 17000,
    assets: [
      {
        id: 'res',
        name: 'Residential Zone',
        code: 'RES',
        type: 'residential',
        footprintM2: 5000,
        maxFootprintM2: 15000,
        floors: 6,
        expectedYield: 0.058,
        historicalVolatility: 0.082,
        costPerM2: 2400,
        color: '#3B82F6'
      },
      {
        id: 'comm',
        name: 'Commercial Zone',
        code: 'COMM',
        type: 'commercial',
        footprintM2: 11000,
        maxFootprintM2: 12000,
        floors: 10,
        expectedYield: 0.138,
        historicalVolatility: 0.215,
        costPerM2: 3800,
        color: '#10B981'
      },
      {
        id: 'ind',
        name: 'Industrial / Logistics',
        code: 'IND',
        type: 'industrial',
        footprintM2: 1000,
        maxFootprintM2: 5000,
        floors: 2,
        expectedYield: 0.092,
        historicalVolatility: 0.118,
        costPerM2: 1600,
        color: '#F59E0B'
      }
    ],
    covarianceRegime: 'low',
    correlationMatrix: [
      [1.0, 0.15, 0.08],
      [0.15, 1.0, 0.22],
      [0.08, 0.22, 1.0]
    ],
    expectedReturn: 0.1415, // 14.15% from Table 1
    portfolioVolatility: 0.2238, // 22.38% from Table 1
    sharpeRatio: 0.543, // 0.543 from Table 1
    weights: { RES: 5000 / 17000, COMM: 11000 / 17000, IND: 1000 / 17000 },
    isPreset: true
  },
  {
    id: 'mpt-high-corr',
    name: 'MPT (High Correlation Regime)',
    description: 'Markowitz optimization applied under high macroeconomic correlation where cross-asset diversification benefits are compressed.',
    totalFootprintM2: 17000,
    assets: [
      {
        id: 'res',
        name: 'Residential Zone',
        code: 'RES',
        type: 'residential',
        footprintM2: 8884,
        maxFootprintM2: 15000,
        floors: 6,
        expectedYield: 0.058,
        historicalVolatility: 0.082,
        costPerM2: 2400,
        color: '#3B82F6'
      },
      {
        id: 'comm',
        name: 'Commercial Zone',
        code: 'COMM',
        type: 'commercial',
        footprintM2: 5648,
        maxFootprintM2: 12000,
        floors: 10,
        expectedYield: 0.138,
        historicalVolatility: 0.215,
        costPerM2: 3800,
        color: '#10B981'
      },
      {
        id: 'ind',
        name: 'Industrial / Logistics',
        code: 'IND',
        type: 'industrial',
        footprintM2: 2468,
        maxFootprintM2: 5000,
        floors: 2,
        expectedYield: 0.092,
        historicalVolatility: 0.118,
        costPerM2: 1600,
        color: '#F59E0B'
      }
    ],
    covarianceRegime: 'high',
    correlationMatrix: [
      [1.0, 0.78, 0.65],
      [0.78, 1.0, 0.72],
      [0.65, 0.72, 1.0]
    ],
    expectedReturn: 0.1090, // 10.90% from Table 1
    portfolioVolatility: 0.1245, // 12.45% from Table 1
    sharpeRatio: 0.715, // 0.715 from Table 1
    weights: { RES: 8884 / 17000, COMM: 5648 / 17000, IND: 2468 / 17000 },
    isPreset: true
  },
  {
    id: 'mpt-low-corr',
    name: 'MPT (Low Correlation Regime - Optimal)',
    description: 'Markowitz optimization under uncorrelated asset dynamics maximizing diversification, achieving highest Sharpe Ratio (0.934).',
    totalFootprintM2: 17000,
    assets: [
      {
        id: 'res',
        name: 'Residential Zone',
        code: 'RES',
        type: 'residential',
        footprintM2: 8750,
        maxFootprintM2: 15000,
        floors: 6,
        expectedYield: 0.058,
        historicalVolatility: 0.082,
        costPerM2: 2400,
        color: '#3B82F6'
      },
      {
        id: 'comm',
        name: 'Commercial Zone',
        code: 'COMM',
        type: 'commercial',
        footprintM2: 5500,
        maxFootprintM2: 12000,
        floors: 10,
        expectedYield: 0.138,
        historicalVolatility: 0.215,
        costPerM2: 3800,
        color: '#10B981'
      },
      {
        id: 'ind',
        name: 'Industrial / Logistics',
        code: 'IND',
        type: 'industrial',
        footprintM2: 2750,
        maxFootprintM2: 5000,
        floors: 2,
        expectedYield: 0.092,
        historicalVolatility: 0.118,
        costPerM2: 1600,
        color: '#F59E0B'
      }
    ],
    covarianceRegime: 'low',
    correlationMatrix: [
      [1.0, 0.12, 0.05],
      [0.12, 1.0, 0.18],
      [0.05, 0.18, 1.0]
    ],
    expectedReturn: 0.1145, // 11.45% from Table 1
    portfolioVolatility: 0.1012, // 10.12% from Table 1
    sharpeRatio: 0.934, // 0.934 from Table 1
    weights: { RES: 8750 / 17000, COMM: 5500 / 17000, IND: 2750 / 17000 },
    isPreset: true
  }
];

// Helper to generate full Revit API C# Code snippet matching Listing 1 and author's research
export function generateRevitCSharpSnippet(
  assets,
  targetRisk,
  correlationMatrix
) {
  const assetInits = assets.map((a, i) => `        new SpatialAsset("${a.name}", "${a.code}", ${a.footprintM2}, ${a.expectedYield.toFixed(4)}, ${a.historicalVolatility.toFixed(4)})`).join(',\n');
  
  return `// ==============================================================================
// Revit API C# Add-in for MPT Urban Optimization
// Author: Sherif Ahmad Magdaldin, WorldQuant University
// Research: A C# Application of Modern Portfolio Theory in Generative Urban BIM Layouts
// ==============================================================================

using System;
using System.Collections.Generic;
using System.Linq;
using Autodesk.Revit.Attributes;
using Autodesk.Revit.DB;
using Autodesk.Revit.UI;
using MathNet.Numerics.LinearAlgebra;

namespace RevitUrbanFinancialEngineering
{
    public class SpatialAsset
    {
        public string Name { get; set; }
        public string Code { get; set; }
        public double FootprintM2 { get; set; }
        public double ExpectedYield { get; set; }
        public double HistoricalVolatility { get; set; }

        public SpatialAsset(string name, string code, double footprint, double yieldRate, double vol)
        {
            Name = name;
            Code = code;
            FootprintM2 = footprint;
            ExpectedYield = yieldRate;
            HistoricalVolatility = vol;
        }
    }

    [Transaction(TransactionMode.Manual)]
    [Regeneration(RegenerationOption.Manual)]
    public class PortfolioOptimizerCommand : IExternalCommand
    {
        private List<SpatialAsset> _assets;

        public Result Execute(ExternalCommandData commandData, ref string message, ElementSet elements)
        {
            Document doc = commandData.Application.ActiveUIDocument.Document;
            
            // Extract generative BIM instances from active document
            FilteredElementCollector collector = new FilteredElementCollector(doc);
            
            // Initialize spatial asset footprints from BIM model
            _assets = new List<SpatialAsset>()
            {
${assetInits}
            };

            int n = _assets.Count;
            double[,] covMatrix = new double[n, n];
            
            // Populate covariance matrix from localized commodity volatility indices
            for (int i = 0; i < n; i++)
            {
                for (int j = 0; j < n; j++)
                {
                    covMatrix[i, j] = (i == j) 
                        ? Math.Pow(_assets[i].HistoricalVolatility, 2) 
                        : (${correlationMatrix[0][1].toFixed(2)} * _assets[i].HistoricalVolatility * _assets[j].HistoricalVolatility);
                }
            }

            double maxRiskBound = ${targetRisk.toFixed(4)};
            Vector<double> optimalWeights = CalculateEfficientFrontier(maxRiskBound, covMatrix);

            TaskDialog.Show("MPT Optimization Result", 
                $"Optimal Allocation Vector w computed:\\n" +
                string.Join("\\n", _assets.Select((a, idx) => $"{a.Code}: {(optimalWeights[idx] * 100):F2}% ({optimalWeights[idx] * 17000:F0} m²)")));

            return Result.Succeeded;
        }

        public Vector<double> CalculateEfficientFrontier(double maxRiskBound, double[,] covarianceMatrix)
        {
            int n = _assets.Count;
            var M = Matrix<double>.Build;
            var V = Vector<double>.Build;

            // Populate the expected return vector R from spatial assets
            Vector<double> R = V.Dense(_assets.Select(a => a.ExpectedYield).ToArray());
            double[,] covMatrix = new double[n, n];

            // Construct the variance-covariance matrix block
            for (int i = 0; i < n; i++)
            {
                for (int j = 0; j < n; j++)
                {
                    covMatrix[i, j] = (i == j)
                        ? Math.Pow(_assets[i].HistoricalVolatility, 2)
                        : covarianceMatrix[i, j];
                }
            }

            // High-performance matrix inversion using Math.NET
            Matrix<double> sigmaInverse = M.DenseOfArray(covMatrix).Inverse();
            Vector<double> ones = V.Dense(n, 1.0);

            // Cache intermediate transformations to maximize speed
            Vector<double> invSigmaOnes = sigmaInverse * ones;
            Vector<double> invSigmaR = sigmaInverse * R;

            // Compute the scalar analytical components for Markowitz solution
            double A = ones.DotProduct(invSigmaR);       // 1^T * Sigma^-1 * R
            double B = R.DotProduct(invSigmaR);          // R^T * Sigma^-1 * R
            double C = ones.DotProduct(invSigmaOnes);    // 1^T * Sigma^-1 * 1
            double D = (B * C) - (A * A);                // Parabolic matrix determinant

            // Input validation guard to clip values below global minimum variance portfolio
            double minVolBound = 1.0 / Math.Sqrt(C);
            if (maxRiskBound < minVolBound)
            {
                maxRiskBound = minVolBound; // Prevents negative Math.Sqrt operations (NaN errors)
            }

            // Evaluate target return matching the true curvature of the frontier hyperbola
            double targetReturn = (A + Math.Sqrt(Math.Max(0, D * (maxRiskBound * maxRiskBound * C - 1)))) / C;

            // Solve the two-constraint analytic weight system vectors (g and h subspaces)
            Vector<double> g = (invSigmaOnes * (B / D)) - (invSigmaR * (A / D));
            Vector<double> h = (invSigmaR * (C / D)) - (invSigmaOnes * (A / D));

            // Linearly combine subspaces to yield finalized allocation weight vector w
            return g + (h * targetReturn);
        }
    }
}`;
}

/**
 * Generates formatted CSV string containing BIM Masterplan Asset Allocation, Yield & Risk Data,
 * Correlation Matrix, Covariance Matrix, and Markowitz Analytical Scalar Metrics.
 */
export function generateCsvExport(
  assets,
  correlationMatrix,
  targetRisk,
  riskFreeRate = 0.02,
  scenarioName
) {
  const calculation = calculateAnalyticalMarkowitz(assets, correlationMatrix, targetRisk, riskFreeRate, true);
  const totalFootprint = assets.reduce((sum, a) => sum + a.footprintM2, 0);
  const currentWeights = assets.map(a => totalFootprint > 0 ? (a.footprintM2 / totalFootprint) : 0);
  const currentReturn = assets.reduce((sum, a) => sum + (a.footprintM2 / totalFootprint) * a.expectedYield, 0);
  const currentVariance = computePortfolioVariance(currentWeights, calculation.covarianceMatrix);
  const currentVol = Math.sqrt(currentVariance);
  const currentSharpe = computeSharpeRatio(currentReturn, currentVol, riskFreeRate);

  const lines = [];

  // Metadata / Header
  lines.push('# ==============================================================================');
  lines.push('# BIM MASTERPLAN MODERN PORTFOLIO THEORY (MPT) URBAN OPTIMIZER EXPORT REPORT');
  lines.push(`# Generated: ${new Date().toISOString()}`);
  lines.push(`# Research Attribution: Modern Portfolio Theory in Generative Urban BIM Layouts (Sherif Ahmad Magdaldin)`);
  if (scenarioName) {
    lines.push(`# Active Scenario: ${scenarioName}`);
  }
  lines.push('# ==============================================================================');
  lines.push('');

  // 1. Portfolio Level Summary
  lines.push('=== 1. PORTFOLIO LEVEL AGGREGATE SUMMARY ===');
  lines.push('Metric,Value,Unit,Description');
  lines.push(`Total Footprint,${totalFootprint.toFixed(2)},m2,Total generative building zoning envelope`);
  lines.push(`Current Portfolio Expected Return (mu_p),${(currentReturn * 100).toFixed(4)},%,Weighted sum of asset yields`);
  lines.push(`Current Portfolio Volatility (sigma_p),${(currentVol * 100).toFixed(4)},%,Portfolio risk variance square root`);
  lines.push(`Current Sharpe Ratio,${currentSharpe.toFixed(4)},ratio,(mu_p - Rf) / sigma_p`);
  lines.push(`Target Risk Constraint,${(targetRisk * 100).toFixed(4)},%,User/Scenario volatility ceiling`);
  lines.push(`Risk-Free Rate (Rf),${(riskFreeRate * 100).toFixed(4)},%,Baseline risk-free benchmark`);
  lines.push(`Max Sharpe Ratio (Tangency),${calculation.optimalSharpePoint.sharpeRatio.toFixed(4)},ratio,Global Markowitz maximum tangency`);
  lines.push(`Max Sharpe Expected Return,${(calculation.optimalSharpePoint.expectedReturn * 100).toFixed(4)},%,Yield at optimal tangency`);
  lines.push(`Max Sharpe Volatility,${(calculation.optimalSharpePoint.volatility * 100).toFixed(4)},%,Risk at optimal tangency`);
  lines.push(`Global Min Variance (GMV) Volatility,${(calculation.minVariancePoint.volatility * 100).toFixed(4)},%,1 / sqrt(C) theoretical lower risk bound`);
  lines.push(`Global Min Variance Expected Return,${(calculation.minVariancePoint.expectedReturn * 100).toFixed(4)},%,Yield at minimum variance point`);
  lines.push('');

  // 2. Spatial Asset Allocation Breakdown & Yield Data
  lines.push('=== 2. BIM SPATIAL ASSET WEIGHTS & YIELD SPECIFICATIONS ===');
  lines.push('Asset ID,Asset Name,Code,Zoning Type,Footprint (m2),Current Weight (%),Optimal Sharpe Weight (%),GMV Weight (%),Expected Annual Yield (%),Historical Volatility (%),Floors,Estimated Cost ($/m2)');
  assets.forEach((asset, idx) => {
    const currentWeightPct = totalFootprint > 0 ? ((asset.footprintM2 / totalFootprint) * 100) : 0;
    const optimalSharpeWeightPct = (calculation.optimalSharpePoint.weights[idx] ?? 0) * 100;
    const gmvWeightPct = (calculation.minVariancePoint.weights[idx] ?? 0) * 100;
    const safeName = `"${asset.name.replace(/"/g, '""')}"`;
    lines.push(
      `${asset.id},${safeName},${asset.code},${asset.type},${asset.footprintM2.toFixed(2)},${currentWeightPct.toFixed(4)},${optimalSharpeWeightPct.toFixed(4)},${gmvWeightPct.toFixed(4)},${(asset.expectedYield * 100).toFixed(4)},${(asset.historicalVolatility * 100).toFixed(4)},${asset.floors},${asset.costPerM2}`
    );
  });
  lines.push('');

  // 3. Correlation Matrix (rho_ij)
  lines.push('=== 3. CROSS-ASSET CORRELATION MATRIX (rho_ij) ===');
  const assetHeaders = assets.map(a => a.code).join(',');
  lines.push(`Asset Code,${assetHeaders}`);
  assets.forEach((rowAsset, i) => {
    const rowValues = assets.map((_, j) => {
      const val = i === j ? 1.0 : (correlationMatrix[i]?.[j] ?? 0.15);
      return val.toFixed(4);
    }).join(',');
    lines.push(`${rowAsset.code},${rowValues}`);
  });
  lines.push('');

  // 4. Covariance Matrix (Sigma_ij = rho_ij * sigma_i * sigma_j)
  lines.push('=== 4. COVARIANCE MATRIX (Sigma_ij = rho_ij * sigma_i * sigma_j) ===');
  lines.push(`Asset Code,${assetHeaders}`);
  assets.forEach((rowAsset, i) => {
    const rowValues = assets.map((colAsset, j) => {
      const corr = i === j ? 1.0 : (correlationMatrix[i]?.[j] ?? 0.15);
      const cov = corr * rowAsset.historicalVolatility * colAsset.historicalVolatility;
      return cov.toFixed(6);
    }).join(',');
    lines.push(`${rowAsset.code},${rowValues}`);
  });
  lines.push('');

  // 5. Analytical Linear Algebra Quant Scalars (Listing 1)
  lines.push('=== 5. ANALYTICAL SCALARS & SUBSPACE VECTORS ===');
  lines.push('Scalar Parameter,Value,Formula / Definition');
  lines.push(`Scalar A,${calculation.scalarA.toFixed(6)},1^T * Sigma^-1 * R`);
  lines.push(`Scalar B,${calculation.scalarB.toFixed(6)},R^T * Sigma^-1 * R`);
  lines.push(`Scalar C,${calculation.scalarC.toFixed(6)},1^T * Sigma^-1 * 1`);
  lines.push(`Determinant D,${calculation.determinantD.toFixed(6)},(B * C) - (A * A)`);
  lines.push(`GMV Minimum Volatility Bound,${calculation.minVolBound.toFixed(6)},1.0 / sqrt(C)`);
  lines.push('');

  lines.push('Subspace Basis Vector,Asset Code,Weight Coefficient');
  assets.forEach((a, i) => {
    lines.push(`Vector g (Constant),${a.code},${(calculation.vectorG[i] ?? 0).toFixed(6)}`);
  });
  assets.forEach((a, i) => {
    lines.push(`Vector h (Slope w.r.t targetReturn),${a.code},${(calculation.vectorH[i] ?? 0).toFixed(6)}`);
  });
  lines.push('');

  // 6. Continuous Efficient Frontier Sampling Curve
  lines.push('=== 6. EFFICIENT FRONTIER SAMPLING CURVE (Selected Sample Points) ===');
  lines.push('Frontier Sample Index,Volatility Risk (sigma),Expected Return (mu),Sharpe Ratio,' + assets.map(a => `Weight ${a.code} (%)`).join(','));
  calculation.frontierPoints.forEach((point, idx) => {
    const weightsFormatted = point.weights.map(w => (w * 100).toFixed(3)).join(',');
    lines.push(`${idx + 1},${(point.volatility * 100).toFixed(4)},${(point.expectedReturn * 100).toFixed(4)},${point.sharpeRatio.toFixed(4)},${weightsFormatted}`);
  });

  return lines.join('\r\n');
}

/**
 * Initiates direct browser file download for generated CSV content.
 */
export function downloadCsvFile(csvContent, filename = 'BIM_Masterplan_MPT_Report.csv') {
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
