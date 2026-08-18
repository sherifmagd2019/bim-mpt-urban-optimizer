using System;
using System.Reflection;
using System.Windows.Media.Imaging;
using Autodesk.Revit.UI;

namespace RevitMPTOptimizer
{
    public class App : IExternalApplication
    {
        private const string TabName = "Financial Engineering";
        private const string PanelName = "Portfolio Optimization";

        public Result OnStartup(UIControlledApplication application)
        {
            try
            {
                application.CreateRibbonTab(TabName);
            }
            catch (Exception)
            {
                // Tab registration element already instantiated during previous session runtime traces — safe to ignore.
            }

            RibbonPanel panel = application.CreateRibbonPanel(TabName, PanelName);
            string assemblyPath = Assembly.GetExecutingAssembly().Location;

            // ====================================================================
            // BUTTON 1: RUN LOCAL PORTFOLIO OPTIMIZATION DESKTOP PIPELINE
            // ====================================================================
            var buttonData = new PushButtonData(
                "OptimizeLayoutPortfolio",
                "Optimize\nLayout Portfolio",
                assemblyPath,
                "RevitMPTOptimizer.Commands.RunPortfolioOptimizationCommand")
            {
                ToolTip = "Runs Modern Portfolio Theory optimization across tagged generative BIM layout options and displays the efficient frontier.",
                LongDescription = "Collects mass/generic-model elements tagged with the 'MPT_ZoneType' shared parameter, builds a variance-covariance matrix from their zone types, solves the analytic mean-variance frontier, and opens an interactive Efficient Frontier chart with per-layout weight allocations."
            };

            var button = panel.AddItem(buttonData) as PushButton;

            // ====================================================================
            // BUTTON 2: LIVE CLOUD MPT BRIDGE SERVER (NEW MULTI-AGENT ENDPOINT)
            // ====================================================================
            var bridgeButtonData = new PushButtonData(
                "cmdLiveMptBridgeServer",
                "Live MPT Bridge\nServer",
                assemblyPath,
                "RevitMPTOptimizer.Commands.LiveMptBridgeServerCommand")
            {
                ToolTip = "Launches an asynchronous local server gateway to connect the active Revit session straight into your Gemini AI workspace dashboard.",
                LongDescription = "Initializes a multi-threaded local HttpListener endpoint inside Revit on Port 8080. This enables secure, real-time data handshakes, spatial extraction telemetry, and agentic parameter updates driven directly by the web-based Gemini 3.7 Flash workspace."
            };

            var bridgeButton = panel.AddItem(bridgeButtonData) as PushButton;

            // ====================================================================
            // GRAPHICS RENDERING: ATTACH VISUAL ANCHORS FOR REVIEW HOOKS
            // ====================================================================
            try
            {
                var icon = TryLoadIcon("icon32.png");
                if (icon != null && button != null)
                    button.LargeImage = icon;

                // Dynamically resolve custom asset vectors or gracefully cascade down to structural defaults
                var bridgeIcon = TryLoadIcon("server32.png") ?? icon;
                if (bridgeIcon != null && bridgeButton != null)
                    bridgeButton.LargeImage = bridgeIcon;
            }
            catch
            {
                // Graphical layout assets are entirely cosmetic — never block compilation bounds due to loading exceptions.
            }

            return Result.Succeeded;
        }

        public Result OnShutdown(UIControlledApplication application)
        {
            // Cleanup application tasks cleanly upon user exiting the primary workspace app session
            return Result.Succeeded;
        }

        private static BitmapImage? TryLoadIcon(string fileName)
        {
            string iconPath = System.IO.Path.Combine(
                System.IO.Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location) ?? string.Empty,
                "Resources", fileName);

            if (!System.IO.File.Exists(iconPath)) return null;
            return new BitmapImage(new Uri(iconPath, UriKind.Absolute));
        }
    }
}
