# Google-Analytics-Dashboard-
A full-stack web app to visualize Google Analytics data with secure OAuth login.
✨ Features
🔒 Secure Authentication
•	Google OAuth 2.0 login flow
•	JWT token-based session management
📈 Analytics Data
•	Fetches GA4 metrics (users, page views) via Google APIs
•	Displays reports in React
⚡ Tech Stack
•	Backend: Node.js, Express.js
•	Frontend: React.js
•	Authentication: Google OAuth 2.0
•	API Used: Google Analytics Admin API, Google Analytics Data API
•	Middleware: CORS, Cookie Parser, JWT authentication, Helmet (Security Headers), Express Rate Limiter
•	Additional Tools: Dotenv (Environment Variables), Portfinder (Dynamic Port Allocation)
🚀 Setup
•	Add Google OAuth credentials in .env
•	Run backend: node server.js (auto-finds port)
•	Test: http://localhost:3000 (React)

