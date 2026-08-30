# Troubleshooting Guide

**BIM MPT Urban Optimizer - Common Issues and Solutions**

---

## Table of Contents

1. [Server Issues](#server-issues)
2. [C# Add-in Issues](#c-add-in-issues)
3. [React UI Issues](#react-ui-issues)
4. [Communication Issues](#communication-issues)
5. [Performance Issues](#performance-issues)
6. [Security Issues](#security-issues)
7. [Deployment Issues](#deployment-issues)

---

## Server Issues

### Express Server Won't Start

**Symptom:** Error when running `npm start` or `node server.js`

**Possible Causes:**

1. **Port 3000 already in use**
   ```bash
   # Check what's using the port
   netstat -ano | findstr :3000
   
   # Kill the process (Windows)
   taskkill /PID <PID> /F
   
   # Or use a different port
   EXPRESS_PORT=3001 node server.js
   ```

2. **Missing dependencies**
   ```bash
   # Install all dependencies
   npm install
   
   # Check for errors
   npm list
   ```

3. **Missing .env file**
   ```bash
   # Create .env from template
   cp .env.example .env
   
   # Add your Gemini API key
   GEMINI_API_KEY=your_key_here
   ```

4. **Node version mismatch**
   ```bash
   # Check Node version (needs 18+)
   node --version
   
   # Update if needed
   # Go to: https://nodejs.org/
   ```

**Solution:**
```bash
# Fresh install
rm -rf node_modules package-lock.json
npm install

# Start with debug logging
NODE_ENV=development LOG_LEVEL=debug npm start
```

---

### Server Crashes on Startup

**Symptom:** Server starts then crashes immediately

**Possible Causes:**

1. **Invalid .env file**
   ```bash
   # Check .env syntax
   cat .env
   
   # Make sure no special characters without quotes
   CORS_ALLOWED_ORIGINS="http://localhost:3000"
   ```

2. **Missing GEMINI_API_KEY**
   ```bash
   # Verify it's set
   echo $GEMINI_API_KEY
   
   # Add to .env
   GEMINI_API_KEY=your_actual_key
   ```

3. **Database connection failure** (if using database)
   ```bash
   # Check database is running
   # For MongoDB: mongod should be running
   # For PostgreSQL: psql should be accessible
   ```

**Solution:**
```bash
# Enable debug mode
NODE_ENV=development node server.js

# Check console for specific error
# Fix and restart
```

---

### Rate Limiting Too Strict

**Symptom:** Getting 429 (Too Many Requests) errors frequently

**Possible Causes:**

1. **Test requests hitting rate limit**
   ```bash
   # Check current rate limit settings
   grep API_RATE_LIMIT .env
   ```

2. **Too many polling requests**
   ```javascript
   // In useRevitLiveSync.js, adjust polling interval
   // Current: 1500ms
   // If needed: 3000ms (less frequent)
   ```

**Solution:**

Update `.env`:
```env
# Increase for development
API_RATE_LIMIT_REQUESTS=1000
API_RATE_LIMIT_WINDOW_MS=60000  # 1 minute
```

---

## C# Add-in Issues

### C# Add-in Won't Compile

**Symptom:** Build errors in Visual Studio

**Possible Causes:**

1. **Revit SDK not found**
   ```
   Error: The type or namespace name 'Revit' could not be found
   ```
   
   **Solution:**
   - Download Revit 2027 SDK
   - Add reference to RevitAPI.dll and RevitAPIUI.dll
   - Path: `C:\Program Files\Autodesk\Revit 2027\`

2. **.NET version mismatch**
   ```
   Error: Target framework net8.0 not installed
   ```
   
   **Solution:**
   - Download .NET 8.0 SDK
   - Update .csproj to use correct target
   ```xml
   <TargetFramework>net8.0-windows</TargetFramework>
   ```

3. **NuGet package missing**
   ```
   Error: The type or namespace name 'Newtonsoft' could not be found
   ```
   
   **Solution:**
   ```bash
   # In Package Manager Console
   Install-Package Newtonsoft.Json
   Install-Package MathNet.Numerics
   ```

**Solution:**
```bash
# Clean and rebuild
cd CSharp
dotnet clean
dotnet build -c Release
```

---

### C# Add-in Won't Load in Revit

**Symptom:** Add-in doesn't appear in Revit Add-Ins ribbon

**Possible Causes:**

1. **DLL not in correct location**
   ```bash
   # Should be in %APPDATA%\Autodesk\Revit\Addins\2027\
   
   # Windows Explorer path
   %APPDATA%\Autodesk\Revit\Addins\2027\
   
   # Or via PowerShell
   echo $env:APPDATA
   ```

2. **Manifest (.addin) file invalid**
   - Check file is in same folder as DLL path points to
   - Verify DLL path in .addin matches actual location
   
   ```xml
   <!-- In RevitMptUrbanOptimizer.addin -->
   <Assembly>C:\Full\Path\To\RevitMptUrbanOptimizer.dll</Assembly>
   ```

3. **Revit hasn't loaded add-ins yet**
   - Restart Revit completely
   - Check Revit Output window for errors
   - Open new project

**Solution:**
```bash
# Verify locations
dir "%APPDATA%\Autodesk\Revit\Addins\2027\"

# Check .addin file
type "%APPDATA%\Autodesk\Revit\Addins\2027\RevitMptUrbanOptimizer.addin"

# If file is corrupt, re-copy it
copy "C:\your\project\RevitMptUrbanOptimizer.addin" "%APPDATA%\Autodesk\Revit\Addins\2027\"

# Restart Revit
```

---

### C# Add-in Crashes in Revit

**Symptom:** "Encountered Exception" message in Revit

**Possible Causes:**

1. **HttpListener port in use**
   ```bash
   netstat -ano | findstr :8080
   
   # Kill process using it
   taskkill /PID <PID> /F
   ```

2. **Thread safety violation**
   - Ensure all Revit API calls happen on UI thread
   - Use ExternalEventHandler pattern
   - See Program.cs for correct pattern

3. **Memory leak**
   - Check for unclosed resources
   - Verify Transaction disposal
   - Check HttpListener cleanup

**Solution:**
```
1. Check Revit Output window for full error
2. Enable debug mode in Visual Studio
3. Run with breakpoints
4. Verify all Revit API calls are on UI thread
```

---

## React UI Issues

### React App Won't Start

**Symptom:** Error when running `npm run dev` or `npm start`

**Possible Causes:**

1. **Port 5173 (Vite) in use**
   ```bash
   netstat -ano | findstr :5173
   taskkill /PID <PID> /F
   ```

2. **Missing dependencies**
   ```bash
   npm install
   ```

3. **Corrupt node_modules**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

**Solution:**
```bash
npm run dev
# Should see: Local: http://localhost:5173
```

---

### Components Not Rendering

**Symptom:** Blank white screen or missing components

**Possible Causes:**

1. **JavaScript errors in console**
   - Open DevTools (F12)
   - Check Console tab for errors
   - Fix syntax errors

2. **Missing component files**
   ```bash
   # Verify files exist
   ls -la src/components/RevitExportModal.jsx
   ls -la src/hooks/useRevitLiveSync.js
   ```

3. **Import path issues**
   ```javascript
   // Wrong
   import Component from './RevitExportModal'
   
   // Right
   import Component from './RevitExportModal.jsx'
   ```

**Solution:**
```bash
# Check for errors
npm run lint

# Check DevTools Console (F12)
# Look for red errors
```

---

### Styles Not Loading

**Symptom:** Components render but styling is missing

**Possible Causes:**

1. **CSS not imported**
   ```javascript
   // Add to component file
   import './styles.css'
   ```

2. **Vite not serving static files**
   ```bash
   # Check public folder exists
   ls -la public/
   ```

**Solution:**
```bash
npm run dev
# Clear browser cache (Ctrl+Shift+Delete)
```

---

## Communication Issues

### C# Endpoint Not Responding

**Symptom:** "Network Error: localhost:8080 unreachable"

**Possible Causes:**

1. **C# add-in not running**
   ```bash
   # Check if listening
   netstat -ano | findstr :8080
   
   # If nothing, open Revit and start add-in command
   ```

2. **Revit project not open**
   - Open Revit with any project
   - Go to Add-Ins ribbon
   - Click "MPT Bidirectional Web Bridge"
   - Should see dialog: "✓ Two-Way Bridge Active!"

3. **Firewall blocking**
   - Check Windows Firewall
   - Allow localhost traffic
   - Or disable for testing

**Solution:**
```bash
# Check if C# is listening
netstat -ano | findstr :8080

# If nothing shown:
# 1. Open Revit
# 2. Go to Add-Ins ribbon
# 3. Click add-in command
# 4. Retry from React UI
```

---

### React → C# Request Fails

**Symptom:** Click "Push Layout to Revit" but get error

**Possible Causes:**

1. **C# not listening** (see above)

2. **Invalid request payload**
   - Check browser DevTools Network tab
   - Look at request JSON
   - Verify all required fields present

3. **CORS error**
   ```
   Access to XMLHttpRequest blocked by CORS policy
   ```
   
   **Solution:**
   ```bash
   # Make sure C# is listening on localhost:8080
   # React should be able to reach it
   
   # If not working, check if you're on same machine
   # If remote, need HTTPS + proper CORS headers
   ```

**Solution:**
```javascript
// In React component
console.log('Sending:', JSON.stringify(payload, null, 2));

// Then check Network tab (F12)
// Look for POST to localhost:8080/revit-mpt-bridge/
// Check response status and JSON
```

---

### C# → React Updates Not Working

**Symptom:** Modify geometry in Revit but React doesn't update

**Possible Causes:**

1. **React not polling Express**
   - Check Network tab (F12)
   - Should see GET requests to /api/revit/model-changed
   - Should happen every 1.5 seconds

2. **C# not sending telemetry**
   - Modify geometry in Revit
   - Check Revit Output window for errors
   - Verify DocumentChanged event fires

3. **Express not caching state**
   ```bash
   # Test manually
   curl http://localhost:3000/api/revit/model-changed
   
   # Should show latest state (or empty if no updates)
   ```

**Solution:**
```bash
# Check Network tab in DevTools (F12)
# If no GET requests:
#   1. Check useRevitLiveSync.js is loaded
#   2. Check polling interval (1500ms)
#   3. Check browser console for errors

# If GET requests but no data:
#   1. Check C# is sending telemetry
#   2. Modify geometry in Revit
#   3. Check Express is receiving it
```

---

## Performance Issues

### Revit UI Freezing

**Symptom:** Revit interface becomes unresponsive

**Possible Causes:**

1. **Too many geometry objects**
   - Requesting 1000+ elements at once
   - Revit transaction taking too long

2. **Synchronous Revit API calls**
   - Ensure ExternalEventHandler is used
   - Never call Revit API from HTTP thread

3. **Memory leak**
   - Check for unclosed resources
   - Verify transactions are committed

**Solution:**
- Reduce number of elements per request
- Check C# code uses ExternalEventHandler
- Monitor memory usage in Task Manager

---

### Slow React Response

**Symptom:** React UI is sluggish

**Possible Causes:**

1. **Too many re-renders**
   ```javascript
   // Use React DevTools Profiler
   // Check for unnecessary renders
   ```

2. **Large datasets**
   - Too many assets in array
   - Too many layout blocks

3. **Inefficient calculations**
   - Portfolio calculations happening too often
   - Correlation matrix recalculated unnecessarily

**Solution:**
```bash
# Profile React performance
# In DevTools → Profiler tab
# Record and analyze

# Optimize:
# - Use useMemo for expensive calculations
# - Use useCallback for functions
# - Lazy load components
```

---

## Security Issues

### CORS Errors

**Symptom:** Browser blocks requests with CORS error

**Error:**
```
Access to XMLHttpRequest from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Solution:**

Check `.env`:
```env
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

If still failing:
```bash
# Clear browser cache
# Hard refresh (Ctrl+Shift+R)
# Check DevTools Console for details
```

---

### Rate Limiting Blocking Requests

**Symptom:** Getting 429 errors frequently

**Solution:**

Adjust in `.env`:
```env
# For development - very permissive
API_RATE_LIMIT_REQUESTS=10000
API_RATE_LIMIT_WINDOW_MS=60000
```

---

### HTTPS Not Working (Production)

**Symptom:** Mixed content error, insecure connection

**Solution:**

Production setup needed:
```bash
# Generate SSL certificate
# Use Let's Encrypt or buy certificate

# Update .env
REVIT_HTTPS_ENABLED=true
```

---

## Deployment Issues

### Docker Container Won't Start

```bash
# Check logs
docker logs <container_id>

# Verify environment variables
docker run -e EXPRESS_PORT=3000 ...

# Rebuild if needed
docker build -t bim-mpt .
```

---

### Heroku/Cloud Deployment Fails

1. **Port configuration**
   - Use `process.env.PORT` instead of hardcoded 3000
   - Already done in server.js ✓

2. **Environment variables**
   - Set via Heroku Config Vars / Cloud settings
   - Must include: GEMINI_API_KEY

3. **Buildpack**
   ```bash
   heroku create bim-mpt
   heroku config:set GEMINI_API_KEY=...
   git push heroku main
   ```

---

## Getting Help

### Debug Mode

Enable maximum logging:
```bash
NODE_ENV=development LOG_LEVEL=debug npm start
```

### Check System Info

```bash
# Node version
node --version

# npm version
npm --version

# Port availability
netstat -ano | findstr :3000
netstat -ano | findstr :8080
netstat -ano | findstr :5173

# Environment
echo $PATH
echo $NODE_ENV
```

### Common Commands

```bash
# View all processes using ports
netstat -ano

# Kill process on specific port
taskkill /PID <PID> /F

# Clear npm cache
npm cache clean --force

# Reinstall all dependencies
rm -rf node_modules && npm install

# Check for dependency issues
npm audit
npm audit fix

# View logs
tail -f server.log
```

---

## Still Having Issues?

1. **Check the logs**
   - Browser Console (F12)
   - Revit Output window
   - Server console output

2. **Search the docs**
   - README.md
   - API.md
   - CODE_REVIEW.md

3. **Enable debug mode**
   ```bash
   NODE_ENV=development LOG_LEVEL=debug npm start
   ```

4. **Test components individually**
   - Test Express endpoint with curl
   - Test C# separately
   - Test React component

5. **Ask for help**
   - Include error messages
   - Include steps to reproduce
   - Include environment info

---

**Last Updated:** August 30, 2026  
**Version:** 2027.1.0
