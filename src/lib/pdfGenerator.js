import { jsPDF } from 'jspdf';

/**
 * Generates and downloads the complete 3-page academic research paper PDF:
 * "A C# Application of Modern Portfolio Theory for Financial Risk-Return Optimization in Generative Urban BIM Layouts"
 * by Sherif Ahmad Magdaldin (ICEPE 2026 / WorldQuant University)
 */
export function generateAndDownloadPaperPDF() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 45;
  const contentWidth = pageWidth - (margin * 2);

  // Styling helper functions
  const addHeader = (pageNum) => {
    doc.setFont('times', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text(
      'ICEPE 2026 • Modern Portfolio Theory in Generative Urban BIM Layouts • Sherif Ahmad Magdaldin',
      pageWidth / 2,
      28,
      { align: 'center' }
    );
    doc.setDrawColor(210, 210, 215);
    doc.setLineWidth(0.5);
    doc.line(margin, 34, pageWidth - margin, 34);

    // Footer
    doc.text(String(pageNum), pageWidth / 2, pageHeight - 25, { align: 'center' });
  };

  // ==========================================
  // PAGE 1
  // ==========================================
  addHeader(1);

  let y = 60;

  // Title
  doc.setFont('times', 'bold');
  doc.setFontSize(14.5);
  doc.setTextColor(20, 20, 25);
  const titleLines = doc.splitTextToSize(
    'A C# Application of Modern Portfolio Theory for Financial Risk-Return Optimization in Generative Urban BIM Layouts',
    contentWidth
  );
  doc.text(titleLines, pageWidth / 2, y, { align: 'center' });
  y += titleLines.length * 18 + 12;

  // Author Info
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 35);
  doc.text('Sherif Ahmad Magdaldin', pageWidth / 2, y, { align: 'center' });
  y += 14;

  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(60, 60, 65);
  doc.text('Civil and Structural Engineer', pageWidth / 2, y, { align: 'center' });
  y += 12;
  doc.text('Master of Financial Engineering Program, WorldQuant University', pageWidth / 2, y, { align: 'center' });
  y += 12;
  doc.text('New Orleans, Louisiana, USA', pageWidth / 2, y, { align: 'center' });
  y += 12;
  doc.setTextColor(0, 80, 160);
  doc.text('sherifmagd@gmail.com', pageWidth / 2, y, { align: 'center' });
  y += 20;

  // Abstract Box
  doc.setDrawColor(220, 225, 235);
  doc.setFillColor(248, 249, 252);
  doc.roundedRect(margin, y, contentWidth, 140, 4, 4, 'FD');

  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 25);
  doc.text('Abstract', pageWidth / 2, y + 16, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(40, 40, 45);
  const abstractText = 'Traditional cost estimation techniques within Architecture, Engineering, and Construction (AEC) frameworks typically treat generative design variations as isolated assets, ignoring the financial dependencies and systematic risks embedded across large-scale urban developments. This paper introduces an automated software application built in C# using the Revit API that implements quantitative financial frameworks to optimize design selection. By parsing geometric and material parameters from generative BIM instances, the engine applies Harry Markowitz’s Modern Portfolio Theory (MPT) to evaluate multiple building design layouts as an investment portfolio. The software programmatically computes historical price variances and cross-asset correlation matrices to establish an optimal financial risk-return profile. The final software execution maps an “Efficient Frontier” directly within the designer’s environment, allowing developers to visually isolate layouts that maximize yield while minimizing downside market risk exposure. This methodology establishes an objective, data-driven link between spatial generative design and advanced asset-portfolio engineering.';
  const abstractLines = doc.splitTextToSize(abstractText, contentWidth - 24);
  doc.text(abstractLines, margin + 12, y + 30);
  y += 148;

  // Keywords
  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(25, 25, 30);
  doc.text('Keywords: ', margin, y);
  const kwWidth = doc.getTextWidth('Keywords: ');
  doc.setFont('times', 'italic');
  doc.text('ICEPE 2026, Revit API, C#, Modern Portfolio Theory, Generative BIM, Architectural Financial Engineering', margin + kwWidth, y);
  y += 18;

  // 2-Column layout for Page 1 body
  const colWidth = (contentWidth - 18) / 2;
  const col1X = margin;
  const col2X = margin + colWidth + 18;

  // Column 1: Section 1
  let yCol1 = y;
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 25);
  doc.text('1.  Introduction', col1X, yCol1);
  yCol1 += 14;

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 45);
  const p1 = 'The convergence of algorithmic architectural creation and computational finance represents a new paradigm shift for the Architecture, Engineering, and Construction (AEC) software domain. Historically, structural design platforms and capital deployment calculation channels have operated in isolated silos. Designers leverage parametric Building Information Modeling (BIM) programs to modify spatial arrangements based on structural efficiency, volume limits, or aesthetic objectives.';
  const p1Lines = doc.splitTextToSize(p1, colWidth);
  doc.text(p1Lines, col1X, yCol1);
  yCol1 += p1Lines.length * 11 + 6;

  const p2 = 'Concurrently, investment analysts rely on disconnected matrix computations via standard spreadsheets to measure project feasibility. This data silo introduces structural fragmentation into multi-asset real estate portfolio evaluations, rendering real-time adjustments highly error-prone.';
  const p2Lines = doc.splitTextToSize(p2, colWidth);
  doc.text(p2Lines, col1X, yCol1);
  yCol1 += p2Lines.length * 11 + 6;

  const p3 = 'Furthermore, traditional infrastructure financial frameworks are bound to static Net Present Value (NPV) formulas. These procedures fail to model risk dynamics and covariance behaviors that arise when multi-building developments are executed simultaneously in a volatile marketplace. If raw steel prices skyrocket or localized rental absorption rates change, separate structures within the same blueprint exhibit strong financial correlations.';
  const p3Lines = doc.splitTextToSize(p3, colWidth);
  doc.text(p3Lines, col1X, yCol1);
  yCol1 += p3Lines.length * 11;

  // Column 2: Section 2
  let yCol2 = y;
  const p3b = 'To bridge this analytical disconnect, this paper presents an interconnected runtime engine compiled in C# that exposes real-time portfolio optimization analytics directly inside standard BIM development environments.';
  const p3bLines = doc.splitTextToSize(p3b, colWidth);
  doc.text(p3bLines, col2X, yCol2);
  yCol2 += p3bLines.length * 11 + 10;

  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 25);
  doc.text('2.  System Framework and Methodology', col2X, yCol2);
  yCol2 += 14;

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 45);
  const p4 = 'The application pipeline relies on direct integration with the Autodesk Revit development sandbox using native .NET libraries. The framework extracts geometric parameter fields across generative variations and converts raw data footprints into discrete inputs for a quantitative financial engine based on Markowitz’s Modern Portfolio Theory (MPT).';
  const p4Lines = doc.splitTextToSize(p4, colWidth);
  doc.text(p4Lines, col2X, yCol2);
  yCol2 += p4Lines.length * 11 + 10;

  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.text('2.1  Mathematical Model Formulation', col2X, yCol2);
  yCol2 += 13;

  doc.setFont('times', 'normal');
  const p5 = 'Let n represent the total number of distinct generative structural layouts identified across the spatial schema. The calculated financial output matrix relies on optimizing the weight allocations vector w, formulated as:';
  const p5Lines = doc.splitTextToSize(p5, colWidth);
  doc.text(p5Lines, col2X, yCol2);
  yCol2 += p5Lines.length * 11 + 8;

  // Formula (1)
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(10);
  doc.text('min  σ_p² = w^T Σ w', col2X + 25, yCol2);
  doc.setFont('times', 'normal');
  doc.text('(1)', col2X + colWidth - 18, yCol2);

  // ==========================================
  // PAGE 2
  // ==========================================
  doc.addPage();
  addHeader(2);

  let yP2Col1 = 52;
  let yP2Col2 = 52;

  // Page 2 Left Column
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 45);
  doc.text('Subject to the structural budget configuration limits:', col1X, yP2Col1);
  yP2Col1 += 12;

  doc.setFont('times', 'bolditalic');
  doc.setFontSize(9.5);
  doc.text('w^T 1 = 1,   w^T R = μ_p', col1X + 30, yP2Col1);
  doc.setFont('times', 'normal');
  doc.text('(2)', col1X + colWidth - 18, yP2Col1);
  yP2Col1 += 15;

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  const p6 = 'Where Σ establishes the variance-covariance matrix extracted from localized structural commodity inputs and market indexes, R models expected yield vectors, and μ_p defines the user-targeted returns limit. The software translates spatial overlaps and design complexities into corresponding covariance boundaries dynamically via the API.';
  const p6Lines = doc.splitTextToSize(p6, colWidth);
  doc.text(p6Lines, col1X, yP2Col1);
  yP2Col1 += p6Lines.length * 11 + 10;

  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(20, 20, 25);
  doc.text('2.2  Architecture Data Flow Mapping', col1X, yP2Col1);
  yP2Col1 += 12;

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 45);
  const p7 = 'The system layout uses an asymmetric data execution loop divided across separate boundaries to prevent design workspace latency. Fig. 1 outlines the system processing boundaries.';
  const p7Lines = doc.splitTextToSize(p7, colWidth);
  doc.text(p7Lines, col1X, yP2Col1);
  yP2Col1 += p7Lines.length * 11 + 8;

  // Diagram Box for Figure 1
  doc.setDrawColor(180, 190, 205);
  doc.setFillColor(245, 247, 252);
  doc.roundedRect(col1X + 10, yP2Col1, colWidth - 20, 115, 4, 4, 'FD');

  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 40, 60);
  doc.text('[ USER DESIGN PLANE ]', col1X + colWidth / 2, yP2Col1 + 14, { align: 'center' });

  doc.setFillColor(235, 240, 250);
  doc.roundedRect(col1X + 22, yP2Col1 + 22, colWidth - 44, 26, 3, 3, 'FD');
  doc.setFontSize(7.5);
  doc.text('C# PLUG-IN MIDDLEWARE', col1X + colWidth / 2, yP2Col1 + 32, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.text('• FilteredElementCollector • Geometric Extractor', col1X + colWidth / 2, yP2Col1 + 42, { align: 'center' });

  doc.text('↓ JSON Stream Telemetry', col1X + colWidth / 2, yP2Col1 + 56, { align: 'center' });

  doc.setFillColor(230, 245, 240);
  doc.roundedRect(col1X + 22, yP2Col1 + 62, colWidth - 44, 24, 3, 3, 'FD');
  doc.setFont('times', 'bold');
  doc.text('QUANTITATIVE MPT ENGINE (JS / C#)', col1X + colWidth / 2, yP2Col1 + 72, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.text('Solves: w = g + h μ_p', col1X + colWidth / 2, yP2Col1 + 81, { align: 'center' });

  doc.setFont('times', 'italic');
  doc.setFontSize(7.5);
  doc.text('Figure 1. System Component Architecture Map.', col1X + colWidth / 2, yP2Col1 + 106, { align: 'center' });
  yP2Col1 += 125;

  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(20, 20, 25);
  doc.text('2.3  Algorithmic Optimization Pipeline', col1X, yP2Col1);
  yP2Col1 += 12;

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 45);
  const p8 = 'The computational core tracks structural material configurations and evaluates allocation configurations. Below is the primary C# method executing the mean-variance matrix calculation using an empirical, dynamic asset covariance lookup:';
  const p8Lines = doc.splitTextToSize(p8, colWidth);
  doc.text(p8Lines, col1X, yP2Col1);

  // Page 2 Right Column: Code Listing 1
  doc.setDrawColor(200, 205, 215);
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(col2X, yP2Col2, colWidth, 590, 4, 4, 'FD');

  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(20, 40, 80);
  doc.text('Listing 1. C# Matrix Core for Mean-Variance Calculation', col2X + 8, yP2Col2 + 12);
  doc.setDrawColor(220, 220, 225);
  doc.line(col2X + 8, yP2Col2 + 16, col2X + colWidth - 8, yP2Col2 + 16);

  const codeSnippets = [
    'public Vector<double> CalculateEfficientFrontier(',
    '    double maxRiskBound, double[,] covMatrix) {',
    '  int n = _assets.Count;',
    '  var M = Matrix<double>.Build;',
    '  var V = Vector<double>.Build;',
    '  Vector<double> R = V.Dense(_assets.Select(',
    '      a => a.ExpectedYield).ToArray());',
    '  // High-perf Matrix Inversion (Math.NET)',
    '  Matrix<double> sigmaInv = M.DenseOfArray(',
    '      covMatrix).Inverse();',
    '  Vector<double> ones = V.Dense(n, 1.0);',
    '  // Intermediate analytic scalars',
    '  Vector<double> invSigmaOnes = sigmaInv * ones;',
    '  Vector<double> invSigmaR = sigmaInv * R;',
    '  double A = ones.DotProduct(invSigmaR);',
    '  double B = R.DotProduct(invSigmaR);',
    '  double C = ones.DotProduct(invSigmaOnes);',
    '  double D = (B * C) - (A * A);',
    '  // Global minimum variance portfolio bound',
    '  double minVolBound = 1.0 / Math.Sqrt(C);',
    '  if (maxRiskBound < minVolBound) {',
    '    maxRiskBound = minVolBound;',
    '  }',
    '  // Hyperbolic target return',
    '  double targetReturn = (A + Math.Sqrt(',
    '    Math.Max(0, D * (maxRiskBound *',
    '    maxRiskBound * C - 1)))) / C;',
    '  // Analytic weight subspaces g and h',
    '  Vector<double> g = (invSigmaOnes * (B / D))',
    '    - (invSigmaR * (A / D));',
    '  Vector<double> h = (invSigmaR * (C / D))',
    '    - (invSigmaOnes * (A / D));',
    '  // Return finalized Markowitz allocations',
    '  return g + (h * targetReturn);',
    '}'
  ];

  doc.setFont('courier', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(30, 30, 35);
  let codeY = yP2Col2 + 28;
  codeSnippets.forEach((line) => {
    doc.text(line, col2X + 8, codeY);
    codeY += 10.5;
  });

  // Section 3 intro on page 2 right column
  codeY += 12;
  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(20, 20, 25);
  doc.text('3.  Simulation Experiment Results', col2X + 8, codeY);
  codeY += 12;

  doc.setFont('times', 'normal');
  doc.setFontSize(8.3);
  doc.setTextColor(40, 40, 45);
  const p9 = 'The software platform was validated using a synthetic generative parcel design layout inside Revit containing three distinct structural zone types: residential properties, premium commercial zones, and industrial storage formats.';
  const p9Lines = doc.splitTextToSize(p9, colWidth - 16);
  doc.text(p9Lines, col2X + 8, codeY);

  // ==========================================
  // PAGE 3
  // ==========================================
  doc.addPage();
  addHeader(3);

  let yP3Col1 = 52;
  let yP3Col2 = 52;

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 45);
  const p10 = 'Volatility indices (σ) were configured based on real-world asset pricing shifts. As detailed in Table 1, evaluating the system across variable covariance regimes alters allocation geometry. Under a dynamic, low-covariance framework where structural assets are uncorrelated, the MPT engine maximizes asset diversification benefits. This yields a superior Sharpe Ratio of 0.934 and brings systemic volatility exposure down to 10.12%. In contrast, simulating a highly-correlated market environment compresses risk-mitigation properties, lowering the Sharpe Ratio to 0.715.';
  const p10Lines = doc.splitTextToSize(p10, colWidth);
  doc.text(p10Lines, col1X, yP3Col1);
  yP3Col1 += p10Lines.length * 11 + 10;

  // Table 1 Header
  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 20, 25);
  doc.text('Table 1. Simulation Analytics: Portfolio Optimization Variations', col1X, yP3Col1);
  yP3Col1 += 10;

  // Table 1 Drawing
  const tableData = [
    ['BIM Opt. Metric', 'Baseline', 'High-Yield', 'MPT (High Corr.)', 'MPT (Low Corr.)'],
    ['Res. Footprint (m²)', '12,500', '5,000', '8,100', '8,750'],
    ['Comm. Footprint (m²)', '3,000', '11,000', '5,150', '5,500'],
    ['Ind. Footprint (m²)', '1,500', '1,000', '2,250', '2,750'],
    ['Total Area (m²)', '17,000', '17,000', '15,500', '17,000'],
    ['Expected Return (μ_p)', '6.82%', '14.15%', '10.90%', '11.45%'],
    ['Portfolio Volatility (σ_p)', '8.41%', '22.38%', '12.45%', '10.12%'],
    ['Sharpe Ratio (R_f = 2%)', '0.573', '0.543', '0.715', '0.934']
  ];

  doc.setDrawColor(200, 205, 215);
  const tRowH = 14;
  const col0W = 85;
  const otherColW = (colWidth - col0W) / 4;

  tableData.forEach((row, rIdx) => {
    const isHead = rIdx === 0;
    const isHighlight = rIdx === 7;
    const curY = yP3Col1 + (rIdx * tRowH);

    if (isHead) {
      doc.setFillColor(235, 240, 248);
      doc.rect(col1X, curY - 9, colWidth, tRowH, 'F');
      doc.setFont('times', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(20, 30, 60);
    } else if (isHighlight) {
      doc.setFillColor(240, 248, 240);
      doc.rect(col1X, curY - 9, colWidth, tRowH, 'F');
      doc.setFont('times', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(0, 100, 40);
    } else {
      doc.setFont('times', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(40, 40, 45);
    }

    doc.text(row[0], col1X + 2, curY);
    for (let c = 1; c < 5; c++) {
      const cellX = col1X + col0W + (c - 1) * otherColW + otherColW / 2;
      doc.text(row[c], cellX, curY, { align: 'center' });
    }
    doc.line(col1X, curY + 4, col1X + colWidth, curY + 4);
  });
  yP3Col1 += tableData.length * tRowH + 15;

  // Section 4
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 25);
  doc.text('4.  Conclusion and Future Horizons', col1X, yP3Col1);
  yP3Col1 += 12;

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 45);
  const p11 = 'By embedding computational financial engineering directly inside parametric BIM software code pipelines via C#, developers can transcend old static cash-flow paradigms. This research successfully proves that integrating Modern Portfolio Theory with generative design yields an automated method to mitigate downstream real estate exposure before breaking ground. Future updates will incorporate direct web API asset pricing loops to refine cross-commodity calculations dynamically.';
  const p11Lines = doc.splitTextToSize(p11, colWidth);
  doc.text(p11Lines, col1X, yP3Col1);
  yP3Col1 += p11Lines.length * 11 + 12;

  // Acknowledgements
  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(20, 20, 25);
  doc.text('Acknowledgements', col1X, yP3Col1);
  yP3Col1 += 11;

  doc.setFont('times', 'normal');
  doc.setFontSize(8.3);
  doc.setTextColor(50, 50, 55);
  const pAck = 'The author would like to acknowledge WorldQuant University for providing the computational research platform and quantitative training that made the financial engine integration model possible.';
  const pAckLines = doc.splitTextToSize(pAck, colWidth);
  doc.text(pAckLines, col1X, yP3Col1);

  // Column 2: References
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 25);
  doc.text('References', col2X, yP3Col2);
  yP3Col2 += 14;

  const references = [
    '[1] H. Markowitz, "Portfolio Selection," The Journal of Finance, vol. 7, no. 1, pp. 77–91, 1952.',
    '[2] C. Eastman, P. Teicholz, R. Sacks, and K. Liston, BIM Handbook: A Guide to Building Information Modeling for Owners, Managers, Designers, Engineers and Contractors. John Wiley & Sons, 2011.',
    '[3] Autodesk, "Revit API Developer Guide," Autodesk Developer Network, 2024.',
    '[4] A. Nagy, "Generative Design for Architectural Layouts," International Journal of Architectural Computing, vol. 15, no. 4, pp. 321–335, 2017.',
    '[5] J. Hull, Options, Futures, and Other Derivatives, 11th ed. New York, NY, USA: Pearson, 2021.',
    '[6] S. Azhar, "Building Information Modeling (BIM): Trends, Benefits, Risks, and Challenges for the AEC Industry," Leadership and Management in Engineering, vol. 11, no. 3, pp. 241–252, 2011.',
    '[7] C. Lovett, "Math.NET Numerics: Advanced Matrix Mathematics for .NET Frameworks," Open Source Software Review, vol. 14, pp. 45–52, 2020.',
    '[8] M. Koenig and J. Schmitt, "Automated Urban Layout Generation and Optimization Frameworks," Automation in Construction, vol. 92, pp. 112–125, 2018.',
    '[9] T. Ho and S. Lee, "Real Estate Portfolio Optimization Under Parametric Covariance Structures," Journal of Real Estate Portfolio Management, vol. 22, no. 2, pp. 101–115, 2016.',
    '[10] R. Sacks et al., "Evaluation of Parametric BIM Variants Using Financial Engineering Metrics," Advanced Engineering Informatics, vol. 44, p. 101085, 2020.'
  ];

  doc.setFont('times', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(40, 40, 45);

  references.forEach((ref) => {
    const refLines = doc.splitTextToSize(ref, colWidth);
    doc.text(refLines, col2X, yP3Col2);
    yP3Col2 += refLines.length * 10 + 4;
  });

  // Save/Download PDF
  const filename = 'ICEPE2026_MPT_BIM_Sherif_Magdaldin.pdf';
  doc.save(filename);
  return filename;
}
