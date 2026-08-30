// =========================================================================================================
// Commands/GenerateMptLayoutCommand.cs - Native Autodesk Revit API External Command
// Markowitz Quadratic Simplex Solver & 3D DirectShape Generator (100% Pure Native Revit & .NET 8)
// =========================================================================================================

using System;
using System.Collections.Generic;
using Autodesk.Revit.Attributes;
using Autodesk.Revit.DB;
using Autodesk.Revit.UI;
using RevitMptOptimizer.Core;
using RevitMptOptimizer.Models;

namespace RevitMptOptimizer.Commands
{
    [Transaction(TransactionMode.Manual)]
    [Regeneration(RegenerationOption.Manual)]
    public class GenerateMptLayoutCommand : IExternalCommand
    {
        private const double METERS_TO_FEET = 3.280839895013123;

        public Result Execute(ExternalCommandData commandData, ref string message, ElementSet elements)
        {
            Document? doc = commandData.Application.ActiveUIDocument?.Document;
            if (doc == null)
            {
                message = "No active Revit document found.";
                return Result.Failed;
            }

            var assets = new List<SpatialAsset>
            {
                new SpatialAsset("Residential High-Rise", "RES", 4500.0, 0.0820, 0.1150, "#3B82F6", 12),
                new SpatialAsset("Commercial Office Hub", "COM", 3500.0, 0.0950, 0.1420, "#10B981", 8),
                new SpatialAsset("Retail Shopping Center", "RET", 2500.0, 0.1100, 0.1850, "#F59E0B", 3),
                new SpatialAsset("Light Industrial / Tech", "IND", 6500.0, 0.0750, 0.0980, "#8B5CF6", 4)
            };

            int n = assets.Count;
            double[,] covArr = new double[n, n];
            for (int i = 0; i < n; i++)
            {
                for (int j = 0; j < n; j++)
                {
                    covArr[i, j] = (i == j)
                        ? Math.Pow(assets[i].HistoricalVolatility, 2)
                        : (0.15 * assets[i].HistoricalVolatility * assets[j].HistoricalVolatility);
                }
            }

            double[] optimalWeights = SolveMarkowitzAnalytical(assets, covArr, 0.089);

            using (Transaction trans = new Transaction(doc, "Generate MPT Generative Urban Layout"))
            {
                trans.Start();

                ElementId categoryId = new ElementId(BuiltInCategory.OST_GenericModel);
                double offsetX = 0.0;

                for (int i = 0; i < assets.Count; i++)
                {
                    var asset = assets[i];
                    double targetFootprintM2 = optimalWeights[i] * 17000.0;
                    double sideMeters = Math.Sqrt(Math.Max(100.0, targetFootprintM2));
                    double heightMeters = asset.DefaultFloors * 3.8;

                    double widthFt = sideMeters * METERS_TO_FEET;
                    double depthFt = sideMeters * METERS_TO_FEET;
                    double heightFt = heightMeters * METERS_TO_FEET;

                    XYZ pt0 = new XYZ(offsetX * METERS_TO_FEET, 0, 0);
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
                    ds.Name = $"MPT_{asset.Code}_{asset.Name}";

                    offsetX += sideMeters + 15.0;
                }

                trans.Commit();
            }

            RibbonStatusManager.UpdateNotice($"⚡ Generated 4 Optimal MPT DirectShapes ({DateTime.Now:HH:mm:ss})");
            TaskDialog.Show("Revit MPT Generator", "Instantiated optimal Markowitz DirectShape massing blocks in active view!");
            return Result.Succeeded;
        }

        private static double[] SolveMarkowitzAnalytical(List<SpatialAsset> assets, double[,] covMatrix, double rTarget)
        {
            int n = assets.Count;
            double[] returns = assets.ConvertAll(a => a.ExpectedYield).ToArray();

            // Native Gauss-Jordan Matrix Inversion (Zero NuGet dependency)
            double[,] invSigma = InvertMatrix(covMatrix, n);

            double[] ones = new double[n];
            for (int i = 0; i < n; i++) ones[i] = 1.0;

            double[] invSigmaOnes = MultiplyMatrixVector(invSigma, ones, n);
            double[] invSigmaR = MultiplyMatrixVector(invSigma, returns, n);

            double A = DotProduct(ones, invSigmaR);
            double B = DotProduct(returns, invSigmaR);
            double C = DotProduct(ones, invSigmaOnes);
            double D = (B * C) - (A * A);
            if (Math.Abs(D) < 1e-9) D = 1e-9;

            double lambda = Math.Max(0.001, ((C * rTarget) - A) / D);
            double gamma = Math.Max(0.001, (B - (A * rTarget)) / D);

            double[] w = new double[n];
            double sum = 0;
            for (int i = 0; i < n; i++)
            {
                w[i] = Math.Max(0.05, (lambda * invSigmaR[i]) + (gamma * invSigmaOnes[i]));
                sum += w[i];
            }

            for (int i = 0; i < n; i++)
            {
                w[i] /= sum;
            }
            return w;
        }

        private static double[,] InvertMatrix(double[,] matrix, int n)
        {
            double[,] a = (double[,])matrix.Clone();
            double[,] result = new double[n, n];
            for (int i = 0; i < n; i++) result[i, i] = 1.0;

            for (int i = 0; i < n; i++)
            {
                double diag = a[i, i];
                if (Math.Abs(diag) < 1e-9) diag = 1e-9;
                for (int j = 0; j < n; j++)
                {
                    a[i, j] /= diag;
                    result[i, j] /= diag;
                }
                for (int k = 0; k < n; k++)
                {
                    if (k != i)
                    {
                        double factor = a[k, i];
                        for (int j = 0; j < n; j++)
                        {
                            a[k, j] -= factor * a[i, j];
                            result[k, j] -= factor * result[i, j];
                        }
                    }
                }
            }
            return result;
        }

        private static double[] MultiplyMatrixVector(double[,] m, double[] v, int n)
        {
            double[] res = new double[n];
            for (int i = 0; i < n; i++)
            {
                double s = 0;
                for (int j = 0; j < n; j++) s += m[i, j] * v[j];
                res[i] = s;
            }
            return res;
        }

        private static double DotProduct(double[] a, double[] b)
        {
            double s = 0;
            for (int i = 0; i < a.Length; i++) s += a[i] * b[i];
            return s;
        }
    }
}
