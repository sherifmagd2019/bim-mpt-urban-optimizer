# API Endpoints Documentation

**BIM MPT Urban Optimizer - Complete API Reference**

---

## Overview

The system uses two main communication channels:

1. **Express Server (localhost:3000)**: REST API for bidirectional state management
2. **C# Revit Add-in (localhost:8080)**: Direct Revit integration for geometry creation

---

## Express Server Endpoints (localhost:3000)

### POST /api/revit/telemetry

**Description:** Receives DocumentChanged events from C# Revit add-in when geometry is modified

**From:** C# Revit Add-in  
**To:** Express Server  
**Method:** POST  
**Rate Limit:** 50 requests per 15 minutes

#### Request

```json
{
  "timestamp": "2026-08-30T12:35:12Z",
  "eventType": "DocumentChanged",
  "documentTitle": "MyProject.rvt",
  "totalFootprintM2": 17000,
  "layoutBlocks": [
    {
      "elementId": 12345,
      "assetCode": "RES",
      "name": "Residential Tower A",
      "footprintM2": 8750,
      "floors": 8
    },
    {
      "elementId": 12346,
      "assetCode": "COM",
      "name": "Commercial Plaza B",
      "footprintM2": 5200,
      "floors": 5
    }
  ],
  "elementChanges": {
    "created": 0,
    "modified": 1,
    "deleted": 0
  }
}
```

#### Response - Success (200)

```json
{
  "success": true,
  "message": "Telemetry received and cached",
  "queuedAt": "2026-08-30T12:35:12Z",
  "blockCount": 2
}
```

#### Response - Error (400)

```json
{
  "success": false,
  "error": "Invalid request body",
  "details": [
    "timestamp must be a valid ISO date string",
    "layoutBlocks must be an array"
  ],
  "timestamp": "2026-08-30T12:35:12Z"
}
```

#### Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Invalid payload | Check all required fields are present |
| 413 | Payload too large | Reduce number of layoutBlocks (max 1000) |
| 429 | Rate limited | Wait 15 minutes, too many requests |
| 500 | Server error | Check server logs |

---

### GET /api/revit/model-changed

**Description:** React polls this endpoint to receive Revit geometry updates. Called automatically every 1.5 seconds.

**From:** React UI  
**To:** Express Server  
**Method:** GET  
**Rate Limit:** 100 requests per 15 minutes

#### Request

```bash
curl http://localhost:3000/api/revit/model-changed
```

No request body needed.

#### Response - With Updates (200)

```json
{
  "timestamp": "2026-08-30T12:35:12Z",
  "receivedAt": "2026-08-30T12:35:12.500Z",
  "eventType": "DocumentChanged",
  "documentTitle": "MyProject.rvt",
  "totalFootprintM2": 17000,
  "layoutBlocks": [
    {
      "elementId": 12345,
      "assetCode": "RES",
      "name": "Residential Tower A",
      "footprintM2": 8750,
      "floors": 8
    }
  ],
  "elementChanges": {
    "created": 0,
    "modified": 1,
    "deleted": 0
  },
  "blockCount": 1
}
```

#### Response - No Updates (200)

```json
{
  "timestamp": "2026-08-30T12:35:12Z",
  "eventType": "NoUpdates",
  "layoutBlocks": [],
  "message": "No Revit updates received yet.",
  "blockCount": 0
}
```

---

### GET /api/revit/bridge/status

**Description:** Check health and connectivity status of the bidirectional bridge

**From:** React UI or monitoring tools  
**To:** Express Server  
**Method:** GET  
**Rate Limit:** 100 requests per 15 minutes

#### Request

```bash
curl http://localhost:3000/api/revit/bridge/status
```

#### Response (200)

```json
{
  "status": "ok",
  "timestamp": "2026-08-30T12:35:12Z",
  "revitConnected": true,
  "lastTelemetryReceived": "2026-08-30T12:34:56Z",
  "lastUpdateAgeMs": 16000,
  "lastDocumentTitle": "MyProject.rvt",
  "latestBlockCount": 3,
  "uptime": 3600
}
```

#### Status Fields

| Field | Meaning |
|-------|---------|
| status | Always "ok" if server is running |
| revitConnected | true = C# add-in has sent telemetry recently |
| lastUpdateAgeMs | Milliseconds since last Revit update |
| uptime | Server uptime in seconds |

---

### POST /api/revit/reset

**Description:** Clear cached Revit state (useful for testing/debugging)

**From:** React UI or testing  
**To:** Express Server  
**Method:** POST  
**Rate Limit:** 100 requests per 15 minutes

#### Request

```bash
curl -X POST http://localhost:3000/api/revit/reset
```

No request body needed.

#### Response (200)

```json
{
  "success": true,
  "message": "Revit state cleared",
  "timestamp": "2026-08-30T12:35:12Z"
}
```

---

### POST /api/revit/optimize

**Description:** Send MPT optimization request from React to Revit (via Express bridge)

**From:** React UI  
**To:** Express Server  
**Method:** POST  
**Rate Limit:** 50 requests per 15 minutes

#### Request

```json
{
  "version": "2027.1.0",
  "timestamp": "2026-08-30T12:35:12Z",
  "projectInfo": {
    "name": "Generative BIM Masterplan",
    "totalFootprintM2": 17000,
    "expectedReturn": 0.1145,
    "portfolioVolatility": 0.1012,
    "sharpeRatio": 0.934
  },
  "assets": [
    {
      "id": "res",
      "code": "RES",
      "name": "Residential Tower",
      "footprintM2": 8750,
      "allocationWeight": 0.515,
      "expectedYield": 0.0685,
      "historicalVolatility": 0.0841,
      "floors": 8
    }
  ],
  "layoutBlocks": [
    {
      "id": "block-res",
      "assetCode": "RES",
      "name": "Residential Tower A",
      "areaM2": 8750,
      "revitOriginFeet": {"x": 0, "y": 0, "z": 0},
      "revitDimensionsFeet": {"width": 306.8, "depth": 306.8, "height": 99.3}
    }
  ]
}
```

#### Response (200)

```json
{
  "success": true,
  "message": "Optimization request queued",
  "timestamp": "2026-08-30T12:35:12Z"
}
```

#### Error Response (400)

```json
{
  "success": false,
  "error": "Invalid request body",
  "details": [
    "assets must be a non-empty array",
    "layoutBlocks must be a non-empty array"
  ]
}
```

---

### GET /api/health

**Description:** Server health check endpoint

**From:** Any client or monitoring  
**To:** Express Server  
**Method:** GET  
**Rate Limit:** 100 requests per 15 minutes

#### Request

```bash
curl http://localhost:3000/api/health
```

#### Response (200)

```json
{
  "status": "ok",
  "timestamp": "2026-08-30T12:35:12Z",
  "uptime": 3600,
  "memory": {
    "rss": 52428800,
    "heapTotal": 41943040,
    "heapUsed": 19922944,
    "external": 1245896
  },
  "revitConnected": true
}
```

---

## C# Revit Add-in Endpoints (localhost:8080)

### POST /revit-mpt-bridge/

**Description:** React sends optimization layout requests directly to C# add-in

**From:** React UI  
**To:** C# Revit Add-in  
**Method:** POST  
**Rate Limit:** 50 requests per 15 minutes

#### Request

```json
{
  "version": "2027.1.0",
  "timestamp": "2026-08-30T12:35:12Z",
  "projectInfo": {
    "name": "Generative BIM",
    "totalFootprintM2": 17000
  },
  "assets": [...],
  "layoutBlocks": [...]
}
```

#### Response - Success (200)

```json
{
  "status": "success",
  "elementsCreated": 3,
  "createdElementIds": [12345, 12346, 12347],
  "documentState": {
    "documentTitle": "MyProject.rvt",
    "isModified": true,
    "elementCount": 847
  },
  "metrics": {
    "processingTimeMs": 45,
    "revitTransactionTimeMs": 32,
    "totalTimeMs": 150,
    "payloadSizeBytes": 4821
  },
  "revitOperationId": "op-abc123"
}
```

#### Response - Processing (202)

```json
{
  "status": "processing",
  "message": "Request queued in Revit",
  "requestId": "req-xyz789"
}
```

#### Response - Error (400)

```json
{
  "status": "error",
  "error": {
    "code": "INVALID_PAYLOAD",
    "message": "Missing required field: layoutBlocks"
  },
  "requestId": "req-xyz789"
}
```

#### Performance Expectations

| Metric | Expected |
|--------|----------|
| Roundtrip time | 150-300 ms |
| JSON parsing | 5 ms |
| Revit transaction | 32 ms |
| HTTP overhead | 50 ms |

---

### GET /revit-mpt-bridge/health

**Description:** Check if C# add-in is running and listening

**From:** React UI  
**To:** C# Revit Add-in  
**Method:** GET  
**Rate Limit:** 100 requests per 15 minutes

#### Request

```bash
curl http://localhost:8080/revit-mpt-bridge/health
```

#### Response (200)

```json
{
  "status": "ok",
  "listening": true,
  "port": 8080,
  "timestamp": "2026-08-30T12:35:12Z"
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 202 | Accepted (processing asynchronously) |
| 400 | Bad Request (invalid input) |
| 413 | Payload Too Large |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

### Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "details": [...],
  "timestamp": "2026-08-30T12:35:12Z"
}
```

### Common Error Codes

| Code | Cause | Solution |
|------|-------|----------|
| INVALID_PAYLOAD | Malformed JSON or missing fields | Validate request body |
| RATE_LIMITED | Too many requests | Wait and retry |
| REVIT_TIMEOUT | Revit took too long | Simplify request or check Revit |
| CORS_ERROR | Origin not allowed | Check CORS_ALLOWED_ORIGINS env var |
| VALIDATION_ERROR | Input validation failed | Check all required fields |

---

## Testing the API

### Using cURL

```bash
# Test Revit → Express telemetry
curl -X POST http://localhost:3000/api/revit/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2026-08-30T12:35:12Z",
    "eventType": "DocumentChanged",
    "documentTitle": "Test.rvt",
    "layoutBlocks": [{"elementId": 1, "assetCode": "RES", "footprintM2": 1000}]
  }'

# Test React poll for updates
curl http://localhost:3000/api/revit/model-changed

# Test bridge status
curl http://localhost:3000/api/revit/bridge/status

# Test server health
curl http://localhost:3000/api/health
```

### Using Postman

1. Import this collection:
```json
{
  "info": {
    "name": "BIM MPT API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "POST Telemetry",
      "request": {
        "method": "POST",
        "url": "localhost:3000/api/revit/telemetry"
      }
    }
  ]
}
```

2. Create requests for each endpoint
3. Test with sample payloads

---

## Rate Limiting

All endpoints have rate limiting enabled:

- **General API:** 100 requests per 15 minutes
- **Revit Integration:** 50 requests per 15 minutes

Response headers:

```
RateLimit-Limit: 100
RateLimit-Remaining: 99
RateLimit-Reset: 1630000000
```

When rate limited (429):

```json
{
  "success": false,
  "error": "Too many requests",
  "message": "Please try again later",
  "retryAfter": 60
}
```

---

## CORS Policy

The API uses CORS to prevent unauthorized cross-origin requests.

**Allowed Origins** (from `.env`):
```
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

**Allowed Methods:** GET, POST, PUT, DELETE, OPTIONS  
**Allowed Headers:** Content-Type, Authorization  
**Credentials:** Allowed (cookies/auth)

---

## Security

✅ **CORS Restricted** - No wildcard (*), only specified origins  
✅ **Rate Limited** - Prevents DDoS attacks  
✅ **Input Validation** - All payloads validated  
✅ **Error Handling** - Stack traces not exposed in production  
✅ **Size Limits** - Max 10MB payloads  

---

## Changelog

### v2027.1.0
- ✅ Added input validation
- ✅ Added rate limiting
- ✅ Added error handling
- ✅ Added CORS restrictions
- ✅ Added health checks

---

**Last Updated:** August 30, 2026  
**Documentation Version:** 2027.1.0
