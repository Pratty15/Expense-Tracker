import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
   Natural Suggestion Chips
   ───────────────────────────────────────────── */
const suggestions = [
  "How am I doing?",
  "Where am I spending most?",
  "Compare with last month",
  "Predict month-end",
  "Pending settlements",
  "Savings tips",
  "My groups",
];

/* ─────────────────────────────────────────────
   Word-by-Word Typing Component
   ───────────────────────────────────────────── */
function TypingMarkdown({ text, onComplete }) {
  const [visibleLength, setVisibleLength] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    setVisibleLength(0);

    // Speed: ~20ms per character for a fast, smooth feel
    const speed = 12;
    let current = 0;

    intervalRef.current = setInterval(() => {
      current += 3; // 3 chars at a time for speed
      if (current >= text.length) {
        current = text.length;
        clearInterval(intervalRef.current);
        onComplete?.();
      }
      setVisibleLength(current);
    }, speed);

    return () => clearInterval(intervalRef.current);
  }, [text]);

  const visibleText = text.slice(0, visibleLength);

  return (
    <div className="md-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {visibleText}
      </ReactMarkdown>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Static Markdown Renderer (for completed messages)
   ───────────────────────────────────────────── */
function MarkdownBubble({ text }) {
  return (
    <div className="md-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

/* ═════════════════════════════════════════════
   Main FinanceBot Component
   ═════════════════════════════════════════════ */
function FinanceBot() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      from: "bot",
      text: "Hey! 👋 I'm your **AI Finance Assistant**, powered by Gemini.\n\nI know your expenses, income, groups & settlements. Ask me anything naturally — like talking to a friend who's great with money!\n\nTry: *\"How am I doing this month?\"*",
      type: "ai",
      isComplete: true,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);

  const endRef = useRef(null);
  const inputRef = useRef(null);
  const msgIdCounter = useRef(1);

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 400);
  }, [open]);

  // Esc to close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && open) handleClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open]);

  /* ── Open / Close ─────────────────────────── */
  const handleClose = () => {
    setClosing(true);
    setTimeout(() => { setOpen(false); setClosing(false); }, 250);
  };

  const toggleChat = () => {
    if (open) handleClose();
    else { setClosing(false); setOpen(true); }
  };

  /* ── Clear chat ───────────────────────────── */
  const clearChat = () => {
    setMessages([{
      id: "cleared",
      from: "bot",
      text: "Chat cleared! 🧹 How can I help you?",
      type: "ai",
      isComplete: true,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }]);
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

  /* ── Auto-resize textarea ─────────────────── */
  const handleInputChange = (e) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "40px";
    el.style.height = Math.min(el.scrollHeight, 100) + "px";
  };

  /* ── Send message ─────────────────────────── */
  const sendMessage = useCallback(
    async (customMessage = null) => {
      const message = customMessage || input;
      if (!message.trim()) return;

      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const userMsgId = `user-${msgIdCounter.current++}`;
      const botMsgId = `bot-${msgIdCounter.current++}`;

      // Add user message
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, from: "user", text: message, type: "text", isComplete: true, time: now },
      ]);

      setInput("");
      // Reset textarea height
      if (inputRef.current) inputRef.current.style.height = "40px";
      setThinking(true);

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

        setThinking(false);

        // Add bot response (starts typing animation)
        setMessages((prev) => [
          ...prev,
          {
            id: botMsgId,
            from: "bot",
            text: data.reply || "Sorry, I couldn't understand that.",
            type: data.type || "text",
            isComplete: false, // will animate
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } catch {
        setThinking(false);
        setMessages((prev) => [
          ...prev,
          {
            id: botMsgId,
            from: "bot",
            text: "Sorry! Something went wrong connecting to the server. Please try again.",
            type: "text",
            isComplete: true,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    },
    [input]
  );

  /* ── Mark message typing as complete ──────── */
  const markComplete = useCallback((msgId) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, isComplete: true } : m))
    );
  }, []);

  /* ── Handle key press in textarea ─────────── */
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* ── Render ────────────────────────────────── */
  return (
    <>
      {/* Floating Button */}
      <div className="chatbot-btn" onClick={toggleChat}>
        {open ? "✕" : "✨"}
      </div>

      {open && (
        <div className={`chatbot-container ${closing ? "closing" : ""}`}>
          {/* ── Header ─────────────────────── */}
          <div className="chatbot-header">
            <div>
              <h3>
                Finance AI <span className="header-badge">Gemini</span>
              </h3>
              <span className="online">
                <span className="online-dot" />
                Powered by Gemini 3.5 Flash
              </span>
            </div>
            <div className="header-actions">
              <button className="clear-btn" onClick={clearChat} title="Clear chat">
                🗑️
              </button>
              <button className="close-btn" onClick={handleClose} title="Close (Esc)">
                ✕
              </button>
            </div>
          </div>

          {/* ── Suggestion Chips ────────────── */}
          <div className="suggestions">
            {suggestions.map((item, index) => (
              <button key={index} onClick={() => sendMessage(item)}>
                {item}
              </button>
            ))}
          </div>

          {/* ── Messages ───────────────────── */}
          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div className={`message-row ${msg.from}`} key={msg.id}>
                {/* Avatar */}
                <div className={`msg-avatar ${msg.from === "bot" ? "bot-avatar" : "user-avatar"}`}>
                  {msg.from === "bot" ? "✨" : "👤"}
                </div>

                {/* Content */}
                <div className="message-content">
                  <div className="bubble">
                    {msg.from === "bot" && (msg.type === "ai" || msg.type === "text" || msg.type === "error") ? (
                      msg.isComplete ? (
                        <MarkdownBubble text={msg.text} />
                      ) : (
                        <TypingMarkdown
                          text={msg.text}
                          onComplete={() => markComplete(msg.id)}
                        />
                      )
                    ) : (
                      msg.text
                    )}
                  </div>
                  <span className="time">{msg.time}</span>
                </div>
              </div>
            ))}

            {/* Thinking Indicator */}
            {thinking && (
              <div className="thinking-container">
                <div className="msg-avatar bot-avatar">✨</div>
                <div className="thinking-bubble">
                  <span className="thinking-sparkle">✨</span>
                  <span className="thinking-text">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* ── Footer ─────────────────────── */}
          <div className="powered-by">
            Press <kbd>Esc</kbd> to close · <kbd>Shift+Enter</kbd> for new line
          </div>

          {/* ── Input Bar ──────────────────── */}
          <div className="chatbot-input">
            <textarea
              ref={inputRef}
              rows={1}
              placeholder="Ask anything about your finances..."
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
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