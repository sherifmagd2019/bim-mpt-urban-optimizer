using System;
using System.Collections.Generic;
using System.Linq;
using Autodesk.Revit.DB;
using RevitMPTOptimizer.Engine;
using RevitMPTOptimizer.Models;

namespace RevitMPTOptimizer.Data
{
    /// <summary>
    /// The "C# PLUG-IN MIDDLEWARE" block from Fig. 1 of the paper:
    /// FilteredElementCollector + geometric/volume extraction, converting
    /// raw Revit elements into DesignAsset records ready for the
    /// quantitative engine.
    ///
    /// Assets are expected to be generic model / mass instances tagged
    /// with a shared parameter named "MPT_ZoneType" (Residential /
    /// Commercial / Industrial). This keeps the extractor agnostic to
    /// whatever generative-design tool (Dynamo, Generative Design for
    /// Revit, or a custom optioneering add-in) produced the variations --
    /// it only needs that one tag on each option's representative element.
    /// </summary>
    public class RevitElementExtractor
    {
        public const string ZoneParameterName = "MPT_ZoneType";

        private readonly MarketProxyCalculator _marketProxy = new();

        /// <summary>
        /// Collects all mass / generic-model instances in the active
        /// document (or, if a selection is provided, restricts to those
        /// elements) and converts each into a fully-populated DesignAsset.
        /// </summary>
        public List<DesignAsset> ExtractAssets(Document doc, ICollection<ElementId>? selection = null)
        {
            var collector = new FilteredElementCollector(doc);

            IEnumerable<Element> candidates;
            if (selection != null && selection.Count > 0)
            {
                candidates = selection.Select(doc.GetElement).Where(e => e != null)!;
            }
            else
            {
                var categoryFilter = new ElementMulticategoryFilter(
                    new List<BuiltInCategory> { BuiltInCategory.OST_Mass, BuiltInCategory.OST_GenericModel });

                candidates = collector
                    .WhereElementIsNotElementType()
                    .WherePasses(categoryFilter)
                    .ToElements();
            }

            var assets = new List<DesignAsset>();
            foreach (var element in candidates)
            {
                var asset = TryBuildAsset(element);
                if (asset != null)
                    assets.Add(asset);
            }

            if (assets.Count == 0)
                throw new InvalidOperationException(
                    $"No elements with a '{ZoneParameterName}' parameter were found. " +
                    "Tag each generative-design option's mass/generic-model instance with that " +
                    "shared parameter (values: Residential / Commercial / Industrial) before running the optimizer.");

            return assets;
        }

        private DesignAsset? TryBuildAsset(Element element)
        {
            var zoneParam = element.LookupParameter(ZoneParameterName);
            if (zoneParam == null || zoneParam.StorageType != StorageType.String)
                return null;

            string? zoneRaw = zoneParam.AsString();
            if (string.IsNullOrWhiteSpace(zoneRaw) || !Enum.TryParse<ZoneType>(zoneRaw, true, out var zone))
                return null;

            var (volume, footprint) = ComputeGeometry(element);
            if (volume <= 0 && footprint <= 0)
                return null;

            var asset = new DesignAsset
            {
                Id = element.UniqueId,
                Name = string.IsNullOrWhiteSpace(element.Name) ? $"Element {element.Id.Value}" : element.Name,
                RevitElementId = element.Id.Value,
                Zone = zone,
                Volume = volume,
                FootprintArea = footprint
            };

            _marketProxy.Apply(asset);
            return asset;
        }

        /// <summary>
        /// Extracts enclosed volume (m^3) and footprint/floor area (m^2)
        /// from an element's geometry. Prefers built-in Volume/Area
        /// instance parameters when present (fast path); falls back to a
        /// bounding-box + solid-volume computation from GeometryElement
        /// otherwise, since mass/generic-model families don't always
        /// expose those parameters directly.
        /// </summary>
        private (double volumeM3, double footprintM2) ComputeGeometry(Element element)
        {
            double volumeInternal = 0;
            double areaInternal = 0;

            var volParam = element.get_Parameter(BuiltInParameter.HOST_VOLUME_COMPUTED);
            if (volParam != null && volParam.HasValue)
                volumeInternal = volParam.AsDouble();

            var areaParam = element.get_Parameter(BuiltInParameter.HOST_AREA_COMPUTED);
            if (areaParam != null && areaParam.HasValue)
                areaInternal = areaParam.AsDouble();

            if (volumeInternal <= 0 || areaInternal <= 0)
            {
                var options = new Options { ComputeReferences = false, DetailLevel = ViewDetailLevel.Fine };
                GeometryElement? geomElement = element.get_Geometry(options);

                if (geomElement != null)
                {
                    double solidVolume = 0;
                    BoundingBoxXYZ? bbox = null;

                    foreach (GeometryObject geomObj in geomElement)
                    {
                        if (geomObj is Solid solid && solid.Volume > 0)
                            solidVolume += solid.Volume;

                        if (geomObj is GeometryInstance instance)
                        {
                            foreach (var instObj in instance.GetInstanceGeometry())
                            {
                                if (instObj is Solid instSolid && instSolid.Volume > 0)
                                    solidVolume += instSolid.Volume;
                            }
                        }
                    }

                    bbox = element.get_BoundingBox(null);
                    if (bbox != null)
                    {
                        double dx = Math.Abs(bbox.Max.X - bbox.Min.X);
                        double dy = Math.Abs(bbox.Max.Y - bbox.Min.Y);
                        double dz = Math.Abs(bbox.Max.Z - bbox.Min.Z);

                        if (volumeInternal <= 0)
                            volumeInternal = solidVolume > 0 ? solidVolume : dx * dy * dz;
                        if (areaInternal <= 0)
                            areaInternal = dx * dy; // footprint approximation from bbox plan extents
                    }
                }
            }

            // Revit internal units are decimal feet / cubic feet -> convert to SI (m, m^2, m^3)
            double volumeM3 = UnitUtils.ConvertFromInternalUnits(volumeInternal, UnitTypeId.CubicMeters);
            double footprintM2 = UnitUtils.ConvertFromInternalUnits(areaInternal, UnitTypeId.SquareMeters);

            return (volumeM3, footprintM2);
        }
    }
}
