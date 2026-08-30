# Autodesk Revit 2027 C# Add-In (Visual Studio 2026 / Nice3point Toolkit)

**Research Base:** *"Modern Portfolio Theory in Generative Urban BIM Layouts"*  
**Author:** Sherif Ahmad Magdaldin (*ICEPE 2026*)  
**Target Framework:** `.NET 8.0-windows` (x64) for Autodesk Revit 2027

---

## 📁 Solution Architecture

```
/src/revit-addin/
├── RevitMptOptimizer.sln            # Visual Studio 2026 / 2022 Solution File
├── RevitMptOptimizer.csproj         # Modern .NET 8.0 SDK-style Project with Nice3point NuGet
├── RevitMptOptimizer.addin          # Autodesk Revit 2027 Add-In Manifest
├── Application.cs                   # ExternalApplication ribbon bar with Status Notice Box
├── Commands/
│   ├── ToggleLiveBridgeCommand.cs   # Starts/Stops Port 8080 HTTP server
│   ├── PushModelToReactCommand.cs   # Harvests Revit elements & posts to React UI
│   └── GenerateMptLayoutCommand.cs  # Markowitz solver & 3D DirectShape generator
├── Core/
│   ├── AsyncRevitLayoutHandler.cs   # Nice3point AsyncEventHandler (Non-blocking UI thread)
│   └── LiveBridgeServer.cs          # HttpListener (Port 8080) with full CORS & PNA
└── Models/
    └── MasterplanBridgeDto.cs       # Two-Way DTO serialization classes
```

---

## ⚡ How to Build & Run in Visual Studio 2026

1. Open `RevitMptOptimizer.sln` in **Visual Studio 2026** (or Visual Studio 2022 v17.10+).
2. Ensure configuration is set to **Debug | x64** or **Release | x64**.
3. Build the Solution (`Ctrl+Shift+B`).
   - The post-build target automatically copies `RevitMptOptimizer.addin` and compiled binaries to:
     `%APPDATA%\Autodesk\Revit\Addins\2027\`
4. Launch **Autodesk Revit 2027**.
5. Switch to the **FinBIM MPT** ribbon tab:
   - **Connect Bridge:** Starts the async HTTP listener on `http://localhost:8080/`.
   - **Status Notice Box:** Displays incoming change notifications in real-time.
   - **Push Data to React:** Harvests Revit geometry and pushes it live to the React web optimizer.
   - **Generate MPT Tangency Layout:** Runs analytical Markowitz quadratic simplex and instantiates 3D DirectShapes.
