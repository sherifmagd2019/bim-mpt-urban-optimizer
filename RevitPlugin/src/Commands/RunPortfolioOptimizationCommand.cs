using System;
using Autodesk.Revit.Attributes;
using Autodesk.Revit.DB;
using Autodesk.Revit.UI;
using RevitMPTOptimizer.Data;
using RevitMPTOptimizer.Engine;
using RevitMPTOptimizer.UI;

namespace RevitMPTOptimizer.Commands
{
    /// <summary>
    /// Ribbon command: "Optimize Layout Portfolio". Pulls generative design
    /// instances from the active document, builds the MPT engine, and
    /// launches the Efficient Frontier window (Fig. 1's full data-flow
    /// loop: middleware -> quantitative engine -> graphical feedback).
    /// </summary>
    [Transaction(TransactionMode.ReadOnly)]
    [Regeneration(RegenerationOption.Manual)]
    public class RunPortfolioOptimizationCommand : IExternalCommand
    {
        public Result Execute(ExternalCommandData commandData, ref string message, ElementSet elements)
        {
            UIDocument uiDoc = commandData.Application.ActiveUIDocument;
            Document doc = uiDoc.Document;

            try
            {
                var selectedIds = uiDoc.Selection.GetElementIds();
                var extractor = new RevitElementExtractor();
                var assets = extractor.ExtractAssets(doc, selectedIds.Count > 0 ? selectedIds : null);

                if (assets.Count < 2)
                {
                    message = "At least two tagged design assets are required to build a portfolio frontier " +
                               $"(found {assets.Count}). Tag more generative options with '{RevitElementExtractor.ZoneParameterName}'.";
                    TaskDialog.Show("Portfolio Optimizer", message);
                    return Result.Failed;
                }

                var covariance = CovarianceCalculator.Build(assets, CorrelationRegime.LowCorrelation);
                var engine = new PortfolioEngine(assets, covariance);

                var window = new EfficientFrontierWindow(assets, engine);
                window.ShowDialog();

                return Result.Succeeded;
            }
            catch (InvalidOperationException ex)
            {
                message = ex.Message;
                TaskDialog.Show("Portfolio Optimizer", ex.Message);
                return Result.Failed;
            }
            catch (Exception ex)
            {
                message = ex.Message;
                TaskDialog.Show("Portfolio Optimizer — Unexpected Error", ex.ToString());
                return Result.Failed;
            }
        }
    }
}
