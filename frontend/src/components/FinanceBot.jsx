import { useEffect, useRef, useState } from "react";
import "./FinanceBot.css";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.interimResults = false;
  recognition.continuous = false; // 🔥 VERY IMPORTANT
}

function FinanceBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hi 👋 I’m your AI FinanceBot. Ask me about summary, balance, trends or budget 📊",
    },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);

  const endRef = useRef(null);

  //  Auto scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  //  Voice control
  const toggleListening = () => {
    if (!recognition) {
      alert("Voice input not supported in this browser");
      return;
    }

    if (listening) {
      recognition.stop();
      setListening(false);
      return;
    }

    setListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const transcript =
        event.results[event.results.length - 1][0].transcript;
      setInput((prev) => prev + " " + transcript);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      if (listening) recognition.start(); //  auto-restart
    };
  };

  //  Send message
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { from: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      const res = await fetch("https://expense-tracker-backend-oy00.onrender.com/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ message: userMsg.text }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { from: "bot", text: data.reply || "🤖 Hmm, try again!" },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "⚠️ Server error. Please try again later." },
      ]);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div className="chatbot-btn" onClick={() => setOpen(!open)}>
        🤖
      </div>

      {open && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <span>FinanceBot AI </span>
            <span className="close" onClick={() => setOpen(false)}>
              ✖
            </span>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`msg ${msg.from}`}>
                {msg.text}
              </div>
            ))}
            <div ref={endRef}></div>
          </div>

          <div className="chatbot-input">
            <input
              type="text"
              placeholder="Ask about expenses, budget, trends..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />

            <button
              className={`mic-btn ${listening ? "active" : ""}`}
              onClick={toggleListening}
            >
              🎙️
            </button>

            <button className="send-btn" onClick={sendMessage}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default FinanceBot;
