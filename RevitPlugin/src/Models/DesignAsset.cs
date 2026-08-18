namespace RevitMPTOptimizer.Models
{
    public enum ZoneType
    {
        Residential,
        Commercial,
        Industrial
    }

    /// <summary>
    /// Represents one generative design layout (or one zoned component
    /// within a layout) as a discrete "asset" in the MPT sense, as
    /// described in Section 2.1 of the paper.
    ///
    /// Deliberately has no dependency on Autodesk.Revit.DB (RevitElementId
    /// is a plain long, matching ElementId.Value) so the Models/Engine
    /// layers can be unit-tested and run standalone (see
    /// Standalone/SimulationHarness) without the Revit API installed.
    /// </summary>
    public class DesignAsset
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public long RevitElementId { get; set; } = -1;
        public ZoneType Zone { get; set; }

        /// <summary>Gross floor / footprint area extracted from Revit, in m^2.</summary>
        public double FootprintArea { get; set; }

        /// <summary>Enclosed volume extracted from Revit geometry, in m^3.</summary>
        public double Volume { get; set; }

        /// <summary>Estimated construction cost, used as the "asset price" proxy.</summary>
        public double EstimatedCost { get; set; }

        /// <summary>Expected annualized yield (R), decimal form (0.10 = 10%).</summary>
        public double ExpectedYield { get; set; }

        /// <summary>Historical/estimated volatility (sigma), decimal form.</summary>
        public double HistoricalVolatility { get; set; }

        public override string ToString() =>
            $"{Name} [{Zone}]  A={FootprintArea:0.#}m2  R={ExpectedYield:P1}  sigma={HistoricalVolatility:P1}";
    }
}
