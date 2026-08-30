// =========================================================================================================
// Core/AsyncRevitLayoutHandler.cs - Non-blocking Async ExternalEvent Dispatcher
// Marshals React HTTP requests onto Revit UI thread with zero viewport freezes or hangs.
// =========================================================================================================

using System;
using System.Collections.Generic;
using Autodesk.Revit.DB;
using Autodesk.Revit.UI;
using RevitMptOptimizer.Models;

namespace RevitMptOptimizer.Core
{
    public class LayoutExternalEventHandler : IExternalEventHandler
    {
        private const double METERS_TO_FEET = 3.280839895013123;
        private MasterplanBridgeDto? _pendingDto;
        private readonly object _lock = new object();

        public void SetPayload(MasterplanBridgeDto dto)
        {
            lock (_lock)
            {
                _pendingDto = dto;
            }
        }

        public void Execute(UIApplication app)
        {
            MasterplanBridgeDto? dto;
            lock (_lock)
            {
                dto = _pendingDto;
                _pendingDto = null;
            }

            if (dto == null) return;

            Document? doc = app.ActiveUIDocument?.Document;
            if (doc == null || doc.IsReadOnly) return;

            try
            {
                using (Transaction trans = new Transaction(doc, "Apply React MPT Layout Update"))
                {
                    trans.Start();

                    ElementId categoryId = new ElementId(BuiltInCategory.OST_GenericModel);

                    if (dto.LayoutBlocks != null && dto.LayoutBlocks.Count > 0)
                    {
                        foreach (var b in dto.LayoutBlocks)
                        {
                            double widthFt = (b.Width > 0 ? b.Width : 40.0) * METERS_TO_FEET;
                            double depthFt = (b.Height > 0 ? b.Height : 40.0) * METERS_TO_FEET;
                            double heightFt = (b.Floors > 0 ? b.Floors : 4) * 3.8 * METERS_TO_FEET;

                            XYZ pt0 = new XYZ(b.X * METERS_TO_FEET, b.Y * METERS_TO_FEET, 0);
                            XYZ pt1 = new XYZ(pt0.X + widthFt, pt0.Y, 0);
                            XYZ pt2 = new XYZ(pt0.X + widthFt, pt0.Y + depthFt, 0);
                            XYZ pt3 = new XYZ(pt0.X, pt0.Y + depthFt, 0);

                            CurveLoop loop = new CurveLoop();
                            loop.Append(Line.CreateBound(pt0, pt1));
                            loop.Append(Line.CreateBound(pt1, pt2));
                            loop.Append(Line.CreateBound(pt2, pt3));
                            loop.Append(Line.CreateBound(pt3, pt0));

                            Solid solid = GeometryCreationUtilities.CreateExtrusionGeometry(new List<CurveLoop> { loop }, XYZ.BasisZ, heightFt);
                            DirectShape ds = DirectShape.CreateElement(doc, categoryId);
                            ds.SetShape(new List<GeometryObject> { solid });
                            ds.Name = $"MPT_{b.AssetCode}_{b.Name}";

                            Parameter p = ds.get_Parameter(BuiltInParameter.ALL_MODEL_INSTANCE_COMMENTS);
                            if (p != null && !p.IsReadOnly)
                            {
                                p.Set($"Synced from React UI at {DateTime.Now:HH:mm:ss} | Floors: {b.Floors} | Area: {b.AreaM2:F0}m²");
                            }
                        }
                    }

                    trans.Commit();
                }

                // Update Revit Ribbon Notice Bar beside Connect Button
                int count = dto.LayoutBlocks?.Count ?? 0;
                RibbonStatusManager.UpdateNotice($"⚡ Synced: {count} Zones ({DateTime.Now:HH:mm:ss})");
            }
            catch (Exception ex)
            {
                RibbonStatusManager.UpdateNotice($"⚠️ Sync Error: {ex.Message}");
            }
        }

        public string GetName()
        {
            return "MPT Generative Urban Layout Event Handler";
        }
    }

    public static class AsyncRevitLayoutHandler
    {
        private static LayoutExternalEventHandler? _handler;
        private static ExternalEvent? _externalEvent;

        public static void Initialize()
        {
            if (_handler == null)
            {
                _handler = new LayoutExternalEventHandler();
                _externalEvent = ExternalEvent.Create(_handler);
            }
        }

        /// <summary>
        /// Safely queues incoming layout payload from background HTTP listener to be executed on Revit main thread.
        /// </summary>
        public static void QueueLayoutGeneration(MasterplanBridgeDto dto)
        {
            if (_handler == null || _externalEvent == null)
            {
                Initialize();
            }

            if (_handler != null && _externalEvent != null)
            {
                _handler.SetPayload(dto);
                _externalEvent.Raise();
            }
        }
    }
}
