// =========================================================================================================
// Application.cs - Autodesk Revit 2027 Native Ribbon Tab, Status Notice Bar & Command Hub
// Research: "Modern Portfolio Theory in Generative Urban BIM Layouts" (Sherif Ahmad Magdaldin, ICEPE 2026)
// Target: Autodesk Revit 2027 (.NET 8.0 Windows x64) - 100% Pure Native Revit API
// =========================================================================================================

using System;
using System.Reflection;
using Autodesk.Revit.UI;
using RevitMptOptimizer.Commands;
using RevitMptOptimizer.Core;

namespace RevitMptOptimizer
{
    public class Application : IExternalApplication
    {
        private static TextBox? _statusNoticeBox;
        private static RibbonPanel? _mainPanel;

        public Result OnStartup(UIControlledApplication application)
        {
            try
            {
                CreateRibbonTab(application);
                AsyncRevitLayoutHandler.Initialize();
                
                // Automatically start the background HTTP listener on port 8080 immediately upon Revit launch
                LiveBridgeServer.Start();
                RibbonStatusManager.UpdateNotice("🟢 Bridge: Connected (Port 8080)");

                return Result.Succeeded;
            }
            catch (Exception ex)
            {
                TaskDialog.Show("FinBIM MPT Startup Error", ex.Message);
                return Result.Failed;
            }
        }

        public Result OnShutdown(UIControlledApplication application)
        {
            try
            {
                LiveBridgeServer.Stop();
                return Result.Succeeded;
            }
            catch
            {
                return Result.Failed;
            }
        }

        private void CreateRibbonTab(UIControlledApplication application)
        {
            string tabName = "FinBIM MPT";
            string panelName = "Generative Optimizer";

            // Create Ribbon Tab
            try
            {
                application.CreateRibbonTab(tabName);
            }
            catch
            {
                // Tab already exists if add-in was reloaded
            }

            _mainPanel = application.CreateRibbonPanel(tabName, panelName);

            string thisAssemblyPath = Assembly.GetExecutingAssembly().Location;

            // 1. Toggle Live Bridge Command Button
            PushButtonData connectBtnData = new PushButtonData(
                "cmdToggleLiveBridge",
                "Connect\nBridge",
                thisAssemblyPath,
                typeof(ToggleLiveBridgeCommand).FullName
            )
            {
                ToolTip = "Connects / Disconnects two-way HTTP Live Bridge on port 8080.",
                LongDescription = "Starts a background non-blocking HttpListener with CORS support. Listens for Markowitz simplex layout modifications from React web interface."
            };

            // 2. Real-time Status Notice Display Box
            TextBoxData statusNoticeData = new TextBoxData("txtRibbonStatusNotice")
            {
                ToolTip = "Real-time Live Sync Notice Display",
                LongDescription = "Displays live connection status and zoning synchronization timestamps automatically updated from React."
            };

            // 3. Generate Local MPT Layout Command Button
            PushButtonData generateBtnData = new PushButtonData(
                "cmdGenerateMptLayout",
                "Solve MPT\n& Generate",
                thisAssemblyPath,
                typeof(GenerateMptLayoutCommand).FullName
            )
            {
                ToolTip = "Solves Markowitz portfolio risk-return simplex and instantiates 3D DirectShapes.",
                LongDescription = "Executes quadratic programming to calculate optimal spatial allocations and creates parametric DirectShape massing blocks."
            };

            // 4. Push Revit Model Elements to React Web App
            PushButtonData pushModelBtnData = new PushButtonData(
                "cmdPushModelToReact",
                "Push Data\nto React",
                thisAssemblyPath,
                typeof(PushModelToReactCommand).FullName
            )
            {
                ToolTip = "Harvests Revit model zoning elements and pushes data to the React UI.",
                LongDescription = "Extracts footprint areas, floor counts, and zoning asset codes and streams them to the web optimizer via HTTP POST."
            };

            // Add Controls to Ribbon Panel
            _mainPanel.AddItem(connectBtnData);
            _statusNoticeBox = (TextBox)_mainPanel.AddItem(statusNoticeData);
            _statusNoticeBox.Value = "⚡ Bridge: Standby (Port 8080)";
            _statusNoticeBox.Width = 260.0;

            RibbonStatusManager.RegisterNoticeBox(_statusNoticeBox);

            _mainPanel.AddSeparator();
            _mainPanel.AddItem(generateBtnData);
            _mainPanel.AddItem(pushModelBtnData);
        }

        /// <summary>
        /// Global helper to update the Revit ribbon notice display box
        /// </summary>
        public static void UpdateRibbonStatusNotice(string message)
        {
            RibbonStatusManager.UpdateNotice(message);
        }
    }
}
