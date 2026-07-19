import { useCallback, useEffect, useRef, useState } from "react";
import API_BASE from "../config/api";
import "./FinanceBot.css";

/* ─────────────────────────────────────────────
   Speech Recognition Setup
   ───────────────────────────────────────────── */
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.interimResults = true;
  recognition.continuous = false;
}

/* ─────────────────────────────────────────────
   Quick Suggestion Chips
   ───────────────────────────────────────────── */
const suggestions = [
  "Summary",
  "Balance",
  "Expenses",
  "Groups",
  "Settlements",
  "Analytics",
  "Prediction",
  "Categories",
  "Finance Tip",
];

/* ─────────────────────────────────────────────
   Formatting helper
   ───────────────────────────────────────────── */
function rupees(n) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

/* ─────────────────────────────────────────────
   Rich Card Components
   ───────────────────────────────────────────── */

function SummaryCard({ data }) {
  if (!data) return null;

  const total = data.income + data.expense;
  const pct = total > 0 ? Math.round((data.expense / total) * 100) : 0;

  return (
    <div className="summary-card">
      <div className="stat-grid">
        <div className="stat-item">
          <span className="stat-label">Income</span>
          <span className="stat-value income">{rupees(data.income)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Expense</span>
          <span className="stat-value expense">{rupees(data.expense)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Balance</span>
          <span className="stat-value balance">{rupees(data.balance)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Groups</span>
          <span className="stat-value">{data.groups}</span>
        </div>
      </div>
      {data.income > 0 && (
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

function PredictionCard({ data }) {
  if (!data) return null;

  const gaugeColor =
    data.healthScore >= 70
      ? "#10b981"
      : data.healthScore >= 40
        ? "#f59e0b"
        : "#ef4444";

  return (
    <div className="prediction-card">
      <div className="health-gauge">
        <div
          className="gauge-ring"
          style={{
            "--gauge-color": gaugeColor,
            "--gauge-pct": data.healthScore,
          }}
        >
          <span className="gauge-score">{data.healthScore}</span>
        </div>
        <div className="gauge-label">
          <strong>Financial Health</strong>
          {data.healthScore >= 70
            ? "Looking great!"
            : data.healthScore >= 40
              ? "Room for improvement"
              : "Needs attention"}
        </div>
      </div>
      <div className="pred-stats">
        <div className="pred-stat">
          <span>Est. Expense</span>
          <strong>{rupees(data.predictedExpense)}</strong>
        </div>
        <div className="pred-stat">
          <span>Est. Savings</span>
          <strong>{rupees(data.predictedSavings)}</strong>
        </div>
        <div className="pred-stat">
          <span>Daily Avg</span>
          <strong>{rupees(data.averageDailyExpense)}</strong>
        </div>
        <div className="pred-stat">
          <span>Budget Used</span>
          <strong>{data.budgetUsed}%</strong>
        </div>
      </div>
      {data.trend && (
        <div className="pred-trend">{data.trend}</div>
      )}
      {data.advice && (
        <div className="pred-advice">💡 {data.advice}</div>
      )}
    </div>
  );
}

function TipCard({ data }) {
  if (!data) return null;
  return (
    <div className="tip-card">
      <div className="tip-header">{data.title}</div>
      <div className="tip-body">{data.message}</div>
      {data.category && (
        <span className="tip-category-badge">{data.category}</span>
      )}
    </div>
  );
}

function ChartCard({ data }) {
  if (!data?.categories?.length) return null;

  const maxAmount = Math.max(...data.categories.map((c) => c.amount));

  return (
    <div className="chart-card">
      <div className="chart-bars">
        {data.categories.slice(0, 5).map((cat) => (
          <div className="chart-bar-row" key={cat.name}>
            <span className="chart-bar-label">{cat.name}</span>
            <div className="chart-bar-track">
              <div
                className="chart-bar-fill"
                style={{
                  width: `${maxAmount > 0 ? (cat.amount / maxAmount) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="chart-bar-value">{rupees(cat.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Message Bubble Renderer
   ───────────────────────────────────────────── */
function MessageBubble({ msg }) {
  return (
    <div className={`message ${msg.from}`}>
      <div className="bubble">{msg.text}</div>

      {/* Rich cards for bot messages */}
      {msg.from === "bot" && msg.msgType === "summary_card" && (
        <SummaryCard data={msg.data} />
      )}
      {msg.from === "bot" && msg.msgType === "prediction_card" && (
        <PredictionCard data={msg.data} />
      )}
      {msg.from === "bot" && msg.msgType === "tip_card" && (
        <TipCard data={msg.data} />
      )}
      {msg.from === "bot" && msg.msgType === "chart_data" && (
        <ChartCard data={msg.data} />
      )}

      <span className="time">{msg.time}</span>
    </div>
  );
}

/* ═════════════════════════════════════════════
   Main FinanceBot Component
   ═════════════════════════════════════════════ */
function FinanceBot() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [activeChip, setActiveChip] = useState(null);

  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hey there! 👋 I'm your AI Finance Assistant.\n\nAsk me anything about your finances — expenses, balance, predictions, tips, and more!",
      msgType: "text",
      data: null,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);

  const endRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [open]);

  // Esc to close
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape" && open) {
        handleClose();
      }
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open]);

  /* ── Open / Close with animation ──────────── */
  const handleOpen = () => {
    setClosing(false);
    setOpen(true);
  };

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 250); // matches CSS slideDownOut duration
  };

  const toggleChat = () => {
    if (open) handleClose();
    else handleOpen();
  };

  /* ── Clear chat ───────────────────────────── */
  const clearChat = () => {
    setMessages([
      {
        from: "bot",
        text: "Chat cleared! 🧹 How can I help you?",
        msgType: "text",
        data: null,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setActiveChip(null);
  };

  /* ── Voice input ──────────────────────────── */
  const startListening = () => {
    if (!recognition) {
      alert("Voice Recognition is not supported in this browser.");
      return;
    }

    recognition.start();
    setListening(true);

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
  };

  /* ── Send message ─────────────────────────── */
  const sendMessage = useCallback(
    async (customMessage = null) => {
      const message = customMessage || input;
      if (!message.trim()) return;

      const now = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Add user message
      setMessages((prev) => [
        ...prev,
        { from: "user", text: message, msgType: "text", data: null, time: now },
      ]);

      setInput("");
      setTyping(true);

      // Track active chip
      if (customMessage) {
        setActiveChip(customMessage);
      } else {
        setActiveChip(null);
      }

      try {
        const res = await fetch(`${API_BASE}/api/chatbot`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ message }),
        });

        const data = await res.json();

        // Small delay for natural feel
        setTimeout(() => {
          setTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              from: "bot",
              text: data.reply || "I couldn't understand that.",
              msgType: data.type || "text",
              data: data.data || null,
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ]);
        }, 600);
      } catch {
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: "Sorry! Something went wrong while connecting to the server. Please try again.",
            msgType: "error",
            data: null,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      }
    },
    [input]
  );

  /* ── Render ────────────────────────────────── */
  return (
    <>
      {/* Floating Button */}
      <div className="chatbot-btn" onClick={toggleChat}>
        {open ? "✕" : "🤖"}
      </div>

      {open && (
        <div className={`chatbot-container ${closing ? "closing" : ""}`}>
          {/* ── Header ─────────────────────── */}
          <div className="chatbot-header">
            <div>
              <h3>Finance AI</h3>
              <span className="online">
                <span className="online-dot" />
                Online
              </span>
            </div>
            <div className="header-actions">
              <button
                className="clear-btn"
                onClick={clearChat}
                title="Clear chat"
              >
                🗑️
              </button>
              <button
                className="close-btn"
                onClick={handleClose}
                title="Close (Esc)"
              >
                ✕
              </button>
            </div>
          </div>

          {/* ── Suggestion Chips ────────────── */}
          <div className="suggestions">
            {suggestions.map((item, index) => (
              <button
                key={index}
                className={activeChip === item ? "active-chip" : ""}
                onClick={() => sendMessage(item)}
              >
                {item}
              </button>
            ))}
          </div>

          {/* ── Messages ───────────────────── */}
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <MessageBubble key={index} msg={msg} />
            ))}

            {/* Shimmer Loading Skeleton */}
            {typing && (
              <div className="typing-container">
                <div className="shimmer-loader">
                  <div className="shimmer-line" />
                  <div className="shimmer-line" />
                  <div className="shimmer-line" />
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* ── Esc Hint ───────────────────── */}
          <div className="esc-hint">
            Press <kbd>Esc</kbd> to close
          </div>

          {/* ── Input Bar ──────────────────── */}
          <div className="chatbot-input">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask anything about your finances..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />

            <button
              className={`mic-btn ${listening ? "active" : ""}`}
              onClick={startListening}
              title="Voice input"
            >
              🎤
            </button>

            <button
              className="send-btn"
              onClick={() => sendMessage()}
              title="Send message"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default FinanceBot;