using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Shapes;
using RevitMPTOptimizer.Engine;
using RevitMPTOptimizer.Models;

namespace RevitMPTOptimizer.UI
{
    public class AllocationRow
    {
        public string Name { get; set; } = string.Empty;
        public ZoneType Zone { get; set; }
        public double Weight { get; set; }
        public double Yield { get; set; }
        public double Volatility { get; set; }

        public string WeightDisplay => Weight.ToString("P1");
        public string YieldDisplay => Yield.ToString("P1");
        public string VolatilityDisplay => Volatility.ToString("P1");
    }

    public partial class EfficientFrontierWindow : Window
    {
        private readonly IReadOnlyList<DesignAsset> _assets;
        private List<FrontierPoint> _frontier = new();
        private PortfolioEngine _engine;
        private FrontierPoint? _maxSharpe;
        private bool _isInitialized;

        private const double MarginPx = 48;

        public EfficientFrontierWindow(IReadOnlyList<DesignAsset> assets, PortfolioEngine engine)
        {
            
            _assets = assets;
            _engine = engine;
            InitializeComponent();
            _isInitialized = true;
            Loaded += (_, _) => RunCalculation();
            SizeChanged += (_, _) => DrawFrontier();
        }

        private double RiskFreeRate => double.TryParse(RiskFreeBox.Text, out var v) ? v / 100.0 : 0.02;

        private CorrelationRegime SelectedRegime =>
            (RegimeCombo.SelectedItem as ComboBoxItem)?.Content?.ToString() == "High Correlation"
                ? CorrelationRegime.HighCorrelation
                : CorrelationRegime.LowCorrelation;

        private void RegimeCombo_SelectionChanged(object sender, SelectionChangedEventArgs e) => RunCalculation();
        private void RecalculateButton_Click(object sender, RoutedEventArgs e) => RunCalculation();

        private void RunCalculation()
        {

            if (!_isInitialized) return;
            try
            {
                var covariance = CovarianceCalculator.Build(_assets, SelectedRegime);
                _engine = new PortfolioEngine(_assets, covariance);
                _frontier = _engine.GenerateFrontier(sampleCount: 120, riskFreeRate: RiskFreeRate);
                _maxSharpe = _engine.FindMaxSharpePortfolio(RiskFreeRate);

                StatusText.Text = $"{_assets.Count} assets | min-var sigma={_engine.MinVarianceVolatility:P2}";
                MaxSharpeText.Text = $"Max-Sharpe portfolio:  return={_maxSharpe.ExpectedReturn:P2}   " +
                                      $"volatility={_maxSharpe.Volatility:P2}   Sharpe={_maxSharpe.SharpeRatio:0.000}";

                PopulateGrid(_maxSharpe);
                DrawFrontier();
            }
            catch (Exception ex)
            {
                StatusText.Text = "Error: " + ex.Message;
                MessageBox.Show(ex.Message, "Portfolio calculation failed", MessageBoxButton.OK, MessageBoxImage.Warning);
            }
        }

        private void PopulateGrid(FrontierPoint point)
        {
            var rows = new List<AllocationRow>();
            for (int i = 0; i < _assets.Count; i++)
            {
                rows.Add(new AllocationRow
                {
                    Name = _assets[i].Name,
                    Zone = _assets[i].Zone,
                    Weight = point.Weights[i],
                    Yield = _assets[i].ExpectedYield,
                    Volatility = _assets[i].HistoricalVolatility
                });
            }
            AllocationGrid.ItemsSource = rows;
            SelectedPointText.Text = $"Selected:  return={point.ExpectedReturn:P2}   volatility={point.Volatility:P2}   Sharpe={point.SharpeRatio:0.000}";
        }

        private void DrawFrontier()
        {
            FrontierCanvas.Children.Clear();
            if (_frontier.Count == 0) return;

            double w = FrontierCanvas.ActualWidth, h = FrontierCanvas.ActualHeight;
            if (w <= 0 || h <= 0) return;

            double minVol = _frontier.Min(p => p.Volatility) * 0.9;
            double maxVol = _frontier.Max(p => p.Volatility) * 1.1;
            double minRet = _frontier.Min(p => p.ExpectedReturn) * 0.9;
            double maxRet = _frontier.Max(p => p.ExpectedReturn) * 1.1;

            Point ToScreen(double vol, double ret)
            {
                double x = MarginPx + (vol - minVol) / (maxVol - minVol) * (w - 2 * MarginPx);
                double y = h - MarginPx - (ret - minRet) / (maxRet - minRet) * (h - 2 * MarginPx);
                return new Point(x, y);
            }

            DrawAxes(w, h, minVol, maxVol, minRet, maxRet, ToScreen);

            // Frontier curve
            var poly = new Polyline
            {
                Stroke = Brushes.SteelBlue,
                StrokeThickness = 2.5
            };
            foreach (var p in _frontier)
                poly.Points.Add(ToScreen(p.Volatility, p.ExpectedReturn));
            FrontierCanvas.Children.Add(poly);

            // Individual assets as points
            foreach (var asset in _assets)
            {
                var pt = ToScreen(asset.HistoricalVolatility, asset.ExpectedYield);
                var dot = new Ellipse { Width = 8, Height = 8, Fill = Brushes.DarkOrange, Stroke = Brushes.Black, StrokeThickness = 0.5 };
                Canvas.SetLeft(dot, pt.X - 4);
                Canvas.SetTop(dot, pt.Y - 4);
                FrontierCanvas.Children.Add(dot);

                var label = new TextBlock { Text = asset.Name, FontSize = 10, Foreground = Brushes.DimGray };
                Canvas.SetLeft(label, pt.X + 6);
                Canvas.SetTop(label, pt.Y - 6);
                FrontierCanvas.Children.Add(label);
            }

            // Max-Sharpe point (tangency portfolio)
            if (_maxSharpe != null)
            {
                var pt = ToScreen(_maxSharpe.Volatility, _maxSharpe.ExpectedReturn);
                var star = new Ellipse { Width = 12, Height = 12, Fill = Brushes.Crimson, Stroke = Brushes.Black, StrokeThickness = 1 };
                Canvas.SetLeft(star, pt.X - 6);
                Canvas.SetTop(star, pt.Y - 6);
                FrontierCanvas.Children.Add(star);

                var label = new TextBlock { Text = "Max Sharpe", FontSize = 11, FontWeight = FontWeights.Bold, Foreground = Brushes.Crimson };
                Canvas.SetLeft(label, pt.X + 8);
                Canvas.SetTop(label, pt.Y + 4);
                FrontierCanvas.Children.Add(label);
            }
        }

        private void DrawAxes(double w, double h, double minVol, double maxVol, double minRet, double maxRet, Func<double, double, Point> toScreen)
        {
            var axisBrush = Brushes.Black;
            var origin = new Point(MarginPx, h - MarginPx);
            var xEnd = new Point(w - MarginPx, h - MarginPx);
            var yEnd = new Point(MarginPx, MarginPx);

            FrontierCanvas.Children.Add(new Line { X1 = origin.X, Y1 = origin.Y, X2 = xEnd.X, Y2 = xEnd.Y, Stroke = axisBrush, StrokeThickness = 1 });
            FrontierCanvas.Children.Add(new Line { X1 = origin.X, Y1 = origin.Y, X2 = yEnd.X, Y2 = yEnd.Y, Stroke = axisBrush, StrokeThickness = 1 });

            FrontierCanvas.Children.Add(new TextBlock { Text = "Volatility (sigma_p) →", FontSize = 11, Foreground = Brushes.Black, RenderTransform = null }
                .Also(t => { Canvas.SetLeft(t, (origin.X + xEnd.X) / 2 - 40); Canvas.SetTop(t, h - MarginPx + 18); }));

            var yLabel = new TextBlock { Text = "Expected Return (mu_p)", FontSize = 11, Foreground = Brushes.Black };
            yLabel.LayoutTransform = new RotateTransform(-90);
            Canvas.SetLeft(yLabel, 4);
            Canvas.SetTop(yLabel, (origin.Y + yEnd.Y) / 2 + 40);
            FrontierCanvas.Children.Add(yLabel);
        }

        private void FrontierCanvas_MouseMove(object sender, MouseEventArgs e)
        {
            if (_frontier.Count == 0) return;

            double w = FrontierCanvas.ActualWidth, h = FrontierCanvas.ActualHeight;
            double minVol = _frontier.Min(p => p.Volatility) * 0.9;
            double maxVol = _frontier.Max(p => p.Volatility) * 1.1;

            var pos = e.GetPosition(FrontierCanvas);
            double vol = minVol + (pos.X - MarginPx) / (w - 2 * MarginPx) * (maxVol - minVol);

            var nearest = _frontier.OrderBy(p => Math.Abs(p.Volatility - vol)).FirstOrDefault();
            if (nearest != null)
                PopulateGrid(nearest);
        }
    }

    internal static class UiExtensions
    {
        public static T Also<T>(this T obj, Action<T> action)
        {
            action(obj);
            return obj;
        }
    }
}
