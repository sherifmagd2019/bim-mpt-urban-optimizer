using System;

namespace RevitMPTOptimizer.Engine
{
    /// <summary>
    /// Minimal dense linear-algebra helper (row-major double[,] matrices,
    /// double[] vectors). Implemented from scratch so the add-in has no
    /// external NuGet dependency beyond the Revit API itself. Functionally
    /// equivalent to the Math.NET Numerics calls referenced in the paper
    /// (Matrix&lt;double&gt;.Inverse(), DotProduct(), etc.).
    /// </summary>
    public static class MatrixMath
    {
        public static double[,] Multiply(double[,] a, double[,] b)
        {
            int n = a.GetLength(0), m = a.GetLength(1), p = b.GetLength(1);
            if (m != b.GetLength(0))
                throw new ArgumentException("Matrix dimension mismatch in Multiply.");

            var result = new double[n, p];
            for (int i = 0; i < n; i++)
                for (int j = 0; j < p; j++)
                {
                    double sum = 0;
                    for (int k = 0; k < m; k++)
                        sum += a[i, k] * b[k, j];
                    result[i, j] = sum;
                }
            return result;
        }

        public static double[] Multiply(double[,] a, double[] v)
        {
            int n = a.GetLength(0), m = a.GetLength(1);
            if (m != v.Length)
                throw new ArgumentException("Matrix/vector dimension mismatch in Multiply.");

            var result = new double[n];
            for (int i = 0; i < n; i++)
            {
                double sum = 0;
                for (int j = 0; j < m; j++)
                    sum += a[i, j] * v[j];
                result[i] = sum;
            }
            return result;
        }

        public static double DotProduct(double[] a, double[] b)
        {
            if (a.Length != b.Length)
                throw new ArgumentException("Vector length mismatch in DotProduct.");

            double sum = 0;
            for (int i = 0; i < a.Length; i++)
                sum += a[i] * b[i];
            return sum;
        }

        public static double[] Add(double[] a, double[] b)
        {
            var result = new double[a.Length];
            for (int i = 0; i < a.Length; i++)
                result[i] = a[i] + b[i];
            return result;
        }

        public static double[] Scale(double[] a, double scalar)
        {
            var result = new double[a.Length];
            for (int i = 0; i < a.Length; i++)
                result[i] = a[i] * scalar;
            return result;
        }

        public static double[] Ones(int n)
        {
            var result = new double[n];
            for (int i = 0; i < n; i++) result[i] = 1.0;
            return result;
        }

        /// <summary>
        /// Inverts an n x n matrix using Gauss-Jordan elimination with
        /// partial pivoting. Throws if the matrix is singular.
        /// </summary>
        public static double[,] Inverse(double[,] source)
        {
            int n = source.GetLength(0);
            if (n != source.GetLength(1))
                throw new ArgumentException("Matrix must be square to invert.");

            // Build augmented [A | I] matrix
            var aug = new double[n, 2 * n];
            for (int i = 0; i < n; i++)
            {
                for (int j = 0; j < n; j++)
                    aug[i, j] = source[i, j];
                aug[i, n + i] = 1.0;
            }

            for (int col = 0; col < n; col++)
            {
                // Partial pivot: find row with largest absolute value in this column
                int pivotRow = col;
                double maxVal = Math.Abs(aug[col, col]);
                for (int row = col + 1; row < n; row++)
                {
                    double val = Math.Abs(aug[row, col]);
                    if (val > maxVal) { maxVal = val; pivotRow = row; }
                }

                if (maxVal < 1e-12)
                    throw new InvalidOperationException(
                        "Covariance matrix is singular or near-singular. " +
                        "Check for duplicate/perfectly-correlated design assets.");

                if (pivotRow != col)
                {
                    for (int j = 0; j < 2 * n; j++)
                    {
                        (aug[col, j], aug[pivotRow, j]) = (aug[pivotRow, j], aug[col, j]);
                    }
                }

                double pivot = aug[col, col];
                for (int j = 0; j < 2 * n; j++)
                    aug[col, j] /= pivot;

                for (int row = 0; row < n; row++)
                {
                    if (row == col) continue;
                    double factor = aug[row, col];
                    if (factor == 0) continue;
                    for (int j = 0; j < 2 * n; j++)
                        aug[row, j] -= factor * aug[col, j];
                }
            }

            var inverse = new double[n, n];
            for (int i = 0; i < n; i++)
                for (int j = 0; j < n; j++)
                    inverse[i, j] = aug[i, n + j];

            return inverse;
        }
    }
}
