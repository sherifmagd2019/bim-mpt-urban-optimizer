using System;
using System.Collections.Generic;
using System.Linq;
using RevitMPTOptimizer.Models;

namespace RevitMPTOptimizer.Engine
{
    /// <summary>A single computed point on the efficient frontier.</summary>
    public class FrontierPoint
    {
        public double Volatility { get; set; }      // sigma_p
        public double ExpectedReturn { get; set; }   // mu_p
        public double SharpeRatio { get; set; }
        public double[] Weights { get; set; } = Array.Empty<double>();
    }

    /// <summary>
    /// Analytic mean-variance portfolio optimizer. Solves:
    ///   min_w  sigma_p^2 = w^T * Sigma * w
    ///   s.t.   w^T * 1 = 1 ,  w^T * R = mu_p
    /// via the closed-form two-fund (g, h) decomposition, exactly as in
    /// Section 2.1 / Listing 1 of the paper.
    /// </summary>
    public class PortfolioEngine
    {
        private readonly IReadOnlyList<DesignAsset> _assets;
        private readonly double[,] _sigma;
        private readonly double[] _r;
        private readonly int _n;

        // Cached analytic scalars (A, B, C, D) and subspaces (g, h)
        private readonly double _a, _b, _c, _d;
        private readonly double[] _g, _h;
        private readonly double[,] _sigmaInverse;

        public PortfolioEngine(IReadOnlyList<DesignAsset> assets, double[,] covarianceMatrix)
        {
            if (assets.Count == 0)
                throw new ArgumentException("At least one design asset is required.");
            if (covarianceMatrix.GetLength(0) != assets.Count || covarianceMatrix.GetLength(1) != assets.Count)
                throw new ArgumentException("Covariance matrix dimensions must match the asset count.");

            _assets = assets;
            _sigma = covarianceMatrix;
            _n = assets.Count;
            _r = assets.Select(a => a.ExpectedYield).ToArray();

            _sigmaInverse = MatrixMath.Inverse(_sigma);
            var ones = MatrixMath.Ones(_n);

            var invSigmaOnes = MatrixMath.Multiply(_sigmaInverse, ones);
            var invSigmaR = MatrixMath.Multiply(_sigmaInverse, _r);

            _a = MatrixMath.DotProduct(ones, invSigmaR);   // 1^T Sigma^-1 R
            _b = MatrixMath.DotProduct(_r, invSigmaR);     // R^T Sigma^-1 R
            _c = MatrixMath.DotProduct(ones, invSigmaOnes);// 1^T Sigma^-1 1
            _d = (_b * _c) - (_a * _a);                    // parabola determinant

            if (Math.Abs(_d) < 1e-12)
                throw new InvalidOperationException(
                    "Degenerate frontier (D ~ 0). Expected-yield vector is likely collinear with the unit vector; " +
                    "vary ExpectedYield across assets.");

            _g = MatrixMath.Add(
                MatrixMath.Scale(invSigmaOnes, _b / _d),
                MatrixMath.Scale(invSigmaR, -_a / _d));

            _h = MatrixMath.Add(
                MatrixMath.Scale(invSigmaR, _c / _d),
                MatrixMath.Scale(invSigmaOnes, -_a / _d));
        }

        /// <summary>Volatility of the global minimum-variance portfolio.</summary>
        public double MinVarianceVolatility => 1.0 / Math.Sqrt(_c);

        /// <summary>Expected return of the global minimum-variance portfolio.</summary>
        public double MinVarianceReturn => _a / _c;

        /// <summary>
        /// Computes the weight allocation vector w for a given maximum
        /// acceptable risk bound (portfolio volatility). Faithful port of
        /// the paper's CalculateEfficientFrontier(double, double[,]) method.
        /// </summary>
        public double[] CalculateWeightsForRiskBound(double maxRiskBound)
        {
            double minVolBound = MinVarianceVolatility;
            if (maxRiskBound < minVolBound)
                maxRiskBound = minVolBound; // clip to avoid NaN under the sqrt

            double inner = _d * (maxRiskBound * maxRiskBound * _c - 1);
            double targetReturn = (_a + Math.Sqrt(Math.Max(0, inner))) / _c;

            return MatrixMath.Add(_g, MatrixMath.Scale(_h, targetReturn));
        }

        /// <summary>
        /// Computes the weight allocation vector w for a given *target
        /// return* mu_p directly (the more commonly used dual form of the
        /// same two-fund separation: w = g + h * mu_p).
        /// </summary>
        public double[] CalculateWeightsForTargetReturn(double targetReturn) =>
            MatrixMath.Add(_g, MatrixMath.Scale(_h, targetReturn));

        public double PortfolioVolatility(double[] weights)
        {
            var sw = MatrixMath.Multiply(_sigma, weights);
            return Math.Sqrt(Math.Max(0, MatrixMath.DotProduct(weights, sw)));
        }

        public double PortfolioReturn(double[] weights) => MatrixMath.DotProduct(weights, _r);

        /// <summary>
        /// Sweeps the efficient frontier from the minimum-variance point up
        /// to maxReturnMultiple * (max single-asset expected yield), and
        /// returns evenly spaced (return, risk, Sharpe, weights) samples.
        /// This produces the curve that gets rendered in the Efficient
        /// Frontier window (Fig. 1, "GRAPHICAL FEEDBACK" block).
        /// </summary>
        public List<FrontierPoint> GenerateFrontier(int sampleCount, double riskFreeRate, double maxReturnMultiple = 1.15)
        {
            if (sampleCount < 2) sampleCount = 2;

            double minReturn = MinVarianceReturn;
            double maxReturn = _r.Max() * maxReturnMultiple;
            if (maxReturn <= minReturn) maxReturn = minReturn * 1.5 + 0.01;

            var points = new List<FrontierPoint>(sampleCount);
            for (int i = 0; i < sampleCount; i++)
            {
                double t = i / (double)(sampleCount - 1);
                double targetReturn = minReturn + t * (maxReturn - minReturn);
                var w = CalculateWeightsForTargetReturn(targetReturn);
                double vol = PortfolioVolatility(w);
                double ret = PortfolioReturn(w);
                double sharpe = vol > 1e-9 ? (ret - riskFreeRate) / vol : 0.0;

                points.Add(new FrontierPoint
                {
                    Volatility = vol,
                    ExpectedReturn = ret,
                    SharpeRatio = sharpe,
                    Weights = w
                });
            }
            return points;
        }

        /// <summary>
        /// Finds the tangency ("max Sharpe ratio") portfolio on the frontier
        /// -- the layout mix that maximizes yield per unit of downside risk,
        /// per the paper's stated design goal.
        /// </summary>
        public FrontierPoint FindMaxSharpePortfolio(double riskFreeRate, int resolution = 500)
        {
            var frontier = GenerateFrontier(resolution, riskFreeRate);
            return frontier.OrderByDescending(p => p.SharpeRatio).First();
        }

        public IReadOnlyList<DesignAsset> Assets => _assets;
    }
}
