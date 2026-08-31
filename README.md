# BIM MPT Urban Optimizer AI Agent 🏢📈🤖

**An autonomous, full-stack spatial-financial engineering co-pilot that applies Harry Markowitz's Modern Portfolio Theory (MPT) to Building Information Modeling (BIM) workflows.**

---

### 🌐 Project Links & Submission Artifacts
* **GitHub Repository:** [https://github.com/sherifmagd2019/bim-mpt-urban-optimizer](https://github.com/sherifmagd2019/bim-mpt-urban-optimizer)
* **Live App Demo (Vercel):** [https://bim-mpt-urban-optimizer-60r66r1lx-sherifmagd2019s-projects.vercel.app/](https://bim-mpt-urban-optimizer-60r66r1lx-sherifmagd2019s-projects.vercel.app/)
* **Direct Proxy Mirror Domain:** [https://mptoptimizer.ai.studio/](https://mptoptimizer.ai.studio/)
* **Video Demo Walkthrough:** [https://youtu.be/UzotNl5gPK0]  https://youtu.be/XDtnisw5jh0)
* **Devpost Submission:** [https://devpost.com/software/bim-mpt-urban-optimize](https://devpost.com/software/bim-mpt-urban-optimize)
* **Academic Context:** Prepared for presentation at the **ICEPE 2026** conference.

---

## 💡 Inspiration
Generative Urban Design and Building Information Modeling (BIM) traditionally focus entirely on physical geometries, solar values, or generic zoning footprints. They treat building zones as isolated silos, ignoring real-world volatile market factors such as varying occupancy elasticities, financial absorption velocities, and localized rental yield risks.

I was inspired by my own quantitative thesis work as an MScFE candidate at WorldQuant University. I realized that I could treat generative urban spatial distributions exactly like financial stock assets in a portfolio. By applying Harry Markowitz’s Modern Portfolio Theory (MPT), an architect could computationally balance competing spatial elements—minimizing macroeconomic covariance risk while maximizing the urban yield envelope.

---

## 🚀 What It Does
BIM MPT Urban Optimizer AI Agent is a complete, full-stack, autonomous architectural financial engineering co-pilot. It allows developers and master-planners to test zoning layouts, execute macro correlation shocks, and dynamically stream the mathematically optimal configuration directly into Autodesk Revit 2027.

The system runs as two connected components: a cloud-hosted React/Express web application providing the optimization workspace and AI co-pilot, and a local Autodesk Revit 2027 C# add-in that receives live data via a bridge server and materializes the optimized zoning directly into the BIM model.

The platform provides a highly visual, interactive web workspace containing:
* **Interactive Correlation Matrix Heatmap:** Modulate cross-asset dependencies (e.g., how Residential performance correlates to Commercial demand during economic cycles) to re-evaluate risk boundaries.
* **Markowitz Efficient Frontier Curve:** A visual interface charting the exact boundary hyperbola where no higher architectural yield can be attained for a given volatility risk level.
* **Generative BIM 3D Isometric Viewer:** A parametric grid rendering real-time spatial configurations that can be manipulated instantly.
* **Quant AI Agent Panel:** An integrated conversational terminal running Gemini with explicit tool execution logic.

---

## 🏗️ How I Built It & Infrastructure Configurations
I engineered a specialized, multi-tiered pipeline as a solo developer:
* **Google Cloud Infrastructure & Geopolitical Deployment Hurdles:** Because I am based in Egypt, strict international financial regulations and local banking rules prevented me from activating a standard Google Cloud platform billing account. To bypass this barrier and fully meet the mandatory hackathon rules, I resourcefully used direct integration deployment paths inside Google AI Studio to host the server container natively on **Google Cloud Run** (`Project ID: glossy-ripple-pc9s2`, Service: `forge-ai`). This acts as the public API handling complex optimization telemetry.
* **The Mathematical Engine:** Written in high-performance pure JavaScript (ES6), my core linear algebra solver runs partial-pivoting Gaussian elimination to invert the covariance matrix. It evaluates hyperbolic scalars $A$, $B$, $C$, and $D$ to analytically solve $w = g + h\mu_p$.
* **The Front-End Interface:** Built with React 19, Vite, Tailwind CSS, and Lucide React. Recharts was used to plot continuous frontier hyperbola lines superimposed over live Monte Carlo simulation clouds.
* **The AI Co-Pilot Node Server:** An Express backend leveraging the official `@google/genai` library. It maps unstructured natural language prompts into function arrays utilizing Gemini function calls (`runOptimization` and `checkFeasibility`).
* **The BIM Automation Bridge:** A dedicated C# .NET 10 Add-in plugin using the Autodesk Revit 2027 API. It runs an internal asynchronous HTTP background listener to avoid freezing the CAD software thread while instantly materializing 3D DirectShape mass objects over local networks.

---

## 🛑 Challenges Faced & Limits Overcome
* **International Billing Restrictions:** Local banking regulations in Egypt blocked the registration of cloud billing credentials. I overcame this by engineering an alternative configuration pipeline, deploying directly from Google AI Studio into fully functional Google Cloud Run endpoints.
* **The Unconstrained MPT Space (Negative Space Paradox):** A significant hurdle emerged when resolving raw MPT matrices: formulas occasionally resulted in negative weight variables. While a hedge fund manager can short-sell a stock, "short-selling" physical space has no logical translation in real estate (you cannot build negative square meters of an industrial warehouse). To solve this physical constraint, I introduced an analytical projection solver using a probability simplex projection script (`projectToSimplex`). This forces the generative agent weights to gracefully conform to non-negative bounds ($\sum w_i = 1.0, w_i \geq 0$) while preserving the maximum possible Sharpe ratio.
* **The Revit Threading Constraint:** The native Autodesk Revit API is strictly single-threaded, causing network requests to completely freeze the design interface. I bypassed this by implementing an asynchronous background polling loop connected to a thread-safe `IExternalEventHandler` pattern, streaming 3D geometric updates onto the view canvas seamlessly.

---

## 📈 Accomplishments That I Am Proud Of
* Successfully implemented real-time matrix inversion directly in a lightweight browser client with zero interface lag during mouse drag events.
* Empowered the AI agent to explicitly identify physical model impossibilities (infeasible bounds) and transparently explain to the user why a specific financial layout model requires simplex adjustment before generation.
* Achieved zero-UI-lock roundtrip polling sync between a React browser dashboard and a native desktop environment element engine (Autodesk Revit).

---

## 🎓 What I Learned & Future Roadmap
Cross-disciplinary engineering unlocks incredible value. Building this project taught me how to abstract spatial geometry into financial statistical matrices. I proved that financial diversification principles can actively prevent high-risk zoning clusters in urban design.

**Next Steps:** Once regional billing access limitations are resolved, I plan to expand this infrastructure by incorporating **Google Cloud SQL** and **Firestore** to cache historical architectural market data, allowing the Gemini AI Agent to run predictive risk-return scenarios across entire city layouts.
