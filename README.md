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
1. Clone the repository
   Bash:
•	git clone https://github.com/your-username/Google-Analytics-Dashboard.git
•	cd Google-Analytics-Dashboard
   
2. Configure Environment Variables
   - Add `.env` in `/backend` with:
•	GOOGLE_CLIENT_ID=your_client_id
•	GOOGLE_CLIENT_SECRET=your_secret
•	JWT_SECRET=your_jwt_secret
3. Run Backend
Bash:
•	cd backend
•	npm install
•	node server.js  # Runs on http://localhost: your_port

4.  Run Frontend
Bash:
•	cd ../client
•	npm install
•	npm start  # Runs on http://localhost:3000

🔧 Key Features
- Google OAuth 2.0 authentication
- GA4 data visualization
- JWT-secured API endpoints

📂 Project Structure
Project/
├── backend/      # Node.js server
├── client/       # React frontend
└── .env          # Environment variables

 🌐 Access
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:your_port`




