# BIM MPT Urban Optimizer AI Agent 🏢📈🤖

**An autonomous, full-stack spatial-financial engineering co-pilot that applies Harry Markowitz's Modern Portfolio Theory (MPT) to Building Information Modeling (BIM) workflows.**

---

### 🌐 Project Links & Submission Artifacts
* **GitHub Repository:** [(https://github.com/sherifmagd2019/bim-mpt-urban-optimizer))
* **Live App Demo:** (https://mptoptimizer.ai.studio/)
* **Live App Demo:** (https://bim-mpt-urban-optimizer-60r66r1lx-sherifmagd2019s-projects.vercel.app/)
* **Video Demo Walkthrough:** [(https://youtu.be/UzotNl5gPK0))
* **Devpost Submission:**  (https://devpost.com/software/bim-mpt-urban-optimize)
* **Academic Context:** Prepared for presentation at the **ICEPE 2026** conference.

---

## 💡 The Core Innovation
Traditional real estate development layout planning relies on slow, intuitive processes. Urban planners separate spatial layout planning from financial risk mitigation. 

The **BIM MPT Urban Optimizer** bridges this gap. It treats localized multi-asset urban configurations (Residential, Commercial, Industrial) like a **diversified financial asset portfolio**. 

By applying linear matrix programming models directly into generative 3D spaces, this tool enables structural developers to automate architectural asset planning. It maps the **Markowitz Efficient Frontier** in real time, maximizing structural financial yields for any chosen target spatial risk constraint.

---

## 🧮 Algorithmic Code Engine & Mathematical Formulation

The system avoids high risk concentrations across complex zoning blocks by solving an exact analytical vector optimization framework.

### 1. Optimization Objectives & Feasibility Constraints
* **Objective Function:** Minimize spatial asset portfolio variance (structural layout risk exposure):
  \[\min_w \sigma_p^2 = w^T \Sigma w\]
* **Total Capacity Constraint:** The absolute vector sum of all component weights must perfectly fill the available boundary zone capacity:
  \[\sum w_i = 1\]
* **Long-Only Zoning Projection Constraint:** Standard analytical equations allow negative asset shorts. Because you cannot construct negative square meters (m²) of a building structure, the core javascript engine implements a **probability simplex projection algorithm** (`projectToSimplex`). It automatically caps zero boundaries and normalizes tracking remainders cleanly.

### 2. Matrix Covariance Inversion & Intermediate Scalars
An arbitrary N × N variance-covariance matrix Σ is computed using pairwise cross-asset correlation sliders (\(\rho_{ij}\)) and historical commodity volatilities (\(\sigma_i\)):
\[\Sigma_{ij} = \rho_{ij} \cdot \sigma_i \cdot \sigma_j\]

The engine performs **Gaussian elimination with partial pivoting** to compute the inverted covariance matrix Σ⁻¹, isolating four critical parabolic hyperbolic scalar variables:
* **Scalar A:** \(1^T \Sigma^{-1} R\) (Unit sum dot return vector)
* **Scalar B:** \(R^T \Sigma^{-1} R\) (Return vector quadratic form)
* **Scalar C:** \(1^T \Sigma^{-1} 1\) (Unit vector quadratic form)
* **Determinant D:** BC - A² (Parabolic discriminant used to graph the curve)

### 3. Subspace Basis Combinations
The system constructs two fundamental allocation subspace vectors, **Vector g (Constant)** and **Vector h (Slope)**:
\[g = \frac{B \cdot (\Sigma^{-1} 1) - A \cdot (\Sigma^{-1} R)}{D}\]
\[h = \frac{C \cdot (\Sigma^{-1} R) - A \cdot (\Sigma^{-1} 1)}{D}\]

The final target asset weight allocation vector w is derived by combining the subspaces linear parameters with the selected target yield (\(\mu_p\)): 
\[w = g + h \cdot \mu_p\]

---

## 🏗️ System Architecture & Bidirectional Data Flow

The platform utilizes a multi-tier, real-time telemetry framework that links web-based analytics with desktop CAD execution.

