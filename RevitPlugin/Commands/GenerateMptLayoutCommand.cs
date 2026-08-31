using System;
using Autodesk.Revit.Attributes;
using Autodesk.Revit.DB;
using Autodesk.Revit.UI;
using RevitMptOptimizer.Core;

namespace RevitMptOptimizer.Commands
{
    [Transaction(TransactionMode.Manual)]
    [Regeneration(TransactionOption.Manual)]
    public class GenerateMptLayoutCommand : IExternalCommand
    {
        public Result Execute(
            ExternalCommandData commandData, 
            ref string message, 
            ElementSet elements)
        {
            UIApplication uiApp = commandData.Application;
            UIDocument uiDoc = uiApp.ActiveUIDocument;
            Document doc = uiDoc.Document;

            try
            {
                // CRITICAL SAFETY MARSHALING: Validate thread context prior to executing transaction
                if (!uiApp.ActiveUIDocument.Document.IsModifiable)
                {
                    // Thread context check failed; delegate task directly via the Async marshaler proxy
                    AsyncRevitLayoutHandler.Instance.Raise(uiApp);
                    TaskDialog.Show("BIM Sync Handshake", "Asynchronous network request safe-marshaled onto the Revit UI loop thread lifecycle.");
                    return Result.Succeeded;
                }

                // Fallback internal native document execution loop context
                using (Transaction tx = new Transaction(doc, "Generate Autonomous MPT Masterplan Layout"))
                {
                    tx.Start();
                    
                    // Call geometry factory routines
                    // MassSpatialFactory.BuildOptimalMasses(doc, SharedState.TargetAllocationWeights);
                    
                    tx.Commit();
                }

                return Result.Succeeded;
            }
            catch (Exception ex)
            {
                message = $"BIM Thread Execution Pipeline Violation Error: {ex.Message}";
                return Result.Failed;
            }
        }
    }
}
