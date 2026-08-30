// =========================================================================================================
// Commands/ToggleLiveBridgeCommand.cs - Native Autodesk Revit API External Command (Port 8080)
// =========================================================================================================

using Autodesk.Revit.Attributes;
using Autodesk.Revit.DB;
using Autodesk.Revit.UI;
using RevitMptOptimizer.Core;

namespace RevitMptOptimizer.Commands
{
    [Transaction(TransactionMode.Manual)]
    [Regeneration(RegenerationOption.Manual)]
    public class ToggleLiveBridgeCommand : IExternalCommand
    {
        public Result Execute(ExternalCommandData commandData, ref string message, ElementSet elements)
        {
            if (LiveBridgeServer.IsRunning)
            {
                LiveBridgeServer.Stop();
                RibbonStatusManager.UpdateNotice("⚪ Bridge: Stopped");
                TaskDialog.Show("Revit MPT Bridge", "Live HTTP Bridge server stopped.");
            }
            else
            {
                LiveBridgeServer.Start();
                RibbonStatusManager.UpdateNotice("🟢 Bridge: Connected (Port 8080)");
                TaskDialog.Show("Revit MPT Bridge", "Live HTTP Bridge server is now LISTENING on http://localhost:8080/\n\nChanges from React will sync automatically with zero UI hangs.");
            }
            return Result.Succeeded;
        }
    }
}
