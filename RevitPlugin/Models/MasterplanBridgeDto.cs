// =========================================================================================================
// Models/MasterplanBridgeDto.cs & SpatialAsset.cs - Two-Way Serialization DTOs
// =========================================================================================================

using System.Collections.Generic;

namespace RevitMptOptimizer.Models
{
    public class SpatialAsset
    {
        public string Name { get; set; }
        public string Code { get; set; }
        public double FootprintM2 { get; set; }
        public double ExpectedYield { get; set; }
        public double HistoricalVolatility { get; set; }
        public string HexColor { get; set; }
        public int DefaultFloors { get; set; }

        public SpatialAsset() { }

        public SpatialAsset(string name, string code, double footprint, double yieldRate, double vol, string color, int floors)
        {
            Name = name;
            Code = code;
            FootprintM2 = footprint;
            ExpectedYield = yieldRate;
            HistoricalVolatility = vol;
            HexColor = color;
            DefaultFloors = floors;
        }
    }

    public class RevitBlockLayoutDto
    {
        public string Id { get; set; }
        public string AssetCode { get; set; }
        public string Name { get; set; }
        public double X { get; set; }
        public double Y { get; set; }
        public double Width { get; set; }
        public double Height { get; set; }
        public int Floors { get; set; }
        public double AreaM2 { get; set; }
    }

    public class MasterplanBridgeDto
    {
        public string Version { get; set; }
        public List<SpatialAsset> Assets { get; set; }
        public double[][] CorrelationMatrix { get; set; }
        public double[][] CovarianceMatrix { get; set; }
        public double[] OptimalSharpeWeights { get; set; }
        public List<RevitBlockLayoutDto> LayoutBlocks { get; set; }
    }
}
