using System;
using RevitMPTOptimizer.Models;

namespace RevitMPTOptimizer.Engine
{
    /// <summary>
    /// Converts raw geometric/zone data pulled from a Revit element into
    /// the financial inputs (ExpectedYield, HistoricalVolatility,
    /// EstimatedCost) that the PortfolioEngine needs. The paper's
    /// "Future Horizons" section notes this should eventually be sourced
    /// from a live pricing API; until that's wired up, this class exposes
    /// simple, explicit, editable per-zone rate tables rather than hiding
    /// an assumption inside the math.
    /// </summary>
    public class MarketProxyCalculator
    {
        // Illustrative per-m^2 baseline construction cost and annual rental
        // yield assumptions per zone type. Intended to be replaced with the
        // project's own cost-plan / market-study figures before real use.
        private record ZoneRateProfile(double CostPerSqm, double AnnualYieldRate, double BaseVolatility);

        private readonly System.Collections.Generic.Dictionary<ZoneType, ZoneRateProfile> _profiles = new()
        {
            [ZoneType.Residential] = new ZoneRateProfile(CostPerSqm: 1800, AnnualYieldRate: 0.068, BaseVolatility: 0.084),
            [ZoneType.Commercial] = new ZoneRateProfile(CostPerSqm: 2400, AnnualYieldRate: 0.095, BaseVolatility: 0.135),
            [ZoneType.Industrial] = new ZoneRateProfile(CostPerSqm: 1200, AnnualYieldRate: 0.078, BaseVolatility: 0.110),
        };

        /// <summary>
        /// Applies zone rate assumptions to a partially-populated
        /// DesignAsset (Zone, FootprintArea, Volume already set from
        /// Revit geometry) and fills in EstimatedCost, ExpectedYield and
        /// HistoricalVolatility in place.
        /// </summary>
        public void Apply(DesignAsset asset)
        {
            if (!_profiles.TryGetValue(asset.Zone, out var profile))
                throw new ArgumentOutOfRangeException(nameof(asset), $"No rate profile configured for zone '{asset.Zone}'.");

            asset.EstimatedCost = asset.FootprintArea * profile.CostPerSqm;
            asset.ExpectedYield = profile.AnnualYieldRate;

            // Slight volatility premium for compact/oversized footprints,
            // reflecting reduced diversification within a single layout.
            double sizeAdjustment = ScaleFactor(asset.FootprintArea);
            asset.HistoricalVolatility = profile.BaseVolatility * sizeAdjustment;
        }

        private static double ScaleFactor(double footprintArea)
        {
            // Neutral around ~5,000 m^2; smaller footprints get a mild
            // volatility bump (less internal diversification), very large
            // ones taper back down slightly (economies of scale).
            const double neutral = 5000.0;
            double ratio = footprintArea <= 0 ? 1.0 : neutral / footprintArea;
            double adjustment = 1.0 + 0.15 * Math.Tanh(Math.Log(Math.Max(ratio, 1e-6)));
            return Math.Max(0.5, adjustment);
        }
    }
}
