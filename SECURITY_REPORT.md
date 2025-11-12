# Security Vulnerability Assessment Report

**Project:** Transit Delay Visualizer
**Date:** 2025-11-05
**Severity Levels:** 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## Executive Summary

This report identifies **9 security vulnerabilities** found in the Transit Delay Visualizer application:
- **0 Critical** vulnerabilities
- **2 High** severity issues
- **5 Medium** severity issues
- **2 Low** severity issues

---

## Vulnerability Details

### 🟠 HIGH SEVERITY

#### 1. CORS Misconfiguration - Unrestricted Cross-Origin Access
**Location:** `server.js:9`
**CVSS Score:** 7.5

**Description:**
```javascript
app.use(cors()); // Allows ALL origins
```

The server enables CORS for all origins without restrictions, allowing any website to make requests to your API.

**Impact:**
- Cross-site request forgery (CSRF) attacks
- Data exfiltration from any malicious website
- Unauthorized API usage

**Remediation:**
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
}));
```

---

#### 2. No Rate Limiting - Denial of Service Vulnerability
**Location:** `server.js` (missing middleware)
**CVSS Score:** 7.5

**Description:**
The Express server has no rate limiting implemented, making it vulnerable to DoS attacks.

**Impact:**
- Server resource exhaustion
- Service disruption
- Increased hosting costs

**Remediation:**
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);
```

---

### 🟡 MEDIUM SEVERITY

#### 3. Outdated Dependencies with Known Vulnerabilities
**Location:** `package.json`
**CVSS Score:** 5.3

**NPM Audit Results:**
- `esbuild` (<=0.24.2): GHSA-67mh-4wv8-2f99
- `vite` (5.0.11): Depends on vulnerable esbuild

**Impact:**
- Development server can send unauthorized requests
- Potential information disclosure

**Remediation:**
```bash
npm install vite@^7.2.0 --save-dev
npm audit fix
```

---

#### 4. Insufficient Input Validation
**Location:** `server.js:15-16`
**CVSS Score:** 5.3

**Description:**
```javascript
const stopName = decodeURIComponent(req.params.stopName);
const apiUrl = `${API_BASE_URL}${encodeURIComponent(stopName)}`;
```

No validation is performed on the `stopName` parameter before using it.

**Impact:**
- Server-side request forgery (SSRF)
- API abuse
- Injection attacks

**Remediation:**
```javascript
// Add input validation
const stopName = decodeURIComponent(req.params.stopName);

// Validate input
if (!stopName || stopName.length > 100 || !/^[a-zA-ZæøåÆØÅ\s\-]+$/.test(stopName)) {
  return res.status(400).json({ error: 'Invalid stop name' });
}
```

---

#### 5. Error Information Disclosure
**Location:** `server.js:33-36`
**CVSS Score:** 4.3

**Description:**
```javascript
res.status(500).json({
  error: 'Failed to fetch transit data',
  message: error.message  // Exposes internal error details
});
```

**Impact:**
- Information leakage about internal system
- Aids attackers in reconnaissance

**Remediation:**
```javascript
res.status(500).json({
  error: 'Failed to fetch transit data'
  // Don't expose error.message in production
});

// Log full error server-side only
console.error('Error details:', error);
```

---

#### 6. Missing Security Headers
**Location:** `server.js` (missing middleware)
**CVSS Score:** 5.0

**Description:**
No security headers are configured (CSP, HSTS, X-Frame-Options, etc.)

**Impact:**
- Clickjacking attacks
- XSS vulnerabilities
- Man-in-the-middle attacks

**Remediation:**
```javascript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.kaveland.no"]
    }
  }
}));
```

---

#### 7. Hardcoded Configuration Values
**Location:** `main.ts:24`, `server.js:5-6`
**CVSS Score:** 4.0

**Description:**
```javascript
// main.ts:24
private apiBaseUrl = 'http://localhost:3001/api/stop/';

// server.js:5-6
const PORT = 3001;
const API_BASE_URL = 'https://api.kaveland.no/forsinka/stop/';
```

**Impact:**
- Difficult to deploy across environments
- Potential exposure of internal URLs

**Remediation:**
Use environment variables:
```javascript
const PORT = process.env.PORT || 3001;
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.kaveland.no/forsinka/stop/';
```

---

#### 8. No Authentication/Authorization
**Location:** All API endpoints
**CVSS Score:** 5.0

**Description:**
All endpoints are publicly accessible without any authentication.

**Impact:**
- Unrestricted API usage
- Potential abuse
- No usage tracking

**Remediation:**
Consider adding API key authentication for production if needed:
```javascript
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (process.env.REQUIRE_API_KEY === 'true' && apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};
```

---

### 🟢 LOW SEVERITY

#### 9. Insufficient Logging
**Location:** `server.js`
**CVSS Score:** 2.0

**Description:**
Minimal logging for security events and errors.

**Remediation:**
Implement comprehensive logging with a library like Winston or Pino.

---

## Priority Remediation Plan

### Phase 1 - Critical (Immediate)
1. ✅ Fix CORS configuration
2. ✅ Add rate limiting
3. ✅ Update vulnerable dependencies

### Phase 2 - High Priority (This Week)
4. ✅ Add input validation
5. ✅ Implement security headers
6. ✅ Fix error disclosure

### Phase 3 - Medium Priority (This Month)
7. ✅ Move to environment variables
8. ⚠️ Consider authentication (if needed)
9. ✅ Improve logging

---

## Security Best Practices Recommendations

1. **Dependency Management:**
   - Run `npm audit` regularly
   - Use Dependabot or Snyk for automated vulnerability scanning
   - Keep dependencies up to date

2. **Environment Configuration:**
   - Never commit `.env` files
   - Use secrets management in production
   - Separate dev/staging/prod configurations

3. **Monitoring:**
   - Set up application monitoring (e.g., Sentry)
   - Monitor for suspicious activity
   - Set up alerts for errors

4. **CI/CD Security:**
   - Run security scans in pipeline
   - Scan Docker images for vulnerabilities
   - Use signed commits

5. **Production Deployment:**
   - Use HTTPS only
   - Implement proper error handling
   - Set up WAF (Web Application Firewall)
   - Regular security audits

---

## Compliance Notes

- **GDPR:** Ensure proper data handling if storing user data
- **OWASP Top 10:** Address A01:2021 (Broken Access Control), A05:2021 (Security Misconfiguration)

---

## Tools Used

- npm audit (dependency scanning)
- Manual code review
- OWASP security guidelines
- Common Vulnerability Scoring System (CVSS)

---

## Next Steps

1. Review and prioritize fixes
2. Implement security improvements
3. Set up automated security scanning in CI/CD
4. Schedule regular security audits
5. Document security policies
