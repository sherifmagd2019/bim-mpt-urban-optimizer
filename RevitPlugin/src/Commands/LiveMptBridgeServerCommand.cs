using System;
using System.IO;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using Autodesk.Revit.Attributes;
using Autodesk.Revit.DB;
using Autodesk.Revit.UI;

namespace RevitMPTOptimizer.Commands
{
    [Transaction(TransactionMode.Manual)]
    public class LiveMptBridgeServerCommand : IExternalCommand
    {
        private static HttpListener _listener;
        private static bool _isRunning = false;

        public Result Execute(ExternalCommandData commandData, ref string message, ElementSet elements)
        {
            // If server is already running, click button again to turn it off cleanly
            if (_isRunning)
            {
                _isRunning = false;
                _listener?.Stop();
                TaskDialog.Show("FinBIM Bridge", "Revit MPT Agent Bridge Server Stopped.");
                return Result.Succeeded;
            }

            try
            {
                _listener = new HttpListener();
                // Listens directly on Port 8080 for connection handshakes from your web visualizer
                _listener.Prefixes.Add("http://localhost:8080/");
                _listener.Start();
                _isRunning = true;

                // Run the listener on a background thread task to keep the Revit UI completely smooth
                Task.Run(() => ListenForWebRequests(commandData.Application.ActiveUIDocument.Document));

                TaskDialog.Show("FinBIM Bridge Active",
                    "Revit C# HTTP Bridge is now ONLINE and listening on port 8080!\n\n" +
                    "Go back to your browser dashboard and click the connect toggle button.");

                return Result.Succeeded;
            }
            catch (Exception ex)
            {
                message = ex.Message;
                return Result.Failed;
            }
        }

        private async Task ListenForWebRequests(Document doc)
        {
            while (_isRunning && _listener.IsListening)
            {
                try
                {
                    HttpListenerContext context = await _listener.GetContextAsync();
                    HttpListenerRequest request = context.Request;
                    HttpListenerResponse response = context.Response;

                    // 1. Mandatory CORS Headers so Chrome allows your React app to communicate safely
                    response.AddHeader("Access-Control-Allow-Origin", "*");
                    response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                    response.AddHeader("Access-Control-Allow-Headers", "Content-Type");

                    // Handle Preflight OPTIONS requests from the browser
                    if (request.HttpMethod == "OPTIONS")
                    {
                        response.StatusCode = (int)HttpStatusCode.OK;
                        response.Close();
                        continue;
                    }

                    // 2. Handle Connection Pings and Data Updates
                    if (request.HttpMethod == "GET" || request.HttpMethod == "POST")
                    {
                        // Prepare a mock successful JSON transaction plan response 
                        string jsonResponse = "{\"status\":\"connected\",\"revitVersion\":\"2027\",\"syncMode\":\"Active\"}";
                        byte[] buffer = Encoding.UTF8.GetBytes(jsonResponse);

                        response.ContentType = "application/json";
                        response.StatusCode = (int)HttpStatusCode.OK;
                        response.ContentLength64 = buffer.Length;

                        await response.OutputStream.WriteAsync(buffer, 0, buffer.Length);
                        response.Close();

                        System.Diagnostics.Debug.WriteLine("Handshake executed successfully with React UI console workspace!");
                    }
                }
                catch (Exception)
                {
                    // Fail gracefully on background loops to avoid crashing your active Revit modeling window
                }
            }
        }
    }
}
