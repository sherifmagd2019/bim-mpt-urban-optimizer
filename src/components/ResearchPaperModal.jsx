import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  Sparkles, 
  GraduationCap, 
  ExternalLink, 
  CheckCircle2, 
  BookOpen, 
  Code2, 
  Award,
  Layers,
  ChevronRight
} from 'lucide-react';
import { generateAndDownloadPaperPDF } from '../lib/pdfGenerator';

export const ResearchPaperModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('page1');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    try {
      setIsDownloading(true);
      generateAndDownloadPaperPDF();
      setDownloadSuccess(true);
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setIsDownloading(false);
    }
  };

  return (
    <div id="research-paper-modal" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="sleek-glass border border-indigo-500/40 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden bg-slate-950/95">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-indigo-500/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 border border-indigo-400/40">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-md border border-indigo-400/40">
                  ICEPE 2026 Paper
                </span>
                <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Sherif Ahmad Magdaldin
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight mt-0.5">
                Modern Portfolio Theory in Generative Urban BIM Layouts
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="modal-btn-download-pdf"
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white shadow-lg shadow-indigo-600/40 border border-indigo-400/40 transition-all cursor-pointer flex items-center gap-2"
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  <span>PDF Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>{isDownloading ? 'Generating PDF...' : 'Download Official PDF'}</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Page Switcher Tabs */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Paper Sections:</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveTab('page1')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'page1'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Page 1 (Abstract & Formulation)
              </button>
              <button
                onClick={() => setActiveTab('page2')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'page2'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Page 2 (Architecture & C# Engine)
              </button>
              <button
                onClick={() => setActiveTab('page3')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'page3'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Page 3 (Table 1 Benchmarks & References)
              </button>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
            <span>3 Pages</span>
            <span>•</span>
            <span>Peer-Reviewed AEC Formulation</span>
          </div>
        </div>

        {/* Paper Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-900/50">
          <div className="max-w-4xl mx-auto bg-white text-slate-900 rounded-xl shadow-2xl p-6 sm:p-12 font-serif border border-slate-200">
            
            {activeTab === 'page1' && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center space-y-2 pb-4 border-b border-slate-200">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200">
                    ICEPE 2026 Conference Research Paper
                  </span>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-950 leading-tight pt-2">
                    A C# Application of Modern Portfolio Theory for Financial Risk-Return Optimization in Generative Urban BIM Layouts
                  </h1>
                  <div className="font-sans text-sm font-semibold text-slate-800 pt-1">
                    Sherif Ahmad Magdaldin
                  </div>
                  <div className="font-sans text-xs text-slate-600 space-y-0.5">
                    <div>Civil and Structural Engineer</div>
                    <div>Master of Financial Engineering Program, WorldQuant University</div>
                    <div>New Orleans, Louisiana, USA</div>
                    <div className="text-indigo-600 font-medium">sherifmagd@gmail.com</div>
                  </div>
                </div>

                {/* Abstract */}
                <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 space-y-2">
                  <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 text-center">
                    Abstract
                  </h3>
                  <p className="text-xs sm:text-[13px] leading-relaxed text-slate-700 text-justify">
                    Traditional cost estimation techniques within Architecture, Engineering, and Construction (AEC) frameworks typically treat generative design variations as isolated assets, ignoring the financial dependencies and systematic risks embedded across large-scale urban developments. This paper introduces an automated software application built in C# using the Revit API that implements quantitative financial frameworks to optimize design selection. By parsing geometric and material parameters from generative BIM instances, the engine applies Harry Markowitz’s Modern Portfolio Theory (MPT) to evaluate multiple building design layouts as an investment portfolio. The software programmatically computes historical price variances and cross-asset correlation matrices to establish an optimal financial risk-return profile. The final software execution maps an “Efficient Frontier” directly within the designer’s environment, allowing developers to visually isolate layouts that maximize yield while minimizing downside market risk exposure. This methodology establishes an objective, data-driven link between spatial generative design and advanced asset-portfolio engineering.
                  </p>
                </div>

                <div className="font-sans text-xs text-slate-700">
                  <strong className="text-slate-900">Keywords: </strong>
                  <em>ICEPE 2026, Revit API, C#, Modern Portfolio Theory, Generative BIM, Architectural Financial Engineering</em>
                </div>

                {/* Body Column */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 text-xs sm:text-[13px] leading-relaxed text-slate-800 text-justify">
                  <div className="space-y-3">
                    <h3 className="font-sans font-bold text-sm text-slate-900 border-b border-slate-200 pb-1">
                      1.  Introduction
                    </h3>
                    <p>
                      The convergence of algorithmic architectural creation and computational finance represents a new paradigm shift for the Architecture, Engineering, and Construction (AEC) software domain. Historically, structural design platforms and capital deployment calculation channels have operated in isolated silos. Designers leverage parametric Building Information Modeling (BIM) programs to modify spatial arrangements based on structural efficiency, volume limits, or aesthetic objectives.
                    </p>
                    <p>
                      Concurrently, investment analysts rely on disconnected matrix computations via standard spreadsheets to measure project feasibility. This data silo introduces structural fragmentation into multi-asset real estate portfolio evaluations, rendering real-time adjustments highly error-prone.
                    </p>
                    <p>
                      Furthermore, traditional infrastructure financial frameworks are bound to static Net Present Value (NPV) formulas. These procedures fail to model risk dynamics and covariance behaviors that arise when multi-building developments are executed simultaneously in a volatile marketplace.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-sans font-bold text-sm text-slate-900 border-b border-slate-200 pb-1">
                      2.  System Framework & Methodology
                    </h3>
                    <p>
                      To bridge this analytical disconnect, this paper presents an interconnected runtime engine compiled in C# that exposes real-time portfolio optimization analytics directly inside standard BIM development environments.
                    </p>
                    <p>
                      The application pipeline relies on direct integration with the Autodesk Revit development sandbox using native .NET libraries. The framework extracts geometric parameter fields across generative variations and converts raw data footprints into discrete inputs for a quantitative financial engine based on Markowitz’s Modern Portfolio Theory (MPT).
                    </p>
                    <h4 className="font-sans font-bold text-xs text-slate-900 pt-1">
                      2.1 Mathematical Model Formulation
                    </h4>
                    <p>
                      Let <em>n</em> represent the total number of distinct generative structural layouts identified across the spatial schema. The calculated financial output matrix relies on optimizing the weight allocations vector <strong>w</strong>, formulated as:
                    </p>
                    <div className="bg-slate-100 p-3 rounded text-center font-mono text-xs font-bold text-indigo-900 border border-slate-300 my-2">
                      min<sub>w</sub> &nbsp; σ<sub>p</sub><sup>2</sup> = w<sup>T</sup> Σ w &nbsp;&nbsp;&nbsp; (1)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'page2' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs text-slate-500 font-sans">
                  <span>Page 2 • Architecture Data Flow & Algorithmic Optimization Pipeline</span>
                  <span className="font-bold text-indigo-600">ICEPE 2026</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-[13px] leading-relaxed text-slate-800 text-justify">
                  <div className="space-y-3">
                    <p>Subject to the structural budget configuration limits:</p>
                    <div className="bg-slate-100 p-2.5 rounded text-center font-mono text-xs font-bold text-indigo-900 border border-slate-300">
                      w<sup>T</sup> 1 = 1, &nbsp;&nbsp;&nbsp; w<sup>T</sup> R = μ<sub>p</sub> &nbsp;&nbsp;&nbsp; (2)
                    </div>
                    <p>
                      Where Σ establishes the variance-covariance matrix extracted from localized structural commodity inputs and market indexes, R models expected yield vectors, and μ<sub>p</sub> defines the user-targeted returns limit.
                    </p>

                    <h4 className="font-sans font-bold text-xs text-slate-900 pt-2">
                      2.2 Architecture Data Flow Mapping
                    </h4>
                    <p>
                      The system layout uses an asymmetric data execution loop divided across separate boundaries to prevent design workspace latency.
                    </p>

                    {/* Figure 1 Visual Box */}
                    <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 text-center font-sans space-y-2">
                      <div className="font-bold text-slate-900 text-[11px] bg-slate-200 py-1 rounded">
                        [ USER DESIGN PLANE / AUTODESK REVIT 2027 ]
                      </div>
                      <div className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 p-1.5 rounded border border-indigo-200">
                        C# PLUG-IN MIDDLEWARE (FilteredElementCollector)
                      </div>
                      <div className="text-[10px] text-slate-500">↓ Live JSON Stream Telemetry</div>
                      <div className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 p-1.5 rounded border border-emerald-200">
                        QUANTITATIVE ENGINE: Solves w = g + h μ<sub>p</sub>
                      </div>
                      <div className="text-[10px] text-slate-600 font-serif italic pt-1">
                        Figure 1. System Component Architecture Map.
                      </div>
                    </div>

                    <h4 className="font-sans font-bold text-xs text-slate-900 pt-2">
                      2.3 Algorithmic Optimization Pipeline
                    </h4>
                    <p>
                      The computational core tracks structural material configurations and evaluates allocation configurations via high-performance matrix inversion.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="bg-slate-900 text-slate-200 p-3.5 rounded-lg font-mono text-[11px] leading-snug border border-slate-700 shadow-inner">
                      <div className="text-amber-400 font-bold text-[10px] pb-1 border-b border-slate-700 mb-2">
                        Listing 1. C# Matrix Core for Mean-Variance Portfolio Calculation
                      </div>
                      <pre className="overflow-x-auto whitespace-pre font-mono text-[10px]">
{`public Vector<double> CalculateEfficientFrontier(
    double maxRiskBound, double[,] covMatrix) {
  int n = _assets.Count;
  var M = Matrix<double>.Build;
  var V = Vector<double>.Build;
  Vector<double> R = V.Dense(_assets.Select(
      a => a.ExpectedYield).ToArray());

  Matrix<double> sigmaInv = M.DenseOfArray(
      covMatrix).Inverse();
  Vector<double> ones = V.Dense(n, 1.0);

  Vector<double> invSigmaOnes = sigmaInv * ones;
  Vector<double> invSigmaR = sigmaInv * R;
  double A = ones.DotProduct(invSigmaR);
  double B = R.DotProduct(invSigmaR);
  double C = ones.DotProduct(invSigmaOnes);
  double D = (B * C) - (A * A);

  double minVolBound = 1.0 / Math.Sqrt(C);
  if (maxRiskBound < minVolBound) {
    maxRiskBound = minVolBound;
  }

  double targetReturn = (A + Math.Sqrt(
    Math.Max(0, D * (maxRiskBound *
    maxRiskBound * C - 1)))) / C;

  Vector<double> g = (invSigmaOnes * (B / D))
    - (invSigmaR * (A / D));
  Vector<double> h = (invSigmaR * (C / D))
    - (invSigmaOnes * (A / D));

  return g + (h * targetReturn);
}`}
                      </pre>
                    </div>

                    <h4 className="font-sans font-bold text-xs text-slate-900 pt-2">
                      3. Simulation Experiment Results
                    </h4>
                    <p className="text-justify text-xs">
                      The software platform was validated using a synthetic generative parcel design layout inside Revit containing three distinct structural zone types: residential, commercial, and industrial.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'page3' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs text-slate-500 font-sans">
                  <span>Page 3 • Table 1 Simulation Analytics, Conclusion & References</span>
                  <span className="font-bold text-indigo-600">ICEPE 2026</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-[13px] leading-relaxed text-slate-800 text-justify">
                  <div className="space-y-3">
                    <p>
                      As detailed in Table 1, evaluating the system across variable covariance regimes alters allocation geometry. Under a dynamic, low-covariance framework where structural assets are uncorrelated, the MPT engine maximizes asset diversification benefits. This yields a superior Sharpe Ratio of <strong>0.934</strong> and brings systemic volatility exposure down to <strong>10.12%</strong>.
                    </p>

                    {/* Table 1 */}
                    <div className="overflow-x-auto my-2">
                      <table className="w-full text-[11px] font-sans border-collapse border border-slate-300">
                        <thead>
                          <tr className="bg-indigo-50 text-slate-900 font-bold border-b border-slate-300">
                            <th className="p-1.5 text-left border-r border-slate-300">Metric</th>
                            <th className="p-1.5 text-right border-r border-slate-300">Base</th>
                            <th className="p-1.5 text-right border-r border-slate-300">Yield</th>
                            <th className="p-1.5 text-right border-r border-slate-300">High Corr</th>
                            <th className="p-1.5 text-right bg-emerald-100 text-emerald-900">Low Corr</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          <tr>
                            <td className="p-1.5 font-medium border-r border-slate-200">Res. (m²)</td>
                            <td className="p-1.5 text-right border-r border-slate-200">12,500</td>
                            <td className="p-1.5 text-right border-r border-slate-200">5,000</td>
                            <td className="p-1.5 text-right border-r border-slate-200">8,100</td>
                            <td className="p-1.5 text-right font-bold text-indigo-700 bg-emerald-50">8,750</td>
                          </tr>
                          <tr>
                            <td className="p-1.5 font-medium border-r border-slate-200">Comm. (m²)</td>
                            <td className="p-1.5 text-right border-r border-slate-200">3,000</td>
                            <td className="p-1.5 text-right border-r border-slate-200">11,000</td>
                            <td className="p-1.5 text-right border-r border-slate-200">5,150</td>
                            <td className="p-1.5 text-right font-bold text-indigo-700 bg-emerald-50">5,500</td>
                          </tr>
                          <tr>
                            <td className="p-1.5 font-medium border-r border-slate-200">Ind. (m²)</td>
                            <td className="p-1.5 text-right border-r border-slate-200">1,500</td>
                            <td className="p-1.5 text-right border-r border-slate-200">1,000</td>
                            <td className="p-1.5 text-right border-r border-slate-200">2,250</td>
                            <td className="p-1.5 text-right font-bold text-indigo-700 bg-emerald-50">2,750</td>
                          </tr>
                          <tr className="bg-slate-50 font-bold">
                            <td className="p-1.5 border-r border-slate-200">Area (m²)</td>
                            <td className="p-1.5 text-right border-r border-slate-200">17,000</td>
                            <td className="p-1.5 text-right border-r border-slate-200">17,000</td>
                            <td className="p-1.5 text-right border-r border-slate-200">15,500</td>
                            <td className="p-1.5 text-right text-emerald-800 bg-emerald-100">17,000</td>
                          </tr>
                          <tr>
                            <td className="p-1.5 font-medium border-r border-slate-200">Yield (μ_p)</td>
                            <td className="p-1.5 text-right border-r border-slate-200">6.82%</td>
                            <td className="p-1.5 text-right border-r border-slate-200">14.15%</td>
                            <td className="p-1.5 text-right border-r border-slate-200">10.90%</td>
                            <td className="p-1.5 text-right font-bold text-emerald-700 bg-emerald-50">11.45%</td>
                          </tr>
                          <tr>
                            <td className="p-1.5 font-medium border-r border-slate-200">Risk (σ_p)</td>
                            <td className="p-1.5 text-right border-r border-slate-200">8.41%</td>
                            <td className="p-1.5 text-right border-r border-slate-200">22.38%</td>
                            <td className="p-1.5 text-right border-r border-slate-200">12.45%</td>
                            <td className="p-1.5 text-right font-bold text-emerald-700 bg-emerald-50">10.12%</td>
                          </tr>
                          <tr className="bg-emerald-100 font-bold text-emerald-950">
                            <td className="p-1.5 border-r border-slate-200">Sharpe Ratio</td>
                            <td className="p-1.5 text-right border-r border-slate-200">0.573</td>
                            <td className="p-1.5 text-right border-r border-slate-200">0.543</td>
                            <td className="p-1.5 text-right border-r border-slate-200">0.715</td>
                            <td className="p-1.5 text-right text-emerald-900 text-xs">0.934</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <h3 className="font-sans font-bold text-sm text-slate-900 border-b border-slate-200 pb-1 pt-2">
                      4.  Conclusion
                    </h3>
                    <p>
                      By embedding computational financial engineering directly inside parametric BIM software code pipelines via C#, developers can transcend old static cash-flow paradigms.
                    </p>

                    <h4 className="font-sans font-bold text-xs text-slate-900 pt-1">
                      Acknowledgements
                    </h4>
                    <p className="text-slate-600 text-xs">
                      The author would like to acknowledge WorldQuant University for providing the computational research platform and quantitative training.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-sans font-bold text-sm text-slate-900 border-b border-slate-200 pb-1">
                      References
                    </h3>
                    <div className="space-y-1.5 text-[10px] leading-relaxed text-slate-700 font-sans">
                      <p>[1] H. Markowitz, “Portfolio Selection,” <em>The Journal of Finance</em>, vol. 7, no. 1, pp. 77–91, 1952.</p>
                      <p>[2] C. Eastman, P. Teicholz, R. Sacks, and K. Liston, <em>BIM Handbook: A Guide to Building Information Modeling</em>, John Wiley & Sons, 2011.</p>
                      <p>[3] Autodesk, “Revit API Developer Guide,” Autodesk Developer Network, 2024.</p>
                      <p>[4] A. Nagy, “Generative Design for Architectural Layouts,” <em>Int. J. Arch. Computing</em>, vol. 15, no. 4, pp. 321–335, 2017.</p>
                      <p>[5] J. Hull, <em>Options, Futures, and Other Derivatives</em>, 11th ed. Pearson, 2021.</p>
                      <p>[6] S. Azhar, “BIM: Trends, Benefits, Risks, and Challenges for AEC,” <em>Leadership and Management in Engineering</em>, 2011.</p>
                      <p>[7] C. Lovett, “Math.NET Numerics: Advanced Matrix Mathematics,” <em>Open Source Softw. Rev.</em>, 2020.</p>
                      <p>[8] M. Koenig and J. Schmitt, “Automated Urban Layout Generation,” <em>Automation in Construction</em>, 2018.</p>
                      <p>[9] T. Ho and S. Lee, “Real Estate Portfolio Optimization Under Parametric Covariance Structures,” <em>J. Real Estate Portf. Manag.</em>, 2016.</p>
                      <p>[10] R. Sacks et al., “Evaluation of Parametric BIM Variants Using Financial Engineering Metrics,” <em>Adv. Eng. Inform.</em>, 2020.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 font-sans">
            Author: <strong className="text-amber-300">Sherif Ahmad Magdaldin</strong> • Conference: <strong className="text-indigo-300">ICEPE 2026</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF File (3 Pages)
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
