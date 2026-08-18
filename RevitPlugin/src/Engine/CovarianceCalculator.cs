using System;
using System.Collections.Generic;
using RevitMPTOptimizer.Models;

namespace RevitMPTOptimizer.Engine
{
    /// <summary>
    /// Regime describing how strongly different zone types (residential,
    /// commercial, industrial) move together financially. Mirrors the
    /// "High Corr." vs "Low Corr." scenarios in Table 1 of the paper.
    /// </summary>
    public enum CorrelationRegime
    {
        LowCorrelation,
        HighCorrelation
    }

    /// <summary>
    /// Builds the variance-covariance matrix (Sigma) from each asset's
    /// individual historical volatility plus an assumed cross-zone
    /// correlation structure. In a production deployment the pairwise
    /// correlations would be estimated from a real historical price/rent
    /// series (see paper Section 4, "Future Horizons" - live pricing feed);
    /// here they are exposed as explicit, editable coefficients so the
    /// assumption is never hidden inside a black box.
    /// </summary>
    public static class CovarianceCalculator
    {
        // Default cross-zone correlation coefficients. Editable by the user
        // via the command's options dialog before a run.
        private static readonly Dictionary<(ZoneType, ZoneType), double> LowCorrTable = new()
        {
            [(ZoneType.Residential, ZoneType.Commercial)] = 0.15,
            [(ZoneType.Residential, ZoneType.Industrial)] = 0.05,
            [(ZoneType.Commercial, ZoneType.Industrial)] = 0.10,
        };

        private static readonly Dictionary<(ZoneType, ZoneType), double> HighCorrTable = new()
        {
            [(ZoneType.Residential, ZoneType.Commercial)] = 0.80,
            [(ZoneType.Residential, ZoneType.Industrial)] = 0.65,
            [(ZoneType.Commercial, ZoneType.Industrial)] = 0.75,
        };

        public static double[,] Build(IReadOnlyList<DesignAsset> assets, CorrelationRegime regime)
        {
            int n = assets.Count;
            var table = regime == CorrelationRegime.LowCorrelation ? LowCorrTable : HighCorrTable;
            var sigma = new double[n, n];

            for (int i = 0; i < n; i++)
            {
                for (int j = 0; j < n; j++)
                {
                    if (i == j)
                    {
                        sigma[i, j] = Math.Pow(assets[i].HistoricalVolatility, 2);
                        continue;
                    }

                    double rho = GetCorrelation(table, assets[i].Zone, assets[j].Zone);
                    sigma[i, j] = rho * assets[i].HistoricalVolatility * assets[j].HistoricalVolatility;
                }
            }

            return sigma;
        }

        private static double GetCorrelation(Dictionary<(ZoneType, ZoneType), double> table, ZoneType a, ZoneType b)
        {
            if (a == b) return 1.0;
            if (table.TryGetValue((a, b), out var rho)) return rho;
            if (table.TryGetValue((b, a), out rho)) return rho;
            return 0.0; // Unknown pair: assume uncorrelated rather than guessing.
        }
    }
}
