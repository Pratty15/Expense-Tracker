# Expense Tracker with AI Financial Assistant

A full-stack personal finance application built with the MERN stack (MongoDB, Express, React, Node.js). It goes beyond basic expense tracking by offering group bill splitting and an AI-powered financial chatbot that gives personalized advice based on your actual spending data.

---

## Features

**Core**
- Add, edit, and delete daily income and expense entries
- Dashboard with real-time balance, income vs expense breakdown, and spending charts (Recharts)
- Monthly summary view with category-wise spending analysis
- User authentication with JWT and bcrypt password hashing

**Group Expenses**
- Create groups with friends or roommates
- Add shared expenses that automatically split costs among members
- View pending settlements showing who owes whom

**AI Financial Assistant (Gemini)**
- Context-aware chatbot powered by Google Gemini 3.5 Flash
- Fetches your real financial data (balance, monthly cash flow, top categories, pending settlements) from MongoDB and injects it into the AI prompt before every response
- Multi-turn conversation memory (last 10 messages, 30-minute TTL)
- Supports natural language questions like "Can I afford a ₹15,000 phone this month?" and answers based on your actual numbers
- Automatic fallback to a built-in rule-based engine if the Gemini API is unavailable or rate-limited, ensuring zero downtime

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React 19, Vite, Tailwind CSS        |
| Charts      | Recharts                            |
| Backend     | Node.js, Express 5                  |
| Database    | MongoDB (Mongoose)                  |
| AI          | Google Gemini 3.5 Flash (@google/genai) |
| Auth        | JWT, bcryptjs                       |
| Deployment  | Vercel (frontend), Render/local (backend) |

---

## Project Structure

```
expense-tracker/
├── backend/
│   ├── middleware/
│   │   └── verifyToken.js          # JWT auth middleware
│   ├── models/
│   │   ├── Expense.js
│   │   ├── Group.js
│   │   ├── SharedExpense.js
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── chatbot.js              # Gemini-first, rule-based fallback
│   │   ├── expenseRoutes.js
│   │   ├── groupRoutes.js
│   │   └── sharedExpenseRoutes.js
│   ├── services/
│   │   ├── geminiService.js         # Gemini AI with context injection
│   │   └── chatbotService.js        # Rule-based fallback engine
│   ├── utils/
│   │   ├── financeTips.js
│   │   ├── intentDetector.js
│   │   └── prediction.js
│   ├── server.js
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ExpenseTracker.jsx
│   │   │   ├── FinanceBot.jsx       # AI chatbot UI
│   │   │   ├── Groups.jsx
│   │   │   ├── GroupDetails.jsx
│   │   │   ├── SharedExpense.jsx
│   │   │   ├── Settlement.jsx
│   │   │   ├── MonthlySummary.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Signup.jsx
│   │   ├── config/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── .env
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- Google Gemini API key (optional — the app works without it using the fallback engine)

### 1. Clone the repository

```bash
git clone https://github.com/Pratty15/Expense-Tracker.git
cd Expense-Tracker
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

Start the backend server:

```bash
npm start
```

The server runs on `http://localhost:5000`.

### 3. Set up the frontend

Open a new terminal:

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```
VITE_API_URL=http://localhost:5000
```

Start the frontend dev server:

```bash
npm run dev
```

The app opens at `http://localhost:5173`.

---

## How the AI Chatbot Works

1. **User sends a message** via the chat interface.
2. **Backend aggregates financial data** from MongoDB — current balance, monthly income/expense, category breakdown, group settlements.
3. **Context is injected** into Gemini's system prompt along with the conversation history.
4. **Gemini generates a personalized response** grounded in the user's real data.
5. **If Gemini fails** (API down, quota exceeded, no key configured), the request is automatically handled by a built-in rule-based intent engine with keyword matching, so the chatbot always responds.

---

## API Endpoints

| Method | Endpoint                | Description                |
|--------|-------------------------|----------------------------|
| POST   | `/api/auth/register`    | Register a new user        |
| POST   | `/api/auth/login`       | Login and get JWT token    |
| GET    | `/api/expenses`         | Get user's expenses        |
| POST   | `/api/expenses`         | Add a new expense/income   |
| PUT    | `/api/expenses/:id`     | Update an expense          |
| DELETE | `/api/expenses/:id`     | Delete an expense          |
| POST   | `/api/chatbot`          | Send message to AI chatbot |
| GET    | `/api/groups`           | Get user's groups          |
| POST   | `/api/groups`           | Create a new group         |
| POST   | `/api/shared-expenses`  | Add a shared expense       |

All routes except auth require a valid JWT token in the `Authorization` header.

---

## License

This project is for educational and personal use.
