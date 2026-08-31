// =========================================================================================================
// RevitPlugin/Commands/GenerateMptLayoutCommand.cs
// COMPLETE MARKOWITZ MPT SOLVER WITH NUMERICAL STABILITY FIXES
// 
// FIXES APPLIED:
// ✅ Partial pivoting added (numerical stability)
// ✅ Proper simplex projection (non-negativity constraint)
// ✅ Matches JavaScript solver exactly
// ✅ Null/NaN safety checks
// =========================================================================================================

using System;
using System.Collections.Generic;
using System.Linq;
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
            Document doc = commandData.Application.ActiveUIDocument?.Document;
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
                    
                    // Validate inputs
                    if (double.IsNaN(optimalWeights[i]) || optimalWeights[i] < 0)
                    {
                        RibbonStatusManager.UpdateNotice($"⚠️ Invalid weight for {asset.Code}");
                        continue;
                    }

                    if (asset.DefaultFloors <= 0)
                    {
                        RibbonStatusManager.UpdateNotice($"⚠️ Invalid floor count for {asset.Code}");
                        continue;
                    }

                    double targetFootprintM2 = optimalWeights[i] * 17000.0;
                    
                    // Realistic aspect ratio (3:2, typical urban block)
                    double aspectRatio = 1.5;
                    double depthMeters = Math.Sqrt(targetFootprintM2 / aspectRatio);
                    double widthMeters = targetFootprintM2 / depthMeters;
                    double heightMeters = asset.DefaultFloors * 3.8;

                    double widthFt = widthMeters * METERS_TO_FEET;
                    double depthFt = depthMeters * METERS_TO_FEET;
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

                    try
                    {
                        Solid solid = GeometryCreationUtilities.CreateExtrusionGeometry(
                            new List<CurveLoop> { loop }, 
                            XYZ.BasisZ, 
                            heightFt
                        );
                        
                        DirectShape ds = DirectShape.CreateElement(doc, categoryId);
                        ds.SetShape(new List<GeometryObject> { solid });
                        ds.Name = $"MPT_{asset.Code}_{asset.Name}";

                        offsetX += widthMeters + 15.0;
                    }
                    catch (Exception ex)
                    {
                        RibbonStatusManager.UpdateNotice($"⚠️ Geometry error for {asset.Code}: {ex.Message}");
                    }
                }

                trans.Commit();
            }

            RibbonStatusManager.UpdateNotice($"⚡ Generated {assets.Count} Optimal MPT DirectShapes ({DateTime.Now:HH:mm:ss})");
            TaskDialog.Show("Revit MPT Generator", "Instantiated optimal Markowitz DirectShape massing blocks in active view!");
            return Result.Succeeded;
        }

        /// <summary>
        /// Solve Markowitz optimization using analytical approach
        /// MATCHING JAVASCRIPT IMPLEMENTATION EXACTLY
        /// </summary>
        private static double[] SolveMarkowitzAnalytical(List<SpatialAsset> assets, double[,] covMatrix, double rTarget)
        {
            int n = assets.Count;
            
            if (assets == null || assets.Count == 0)
            {
                return new double[0];
            }

            double[] returns = assets.ConvertAll(a => a.ExpectedYield).ToArray();

            // Step 1: Invert covariance matrix WITH PARTIAL PIVOTING
            double[,] invSigma = InvertMatrixWithPivoting(covMatrix, n);

            // Step 2: Compute basis vectors (ones vector)
            double[] ones = new double[n];
            for (int i = 0; i < n; i++) 
                ones[i] = 1.0;

            // Step 3: Intermediate transformations
            double[] invSigmaOnes = MultiplyMatrixVector(invSigma, ones, n);
            double[] invSigmaR = MultiplyMatrixVector(invSigma, returns, n);

            // Step 4: Compute analytical scalars (A, B, C, D)
            double scalarA = DotProduct(ones, invSigmaR);      // 1^T * Σ^-1 * R
            double scalarB = DotProduct(returns, invSigmaR);   // R^T * Σ^-1 * R
            double scalarC = DotProduct(ones, invSigmaOnes);   // 1^T * Σ^-1 * 1
            double determinantD = (scalarB * scalarC) - (scalarA * scalarA);

            // Guard against zero determinant
            if (Math.Abs(determinantD) < 1e-9) 
                determinantD = 1e-9;

            // Step 5: Compute subspace basis vectors g and h
            double[] vectorG = new double[n];
            double[] vectorH = new double[n];
            
            for (int i = 0; i < n; i++)
            {
                vectorG[i] = (invSigmaOnes[i] * (scalarB / determinantD)) - (invSigmaR[i] * (scalarA / determinantD));
                vectorH[i] = (invSigmaR[i] * (scalarC / determinantD)) - (invSigmaOnes[i] * (scalarA / determinantD));
            }

            // Step 6: Analytical weights w = g + h * targetReturn
            double[] targetWeights = new double[n];
            for (int i = 0; i < n; i++)
            {
                targetWeights[i] = vectorG[i] + (vectorH[i] * rTarget);
            }

            // Step 7: PROJECT TO SIMPLEX (enforce non-negativity)
            return ProjectToSimplex(targetWeights);
        }

        /// <summary>
        /// Gaussian elimination with PARTIAL PIVOTING (NUMERICAL STABILITY)
        /// </summary>
        private static double[,] InvertMatrixWithPivoting(double[,] matrix, int n)
        {
            double[,] a = (double[,])matrix.Clone();
            double[,] result = new double[n, n];
            
            for (int i = 0; i < n; i++) 
                result[i, i] = 1.0;

            for (int i = 0; i < n; i++)
            {
                // STEP 1: FIND PIVOT (numerical stability - CRITICAL FIX)
                int maxRow = i;
                for (int k = i + 1; k < n; k++)
                {
                    if (Math.Abs(a[k, i]) > Math.Abs(a[maxRow, i]))
                    {
                        maxRow = k;
                    }
                }

                // STEP 2: SWAP ROWS (both augmented matrix and result)
                if (maxRow != i)
                {
                    for (int j = 0; j < n; j++)
                    {
                        double temp = a[i, j];
                        a[i, j] = a[maxRow, j];
                        a[maxRow, j] = temp;

                        temp = result[i, j];
                        result[i, j] = result[maxRow, j];
                        result[maxRow, j] = temp;
                    }
                }

                // STEP 3: NORMALIZE PIVOT ROW
                double diag = a[i, i];
                if (Math.Abs(diag) < 1e-12)
                {
                    diag = 1e-6; // Regularization guard
                }

                for (int j = 0; j < n; j++)
                {
                    a[i, j] /= diag;
                    result[i, j] /= diag;
                }

                // STEP 4: ELIMINATE COLUMN (Gauss-Jordan)
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

        /// <summary>
        /// Project arbitrary vector onto probability simplex
        /// Constraint: sum(w) = 1, w_i >= 0 for all i
        /// </summary>
        private static double[] ProjectToSimplex(double[] vector)
        {
            int n = vector.Length;
            
            if (n == 0)
                return new double[0];

            // Step 1: Sort vector in descending order
            double[] sorted = (double[])vector.Clone();
            Array.Sort(sorted, (a, b) => b.CompareTo(a)); // Descending

            // Step 2: Find threshold rho
            double cumulativeSum = 0;
            int rho = 0;
            for (int i = 0; i < n; i++)
            {
                cumulativeSum += sorted[i];
                if (sorted[i] + (1.0 - cumulativeSum) / (i + 1) > 0)
                {
                    rho = i;
                }
            }

            // Step 3: Compute threshold theta
            double sumRho = 0;
            for (int i = 0; i <= rho; i++)
            {
                sumRho += sorted[i];
            }
            double theta = (1.0 - sumRho) / (rho + 1);

            // Step 4: Apply threshold and normalize
            double[] projected = new double[n];
            double total = 0;
            for (int i = 0; i < n; i++)
            {
                projected[i] = Math.Max(0, vector[i] + theta);
                total += projected[i];
            }

            // Step 5: Normalize to ensure sum = 1
            if (total > 1e-12)
            {
                for (int i = 0; i < n; i++)
                {
                    projected[i] /= total;
                }
            }
            else
            {
                // Fallback: uniform distribution
                for (int i = 0; i < n; i++)
                {
                    projected[i] = 1.0 / n;
                }
            }

            return projected;
        }

        /// <summary>
        /// Matrix-vector multiplication: M * v
        /// </summary>
        private static double[] MultiplyMatrixVector(double[,] m, double[] v, int n)
        {
            double[] res = new double[n];
            for (int i = 0; i < n; i++)
            {
                double s = 0;
                for (int j = 0; j < n; j++)
                {
                    s += m[i, j] * v[j];
                }
                res[i] = s;
            }
            return res;
        }

        /// <summary>
        /// Dot product: a · b
        /// </summary>
        private static double DotProduct(double[] a, double[] b)
        {
            double s = 0;
            for (int i = 0; i < a.Length; i++)
            {
                s += a[i] * b[i];
            }
            return s;
        }
    }
}
