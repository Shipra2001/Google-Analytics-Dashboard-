const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const portfinder = require('portfinder');
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { google } = require("googleapis");

// Set base port (will find first available starting from this)
portfinder.basePort = 5000;

// Environment Validation
const requiredEnvVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

// Initialize Express app
const app = express();
const JWT_SECRET = process.env.JWT_SECRET;
let oauth2Client; // Will be initialized after port is determined

// Security Middleware
app.use(helmet());
app.use(cors({ 
  origin: "http://localhost:3000", 
  credentials: true 
}));
app.use(cookieParser());
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Basic Routes
app.get("/", (req, res) => {
  res.send("Google Analytics Dashboard API is running");
});

app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Authentication Middleware
const authenticate = (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, JWT_SECRET);
    oauth2Client.setCredentials(decoded);
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
};

// Find available port and initialize server
portfinder.getPortPromise()
  .then(port => {
    // 1. FIRST initialize OAuth client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `http://localhost:${port}/auth/callback`
    );

    // 2. THEN define OAuth routes
    app.get("/auth/google", (req, res) => {
      try {
        const authUrl = oauth2Client.generateAuthUrl({
          access_type: "offline",
          prompt: "consent",
          scope: [
            "https://www.googleapis.com/auth/analytics.readonly",
            "https://www.googleapis.com/auth/analytics.manage.users.readonly",
          ],
        });
        res.redirect(authUrl);
      } catch (err) {
        console.error("Auth URL generation error:", err);
        res.status(500).send("OAuth configuration error");
      }
    });

    app.get("/auth/callback", async (req, res) => {
      try {
        // 1. Verify the code exists
        const { code, error } = req.query;
        
        if (error) {
          throw new Error(`Google OAuth error: ${error}`);
        }
        
        if (!code) {
          throw new Error("Authorization code missing. Possible causes:\n" +
            "1. User denied permissions\n" +
            "2. Redirect URI mismatch\n" +
            "3. Google auth timeout");
        }
    
        // 2. Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
    
        // 3. Create and set cookies (keep your existing code)
        const accessToken = jwt.sign(tokens, JWT_SECRET, { expiresIn: "1h" });
        res.cookie("token", accessToken, { 
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 3600000
        });
    
        if (tokens.refresh_token) {
          res.cookie("refresh_token", tokens.refresh_token, { 
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
          });
        }
    
        res.redirect("http://localhost:3000/dashboard");
        
      } catch (error) {
        console.error("OAuth callback error:", error);
        res.status(500).json({ 
          error: "Authentication failed",
          details: error.message 
        });
      }
    });

    // Protected Analytics Routes
    app.get("/analytics/accounts", authenticate, async (req, res) => {
      try {
        const analyticsAdmin = google.analyticsadmin("v1beta");
        const response = await analyticsAdmin.accounts.list({ auth: oauth2Client });
        res.json(response.data);
      } catch (error) {
        console.error("Accounts fetch error:", error);
        res.status(500).json({ 
          error: "Failed to fetch accounts",
          details: error.message 
        });
      }
    });

    app.get("/analytics/properties", authenticate, async (req, res) => {
      try {
        const analyticsAdmin = google.analyticsadmin("v1beta");
        const response = await analyticsAdmin.properties.list({ auth: oauth2Client });
        res.json(response.data);
      } catch (error) {
        console.error("Properties fetch error:", error);
        res.status(500).json({ 
          error: "Failed to fetch properties",
          details: error.message 
        });
      }
    });

    app.get("/analytics/data", authenticate, async (req, res) => {
      try {
        const propertyId = req.query.property || "properties/483844490"; 
        const analyticsData = google.analyticsdata("v1beta");
        const response = await analyticsData.properties.runReport({
          auth: oauth2Client,
          property: propertyId,
          requestBody: {
            dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
            metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
            dimensions: [{ name: "date" }],
          },
        });
        res.json(response.data);
      } catch (error) {
        console.error("Data fetch error:", error);
        res.status(500).json({ 
          error: "Failed to fetch analytics data",
          details: error.message 
        });
      }
    });

    // Error Handling
    app.use((err, req, res, next) => {
      console.error('Server error:', err);
      res.status(500).json({ 
        error: err.message || 'Internal server error' 
      });
    });

    // Start server
    const server = app.listen(port, () => {
      console.log(`
      🚀 Server running on port ${port}
      Environment:
      - CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? "✅ Configured" : "❌ Missing"}
      - REDIRECT_URI: http://localhost:${port}/auth/callback
      - JWT_SECRET: ${process.env.JWT_SECRET ? "✅ Present" : "❌ Missing"}
      `);
    });

    process.on('SIGTERM', () => {
      server.close(() => {
        console.log('Server terminated');
      });
    });
  })
  .catch(err => {
    console.error('Could not find an available port:', err);
    process.exit(1);
  });