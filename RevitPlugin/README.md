# Generative BIM Portfolio Optimizer (Revit Add-in)

A working C# implementation of the system described in *"A C# Application of
Modern Portfolio Theory for Financial Risk-Return Optimization in
Generative Urban BIM Layouts"* (ICICPE 2026). It applies Markowitz Modern
Portfolio Theory to a set of generative BIM design layouts and renders the
resulting efficient frontier as an interactive chart inside Revit.

## What's included

```
RevitMPTOptimizer/
├── RevitMPTOptimizer.addin          Revit add-in manifest
├── RevitMPTOptimizer.csproj         Add-in project (targets net8.0-windows / net48)
├── src/
│   ├── App.cs                       IExternalApplication — ribbon tab/button
│   ├── Commands/
│   │   └── RunPortfolioOptimizationCommand.cs   IExternalCommand entry point
│   ├── Models/
│   │   └── DesignAsset.cs           A generative layout, modeled as a financial asset
│   ├── Engine/
│   │   ├── MatrixMath.cs            Dependency-free matrix inverse/multiply (Gauss-Jordan)
│   │   ├── CovarianceCalculator.cs  Builds Sigma from per-zone volatility + correlation regime
│   │   ├── MarketProxyCalculator.cs Maps geometry → ExpectedYield / HistoricalVolatility
│   │   └── PortfolioEngine.cs       Analytic mean-variance solver (paper's Listing 1, extended)
│   ├── Data/
│   │   └── RevitElementExtractor.cs FilteredElementCollector → DesignAsset extraction
│   └── UI/
│       ├── EfficientFrontierWindow.xaml(.cs)   WPF chart + allocation table
└── Standalone/
    └── SimulationHarness/           Console app that runs the same Engine code
                                      with no Revit dependency, for math validation
```

## How it maps to the paper

| Paper section | Implementation |
|---|---|
| 2.1 Mathematical Model (eq. 1–2) | `PortfolioEngine` — closed-form two-fund (g, h) decomposition |
| 2.2 Architecture Data Flow (Fig. 1) | `RevitElementExtractor` (middleware) → `PortfolioEngine` (quantitative engine) → `EfficientFrontierWindow` (graphical feedback) |
| 2.3 Listing 1 `CalculateEfficientFrontier` | `PortfolioEngine.CalculateWeightsForRiskBound` — same algorithm, ported off Math.NET onto the dependency-free `MatrixMath` helper |
| Table 1 (High Corr. / Low Corr. scenarios) | `CovarianceCalculator.CorrelationRegime` — toggle in the app's combo box, or `Standalone/SimulationHarness` |

## Important design decisions / honesty about assumptions

1. **Zone tagging, not a specific generative-design tool.** The extractor
   only requires a shared parameter `MPT_ZoneType` (Residential / Commercial
   / Industrial) on each option's mass or generic-model instance. It doesn't
   assume Dynamo, Generative Design for Revit, or any particular optioneering
   plugin — whatever produced your variations, just tag the representative
   element per option before running the command.
2. **The "expected yield" and "volatility" numbers are illustrative rate
   tables, not live market data.** The paper itself flags this as future
   work ("Future updates will incorporate direct web API asset pricing
   loops"). `MarketProxyCalculator` and `CovarianceCalculator` expose those
   assumptions as plain, editable tables (`_profiles`, `LowCorrTable`,
   `HighCorrTable`) rather than hard-coding them invisibly — replace them
   with your project's actual cost plan / market study / historical price
   series before using this for real investment decisions.
3. **Math layer has zero external NuGet dependencies.** The paper's listing
   uses Math.NET Numerics; this implementation reimplements the needed
   matrix inverse/multiply directly (`Engine/MatrixMath.cs`) so the add-in
   only depends on `RevitAPI.dll` / `RevitAPIUI.dll` plus WPF. You can swap
   in Math.NET Numerics if you prefer — the call sites are isolated to
   `PortfolioEngine`.

## Building

**Requirements:** Visual Studio 2022 (or `dotnet build`), Revit 2022–2025 SDK
installed locally (for `RevitAPI.dll` / `RevitAPIUI.dll`).

1. Open `RevitMPTOptimizer.csproj`. Edit the `RevitVersion` property (and
   `RevitInstallDir` if your install path differs from
   `C:\Program Files\Autodesk\Revit <version>`).
   - Revit 2025+: `TargetFramework` resolves to `net8.0-windows`.
   - Revit 2022–2024: resolves to `net48`. On these versions, Revit's
     `ElementId.Value` API doesn't exist yet — change the one line in
     `RevitElementExtractor.cs` (`element.Id.Value`) back to
     `element.Id.IntegerValue`.
2. Build (`Ctrl+Shift+B` or `dotnet build -p:RevitVersion=2024`).
3. Copy `RevitMPTOptimizer.addin` and the build output (`RevitMPTOptimizer.dll`
   + dependencies) into
   `%APPDATA%\Autodesk\Revit\Addins\<version>\`, or point the `.addin`'s
   `<Assembly>` path at your build output directly for local testing.
4. Launch Revit → **Financial Engineering** ribbon tab → **Portfolio
   Optimization** panel → **Optimize Layout Portfolio**.

## Validating the math without Revit

```bash
cd Standalone/SimulationHarness
dotnet run
```

This reproduces the paper's Table 1 High-Correlation / Low-Correlation
scenarios end-to-end (covariance build → analytic solve → max-Sharpe search)
using the identical `Engine`/`Models` source files the Revit command calls,
so you can confirm the optimizer's math independently of any BIM data or
Revit license. Expect your numbers to differ slightly from Table 1 unless
you calibrate the rate tables to match the paper's underlying assumptions —
see point 2 above.

## Using it in Revit

1. Build or place generative design option masses/generic models in your model.
2. Add a shared parameter `MPT_ZoneType` (Text) to those categories, and set
   its value to `Residential`, `Commercial`, or `Industrial` on each option.
3. Run **Optimize Layout Portfolio** (optionally pre-select a subset of
   elements first to restrict the asset universe).
4. In the Efficient Frontier window: switch correlation regime, adjust the
   risk-free rate, hover the curve to inspect the weight allocation at any
   risk level, and read off the red **Max Sharpe** marker for the
   risk-adjusted-optimal design mix.
