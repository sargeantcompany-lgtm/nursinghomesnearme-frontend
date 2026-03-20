import React, { useState, useRef, useEffect } from "react";
import { API_BASE } from "../lib/runtimeConfig";

interface Message {
  from: "bot" | "user";
  text: string;
}

const GREETING: Message = {
  from: "bot",
  text: "👋 Hi there! We're here to help. This site is being built to provide the best possible aged care placement support — every question is important to us. What's on your mind?",
};

const AUTO_REPLY: Message = {
  from: "bot",
  text: "Thanks for reaching out! We've received your message and will get back to you within 24 hours. In the meantime, feel free to explore the site or fill out our placement form above.",
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"intro" | "chat">("intro");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { from: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSent(true);

    // POST to backend
    fetch(`${API_BASE}/api/chat-enquiry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message: text }),
    }).catch(() => {});

    setTimeout(() => {
      setMessages((m) => [...m, AUTO_REPLY]);
    }, 800);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "#0b3b5b",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          zIndex: 1000,
          transition: "transform 0.15s",
        }}
        aria-label="Open chat"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 90,
            right: 24,
            width: 340,
            maxWidth: "calc(100vw - 32px)",
            background: "white",
            borderRadius: 18,
            boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            maxHeight: "70vh",
          }}
        >
          {/* Header */}
          <div style={{ background: "#0b3b5b", padding: "16px 20px" }}>
            <div style={{ fontWeight: 700, color: "white", fontSize: 15 }}>Nursing Homes Near Me</div>
            <div style={{ color: "#2dd4bf", fontSize: 12, marginTop: 2 }}>We reply within 24 hours</div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px" }}>
            {step === "intro" ? (
              <>
                <Bubble msg={GREETING} />
                <div style={{ marginTop: 16 }}>
                  <input
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={inputStyle}
                  />
                  <input
                    placeholder="Email (so we can reply)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ ...inputStyle, marginTop: 8 }}
                    type="email"
                  />
                  <button
                    onClick={() => { if (name.trim()) setStep("chat"); }}
                    style={{
                      marginTop: 10,
                      width: "100%",
                      background: "#0b3b5b",
                      color: "white",
                      border: "none",
                      borderRadius: 10,
                      padding: "10px 0",
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    Start chat →
                  </button>
                </div>
              </>
            ) : (
              <>
                {messages.map((m, i) => <Bubble key={i} msg={m} />)}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Input */}
          {step === "chat" && !sent && (
            <div style={{ padding: "8px 12px 14px", display: "flex", gap: 8, borderTop: "1px solid #f0f0f0" }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                placeholder="Type your message…"
                style={{ ...inputStyle, flex: 1, margin: 0 }}
              />
              <button
                onClick={handleSend}
                style={{
                  background: "#0b3b5b",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  padding: "0 16px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 18,
                }}
              >
                →
              </button>
            </div>
          )}

          {step === "chat" && sent && (
            <div style={{ padding: "10px 16px 14px", fontSize: 12, color: "#6b7280", textAlign: "center", borderTop: "1px solid #f0f0f0" }}>
              Message sent — we'll reply within 24 hours.
            </div>
          )}
        </div>
      )}
    </>
  );
}

function Bubble({ msg }: { msg: Message }) {
  const isBot = msg.from === "bot";
  return (
    <div style={{ display: "flex", justifyContent: isBot ? "flex-start" : "flex-end", marginBottom: 10 }}>
      <div style={{
        maxWidth: "82%",
        background: isBot ? "#f0fdf9" : "#0b3b5b",
        color: isBot ? "#1f2937" : "white",
        borderRadius: isBot ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
        padding: "10px 14px",
        fontSize: 13,
        lineHeight: 1.55,
        border: isBot ? "1px solid #d1fae5" : "none",
      }}>
        {msg.text}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1.5px solid #e5e7eb",
  borderRadius: 10,
  padding: "9px 12px",
  fontSize: 13,
  outline: "none",
  fontFamily: "inherit",
};
