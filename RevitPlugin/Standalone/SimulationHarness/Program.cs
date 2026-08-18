using System;
using System.Collections.Generic;
using RevitMPTOptimizer.Engine;
using RevitMPTOptimizer.Models;

// Standalone reproduction of the paper's Section 3 simulation experiment
// (Table 1: Baseline / High-Yield / MPT High-Corr / MPT Low-Corr scenarios)
// using the exact same Engine classes the Revit add-in calls. This lets you
// sanity-check the math on any machine with the .NET SDK -- no Revit
// installation or license required.

const double riskFreeRate = 0.02;

var assets = new List<DesignAsset>
{
    new DesignAsset
    {
        Id = "res-01", Name = "Residential Block", Zone = ZoneType.Residential,
        FootprintArea = 8750, ExpectedYield = 0.068, HistoricalVolatility = 0.084
    },
    new DesignAsset
    {
        Id = "com-01", Name = "Commercial Podium", Zone = ZoneType.Commercial,
        FootprintArea = 5500, ExpectedYield = 0.095, HistoricalVolatility = 0.135
    },
    new DesignAsset
    {
        Id = "ind-01", Name = "Industrial Storage", Zone = ZoneType.Industrial,
        FootprintArea = 2750, ExpectedYield = 0.078, HistoricalVolatility = 0.110
    },
};

Console.WriteLine("=== Generative BIM Portfolio Optimizer — Standalone Simulation Harness ===\n");
Console.WriteLine($"{"Zone",-14} {"Area (m2)",10} {"Yield",8} {"Volatility",11}");
foreach (var a in assets)
    Console.WriteLine($"{a.Zone,-14} {a.FootprintArea,10:0} {a.ExpectedYield,8:P1} {a.HistoricalVolatility,11:P1}");

RunScenario("MPT (High Correlation)", assets, CorrelationRegime.HighCorrelation);
RunScenario("MPT (Low Correlation)", assets, CorrelationRegime.LowCorrelation);

Console.WriteLine("\nReference figures from the paper's Table 1:");
Console.WriteLine("  MPT (High Corr.)  ->  return 10.90%  volatility 12.45%  Sharpe 0.715");
Console.WriteLine("  MPT (Low Corr.)   ->  return 11.45%  volatility 10.12%  Sharpe 0.934");
Console.WriteLine("\nNote: exact figures will differ from the paper because the underlying");
Console.WriteLine("correlation coefficients and per-zone rate assumptions are illustrative");
Console.WriteLine("placeholders (see Engine/CovarianceCalculator.cs and MarketProxyCalculator.cs),");
Console.WriteLine("not a real historical price series. Adjust those tables to calibrate.");

static void RunScenario(string label, List<DesignAsset> assets, CorrelationRegime regime)
{
    var covariance = CovarianceCalculator.Build(assets, regime);
    var engine = new PortfolioEngine(assets, covariance);
    var best = engine.FindMaxSharpePortfolio(riskFreeRate: 0.02, resolution: 2000);

    Console.WriteLine($"\n--- {label} ---");
    Console.WriteLine($"Global min-variance portfolio: sigma={engine.MinVarianceVolatility:P2}  mu={engine.MinVarianceReturn:P2}");
    Console.WriteLine($"Max-Sharpe (tangency) portfolio:");
    Console.WriteLine($"  Expected return : {best.ExpectedReturn:P2}");
    Console.WriteLine($"  Volatility      : {best.Volatility:P2}");
    Console.WriteLine($"  Sharpe ratio    : {best.SharpeRatio:0.000}");
    Console.WriteLine("  Weights:");
    for (int i = 0; i < assets.Count; i++)
        Console.WriteLine($"    {assets[i].Zone,-14} {best.Weights[i],7:P1}");
}
