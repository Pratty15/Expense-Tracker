/* ─────────────────────────────────────────────
   API Configuration
   
   Uses VITE_API_URL env variable if set,
   otherwise falls back to the production URL.
   
   For local development, create a .env file in
   the frontend/ folder with:
     VITE_API_URL=http://localhost:5000
   ───────────────────────────────────────────── */

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://expense-tracker-backend-oy00.onrender.com";

export default API_BASE;
