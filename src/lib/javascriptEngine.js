/**
 * Generates standalone, clean, ES6+ / Node.js & Browser-compatible JavaScript (.js)
 * mathematical core implementing Markowitz Modern Portfolio Theory analytical solver,
 * Matrix Inversion, and Generative BIM Spatial Allocation without TypeScript annotations.
 */
export function generatePureJavaScriptEngine(
  assets,
  targetRisk,
  correlationMatrix,
  customTotalSiteArea
) {
  const totalSiteArea = customTotalSiteArea || assets.reduce((sum, a) => sum + (a.footprintM2 || 0), 0) || 17000;
  const assetObjects = JSON.stringify(
    assets.map((a) => ({
      name: a.name,
      code: a.code,
      type: a.type,
      footprintM2: a.footprintM2,
      expectedYield: a.expectedYield,
      historicalVolatility: a.historicalVolatility,
      floors: a.floors,
      color: a.color
    })),
    null,
    2
  );

  const corrJson = JSON.stringify(correlationMatrix, null, 2);

  return `/**
 * =========================================================================================================
 * GENERATIVE URBAN BIM MODERN PORTFOLIO THEORY (MPT) OPTIMIZER - PURE JAVASCRIPT ENGINE (ES6 / NODE.JS)
 * Research Base: "Modern Portfolio Theory in Generative Urban BIM Layouts" (Magdaldin, 2026)
 * Language: Pure JavaScript (ES6+ / CommonJS / Browser compatible) - No TypeScript syntax
 * =========================================================================================================
 */

// 1. Masterplan Asset Class Definitions & Parameters
const ASSET_CLASSES = ${assetObjects};

// 2. Correlation Matrix Between Asset Classes (\\rho_ij)
const CORRELATION_MATRIX = ${corrJson};

// 3. Target Risk Constraint (\\sigma_p)
const TARGET_RISK_BOUND = ${targetRisk.toFixed(4)};
const RISK_FREE_RATE = 0.02; // 2.0%

/**
 * High-performance Gaussian elimination matrix inversion with partial pivoting.
 * Inverts an N x N covariance matrix \\Sigma into \\Sigma^-1.
 * 
 * @param {number[][]} matrix - N x N square numeric matrix
 * @returns {number[][]} - Inverted N x N matrix
 */
function invertMatrix(matrix) {
  const n = matrix.length;
  const augmented = matrix.map((row, i) => {
    const identityRow = new Array(n).fill(0);
    identityRow[i] = 1.0;
    return [...row, ...identityRow];
  });

  for (let i = 0; i < n; i++) {
    // Search for pivot row with highest absolute value in column i
    let pivotRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[pivotRow][i])) {
        pivotRow = k;
      }
    }

    // Swap current row with pivot row
    if (pivotRow !== i) {
      const temp = augmented[i];
      augmented[i] = augmented[pivotRow];
      augmented[pivotRow] = temp;
    }

    const pivotVal = augmented[i][i];
    if (Math.abs(pivotVal) < 1e-12) {
      throw new Error("Singular covariance matrix encountered; inversion failed.");
    }

    // Normalize pivot row
    for (let j = 0; j < 2 * n; j++) {
      augmented[i][j] /= pivotVal;
    }

    // Eliminate other rows
    for (let k = 0; k < n; k++) {
      if (k === i) continue;
      const factor = augmented[k][i];
      for (let j = 0; j < 2 * n; j++) {
        augmented[k][j] -= factor * augmented[i][j];
      }
    }
  }

  // Extract inverted N x N matrix from the right side of the augmented matrix
  return augmented.map(row => row.slice(n));
}

/**
 * Calculates vector dot product: a^T * b
 */
function dotProduct(vecA, vecB) {
  return vecA.reduce((sum, val, idx) => sum + val * vecB[idx], 0);
}

/**
 * Multiplies an N x N Matrix by an N x 1 Vector: M * v
 */
function matrixMultiplyVector(matrix, vector) {
  return matrix.map(row => dotProduct(row, vector));
}

/**
 * Computes exact Markowitz Modern Portfolio Theory analytical solution
 * using hyperbola parameters A, B, C, and determinant D.
 * 
 * @param {Array} assets - Array of spatial zoning asset objects
 * @param {number[][]} corrMatrix - Correlation matrix
 * @param {number} targetRisk - Maximum acceptable portfolio volatility \\sigma_p
 * @param {number} rf - Risk-free rate (e.g. 0.02)
 * @returns {Object} Analytical MPT results, optimal weights, Sharpe ratio, and curve metrics
 */
function solveMarkowitzAnalytical(assets, corrMatrix, targetRisk = 0.095, rf = 0.02) {
  const n = assets.length;
  
  // Vector of expected rental yields: R
  const R = assets.map(a => a.expectedYield);
  
  // Vector of ones: 1
  const ones = new Array(n).fill(1.0);

  // Construct N x N Covariance Matrix: \\Sigma_ij = \\rho_ij * \\sigma_i * \\sigma_j
  const sigma = [];
  for (let i = 0; i < n; i++) {
    sigma[i] = [];
    for (let j = 0; j < n; j++) {
      const rho = (i === j) ? 1.0 : (corrMatrix[i] && corrMatrix[i][j] !== undefined ? corrMatrix[i][j] : 0.15);
      sigma[i][j] = rho * assets[i].historicalVolatility * assets[j].historicalVolatility;
    }
  }

  // Calculate Inverse Covariance Matrix: \\Sigma^-1
  const sigmaInv = invertMatrix(sigma);

  // Compute intermediate transformation vectors
  const invSigmaOnes = matrixMultiplyVector(sigmaInv, ones); // \\Sigma^-1 * 1
  const invSigmaR = matrixMultiplyVector(sigmaInv, R);       // \\Sigma^-1 * R

  // Compute the 4 analytical scalar components (Listing 1):
  const A = dotProduct(ones, invSigmaR);       // 1^T * \\Sigma^-1 * R
  const B = dotProduct(R, invSigmaR);          // R^T * \\Sigma^-1 * R
  const C = dotProduct(ones, invSigmaOnes);    // 1^T * \\Sigma^-1 * 1
  const D = (B * C) - (A * A);                 // Parabolic determinant (B*C - A^2)

  // Global Minimum Variance portfolio bounds
  const minVolBound = 1.0 / Math.sqrt(C);
  const minVolReturn = A / C;

  // Subspace basis vectors g and h
  const vectorG = [];
  const vectorH = [];
  for (let i = 0; i < n; i++) {
    vectorG[i] = (invSigmaOnes[i] * (B / D)) - (invSigmaR[i] * (A / D));
    vectorH[i] = (invSigmaR[i] * (C / D)) - (invSigmaOnes[i] * (A / D));
  }

  // Global Minimum Variance (GMV) Weights: w_min = (\\Sigma^-1 * 1) / C
  const minVarianceWeights = invSigmaOnes.map(val => val / C);

  // Maximum Sharpe Tangency Portfolio: w_tan = (\\Sigma^-1 * (R - rf * 1)) / (1^T * \\Sigma^-1 * (R - rf * 1))
  const excessReturns = R.map(r => r - rf);
  const invSigmaExcess = matrixMultiplyVector(sigmaInv, excessReturns);
  const sumExcess = dotProduct(ones, invSigmaExcess);
  const optimalSharpeWeights = invSigmaExcess.map(val => val / sumExcess);

  // Target risk allocation: evaluate target return along efficient frontier
  const effectiveRisk = Math.max(targetRisk, minVolBound);
  const term = Math.max(0, D * (effectiveRisk * effectiveRisk * C - 1.0));
  const targetReturn = (A + Math.sqrt(term)) / C;

  // Final allocation vector w = g + h * \\mu_target
  const targetWeights = vectorG.map((gVal, idx) => gVal + vectorH[idx] * targetReturn);

  // Portfolio volatility for given weights
  const calcPortfolioVol = (weights) => {
    let variance = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        variance += weights[i] * weights[j] * sigma[i][j];
      }
    }
    return Math.sqrt(Math.max(0, variance));
  };

  const currentVol = calcPortfolioVol(targetWeights);
  const currentSharpe = currentVol > 0 ? (targetReturn - rf) / currentVol : 0;

  return {
    scalarMetrics: {
      scalarA: A,
      scalarB: B,
      scalarC: C,
      determinantD: D,
      minVolBound: minVolBound,
      returnAtMinVol: minVolReturn
    },
    vectors: {
      vectorG: vectorG,
      vectorH: vectorH
    },
    optimalSharpePoint: {
      weights: optimalSharpeWeights,
      expectedReturn: dotProduct(optimalSharpeWeights, R),
      volatility: calcPortfolioVol(optimalSharpeWeights),
      sharpeRatio: (dotProduct(optimalSharpeWeights, R) - rf) / calcPortfolioVol(optimalSharpeWeights)
    },
    minVariancePoint: {
      weights: minVarianceWeights,
      expectedReturn: minVolReturn,
      volatility: minVolBound,
      sharpeRatio: (minVolReturn - rf) / minVolBound
    },
    targetRiskAllocation: {
      targetRisk: effectiveRisk,
      targetReturn: targetReturn,
      weights: targetWeights,
      computedVolatility: currentVol,
      sharpeRatio: currentSharpe
    },
    covarianceMatrix: sigma,
    inverseCovarianceMatrix: sigmaInv
  };
}

/**
 * 4. Sample Execution in JavaScript Runtime
 */
const results = solveMarkowitzAnalytical(ASSET_CLASSES, CORRELATION_MATRIX, TARGET_RISK_BOUND, RISK_FREE_RATE);

console.log("================================================================================");
console.log("MARKOWITZ MODERN PORTFOLIO THEORY RESULTS (PURE JAVASCRIPT)");
console.log("================================================================================");
console.log(\`Analytical Scalars: A=\${results.scalarMetrics.scalarA.toFixed(4)}, B=\${results.scalarMetrics.scalarB.toFixed(4)}, C=\${results.scalarMetrics.scalarC.toFixed(4)}, Det(D)=\${results.scalarMetrics.determinantD.toFixed(4)}\`);
console.log(\`Global Min Variance (GMV) Volatility Bound: \${(results.scalarMetrics.minVolBound * 100).toFixed(2)}%\`);
console.log(\`Optimal Tangency Sharpe Ratio: \${results.optimalSharpePoint.sharpeRatio.toFixed(3)}\`);
console.log("--------------------------------------------------------------------------------");
console.log("Optimal Asset Class Allocation (Target Risk: " + (TARGET_RISK_BOUND * 100).toFixed(2) + "%):");
ASSET_CLASSES.forEach((asset, idx) => {
  const weightPct = (results.targetRiskAllocation.weights[idx] * 100).toFixed(2);
  const footprintM2 = Math.round(results.targetRiskAllocation.weights[idx] * ${totalSiteArea});
  console.log(\`  - [\${asset.code}] \${asset.name.padEnd(28)} : \${weightPct.padStart(6)}%  (\${footprintM2.toLocaleString()} m²)\`);
});
console.log("================================================================================");

// Export for Node.js CommonJS or ES6 Module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    solveMarkowitzAnalytical,
    invertMatrix,
    dotProduct,
    matrixMultiplyVector,
    ASSET_CLASSES,
    CORRELATION_MATRIX
  };
}
`;
}

/**
 * Generates Autodesk Revit / Rhino.Inside JavaScript (Node.js/JScript.NET) bridge script.
 */
export function generateRevitJavaScriptWebhookClient(
  endpointUrl = 'http://localhost:8080/revit-mpt-bridge/'
) {
  return `/**
 * Autodesk Revit 2027 HTTP Webhook Client (Pure JavaScript)
 * Transmits real-time generative zoning payloads from any JavaScript environment.
 */
const http = require('http');

async function syncLayoutToRevit(payload, endpoint = "${endpointUrl}") {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);
    const data = JSON.stringify(payload);

    const options = {
      hostname: url.hostname,
      port: url.port || 8080,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(responseBody);
          resolve(json);
        } catch (e) {
          resolve({ status: res.statusCode, raw: responseBody });
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error("Could not connect to Revit 2027 bridge: " + err.message));
    });

    req.write(data);
    req.end();
  });
}

module.exports = { syncLayoutToRevit };
`;
}
