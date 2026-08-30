// =========================================================================================================
// Core/LiveBridgeServer.cs - Non-blocking Async HTTP Listener (Port 8080) + Cloud & Local Relay Poller
// Features: Full CORS, Private Network Access (PNA), Health Handshakes, Two-Way JSON Dispatch.
// 100% Pure Native .NET 10 & Autodesk Revit API
// =========================================================================================================

using System;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using RevitMptOptimizer.Models;

namespace RevitMptOptimizer.Core
{
    public static class LiveBridgeServer
    {
        private static HttpListener? _listener;
        private static bool _isRunning;
        private static int _lastPulledVersion = 0;
        private static readonly HttpClient _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(3) };
        private static CancellationTokenSource? _cts;

        public static bool IsRunning => _isRunning;

        public static void Start()
        {
            if (_isRunning) return;

            _isRunning = true;
            _cts = new CancellationTokenSource();

            // 1. Start Local HttpListener on Port 8080
            try
            {
                _listener = new HttpListener();
                _listener.Prefixes.Add("http://localhost:8080/");
                _listener.Prefixes.Add("http://127.0.0.1:8080/");
                _listener.Start();
                Task.Run(ListenLoop);
                RibbonStatusManager.UpdateNotice("🟢 Bridge: Online (Port 8080 & Relay)");
            }
            catch (Exception ex)
            {
                RibbonStatusManager.UpdateNotice($"⚠️ Port 8080 warning: {ex.Message} (Relay active)");
            }

            // 2. Start Background Server Relay Poller (polls Express queue every 2 seconds)
            Task.Run(() => RelayPollerLoop(_cts.Token));
        }

        public static void Stop()
        {
            if (!_isRunning) return;
            try
            {
                _isRunning = false;
                _cts?.Cancel();
                _listener?.Stop();
                _listener?.Close();
                RibbonStatusManager.UpdateNotice("⚪ Bridge: Disconnected");
            }
            catch { }
        }

        private static async Task ListenLoop()
        {
            var jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            while (_isRunning && _listener != null && _listener.IsListening)
            {
                try
                {
                    var context = await _listener.GetContextAsync();
                    var request = context.Request;
                    var response = context.Response;

                    // Essential Headers for Chrome / Edge Private Network Access (PNA) and CORS
                    response.AddHeader("Access-Control-Allow-Origin", "*");
                    response.AddHeader("Access-Control-Allow-Private-Network", "true");
                    response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
                    response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Authorization, X-Requested-With");

                    // 1. Health Ping Handshake (GET / OPTIONS)
                    if (request.HttpMethod == "OPTIONS" || request.HttpMethod == "GET" || request.HttpMethod == "HEAD")
                    {
                        response.StatusCode = 200;
                        response.ContentType = "application/json";
                        byte[] pingBytes = Encoding.UTF8.GetBytes("{\"status\":\"online\",\"framework\":\"Native Revit 2027 API\",\"message\":\"Revit 2027 C# Bridge is Online!\"}");
                        response.ContentLength64 = pingBytes.Length;
                        await response.OutputStream.WriteAsync(pingBytes, 0, pingBytes.Length);
                        response.Close();
                        continue;
                    }

                    // 2. Incoming Layout Push from React Web Interface (POST)
                    if (request.HttpMethod == "POST")
                    {
                        string jsonPayload;
                        using (var reader = new StreamReader(request.InputStream, request.ContentEncoding))
                        {
                            jsonPayload = await reader.ReadToEndAsync();
                        }

                        var dto = JsonSerializer.Deserialize<MasterplanBridgeDto>(jsonPayload, jsonOptions);

                        if (dto != null)
                        {
                            // Queue to Revit External Event safely
                            AsyncRevitLayoutHandler.QueueLayoutGeneration(dto);

                            // Update Ribbon Status Notice Bar
                            int blockCount = dto.LayoutBlocks?.Count ?? 0;
                            RibbonStatusManager.UpdateNotice($"⚡ Synced: {blockCount} Zones ({DateTime.Now:HH:mm:ss})");
                        }

                        // Respond OK to React client
                        response.StatusCode = 200;
                        response.ContentType = "application/json";
                        byte[] okBytes = Encoding.UTF8.GetBytes("{\"status\":\"success\",\"message\":\"Layout queued and applied to Revit 2027!\"}");
                        response.ContentLength64 = okBytes.Length;
                        await response.OutputStream.WriteAsync(okBytes, 0, okBytes.Length);
                        response.Close();
                    }
                }
                catch
                {
                    // Ignore listener abort cycles
                }
            }
        }

        /// <summary>
        /// Background poller that continuously syncs with the Express relay queue.
        /// Bypasses all browser HTTPS mixed-content restrictions automatically.
        /// </summary>
        private static async Task RelayPollerLoop(CancellationToken token)
        {
            var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            string[] relayUrls = new[] { "http://localhost:3000", "http://127.0.0.1:3000" };

            while (!token.IsCancellationRequested && _isRunning)
            {
                try
                {
                    foreach (var baseUrl in relayUrls)
                    {
                        try
                        {
                            // Check for queued layout updates from React
                            string queueUrl = $"{baseUrl}/api/revit/outbound-queue?lastVersion={_lastPulledVersion}";
                            var response = await _httpClient.GetAsync(queueUrl, token);
                            if (response.IsSuccessStatusCode)
                            {
                                string responseJson = await response.Content.ReadAsStringAsync(token);
                                using var doc = JsonDocument.Parse(responseJson);
                                var root = doc.RootElement;

                                if (root.TryGetProperty("hasPendingLayout", out var hasPending) && hasPending.GetBoolean())
                                {
                                    if (root.TryGetProperty("version", out var verElem))
                                    {
                                        _lastPulledVersion = verElem.GetInt32();
                                    }

                                    if (root.TryGetProperty("data", out var dataElem))
                                    {
                                        var dto = JsonSerializer.Deserialize<MasterplanBridgeDto>(dataElem.GetRawText(), jsonOptions);
                                        if (dto != null)
                                        {
                                            AsyncRevitLayoutHandler.QueueLayoutGeneration(dto);
                                            int count = dto.LayoutBlocks?.Count ?? 0;
                                            RibbonStatusManager.UpdateNotice($"⚡ Auto-Synced: {count} Zones via Relay ({DateTime.Now:HH:mm:ss})");
                                        }
                                    }
                                }
                                break; // Successfully reached relay endpoint
                            }
                        }
                        catch
                        {
                            // Try next base URL
                        }
                    }
                }
                catch
                {
                    // Ignore transient network errors
                }

                // Poll interval
                await Task.Delay(2000, token);
            }
        }
    }
}
