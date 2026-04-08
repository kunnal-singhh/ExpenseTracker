// src/components/AIAssistant.jsx
// Updated: reads transactions from ExpenseContext instead of localStorage

import { useState, useRef, useEffect, useContext } from "react";
import { ExpenseContext } from "../context/expenseContext";

function buildSystemPrompt(expenses) {
  return `You are a smart expense assistant. The user has the following transaction data:

${JSON.stringify(expenses, null, 2)}

Each transaction has: 
- _id: unique MongoDB id
- to: the name/description of the expense/income
- amount: number (negative means money spent, positive means money received)
- date: in MM/DD/YYYY format
- time: time of the transaction
- type: "income" or "expense"

Today's date is ${new Date().toLocaleDateString("en-US")}.

Your job is to answer questions about these transactions. You can:
- Filter by date range (e.g. "expenses from Jan 5 to Jan 10")
- Calculate totals (e.g. "total expense this month", "previous month total")
- Find highest/lowest expenses
- Give summaries and breakdowns
- Show transactions for a specific person/description (the "to" field)

Always respond in a clear, concise way. When listing transactions, show: "to" name, amount, date.
Negative amounts are expenses (money going out), positive are income (money coming in).
If no transactions match the query, say so politely.`;
}

export default function AIAssistant() {
  // Read directly from context — no localStorage needed
  const { transactions } = useContext(ExpenseContext);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        'Hi! I\'m your expense AI assistant 👋 Ask me anything about your transactions — like "total this month" or "top expenses".',
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    const apiMessages = updatedMessages
      .slice(1)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1024,
          messages: [
            { role: "system", content: buildSystemPrompt(transactions) },
            ...apiMessages,
          ],
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `⚠️ API Error: ${data.error.message}` },
        ]);
        return;
      }

      const reply =
        data.choices?.[0]?.message?.content || "Sorry, I couldn't process that.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Network error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        style={styles.fab}
        title="AI Expense Assistant"
      >
        {open ? "✕" : "🤖"}
      </button>

      {open && (
        <div style={styles.window}>
          <div style={styles.header}>
            <span style={styles.headerIcon}>✦</span>
            <div>
              <div style={styles.headerTitle}>Expense AI</div>
              <div style={styles.headerSub}>Ask anything about your transactions</div>
            </div>
          </div>

          <div style={styles.messages}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  ...styles.bubble,
                  ...(msg.role === "user" ? styles.userBubble : styles.aiBubble),
                }}
              >
                {msg.content}
              </div>
            ))}
            {loading && (
              <div style={{ ...styles.bubble, ...styles.aiBubble, opacity: 0.6 }}>
                ● ● ●
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={styles.bottom}>
            <div style={styles.suggestions}>
              {["Total this month", "Previous month", "Top 5 expenses"].map((s) => (
                <button key={s} style={styles.chip} onClick={() => setInput(s)}>
                  {s}
                </button>
              ))}
            </div>

            <div style={styles.inputRow}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about your expenses..."
                style={styles.textarea}
                rows={1}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                style={{
                  ...styles.sendBtn,
                  opacity: loading || !input.trim() ? 0.4 : 1,
                }}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  fab: {
    position: "fixed",
    bottom: "12px",
    right: "28px",
    width: "58px",
    height: "58px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(99,102,241,0.45)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  window: {
    position: "fixed",
    bottom: "100px",
    right: "28px",
    width: "360px",
    height: "520px",
    background: "#0f0f13",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
    display: "flex",
    flexDirection: "column",
    zIndex: 9998,
    overflow: "hidden",
    fontFamily: "'Segoe UI', sans-serif",
  },
  header: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    padding: "16px 18px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexShrink: 0,
  },
  headerIcon: { fontSize: "22px", color: "#fff" },
  headerTitle: { color: "#fff", fontWeight: "700", fontSize: "15px" },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: "11px", marginTop: "2px" },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    scrollbarWidth: "thin",
    scrollbarColor: "#333 transparent",
    minHeight: 0,
  },
  bubble: {
    maxWidth: "85%",
    padding: "10px 14px",
    borderRadius: "16px",
    fontSize: "13.5px",
    lineHeight: "1.55",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  userBubble: {
    alignSelf: "flex-end",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    borderBottomRightRadius: "4px",
  },
  aiBubble: {
    alignSelf: "flex-start",
    background: "#1e1e2e",
    color: "#e2e2f0",
    borderBottomLeftRadius: "4px",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  bottom: {
    flexShrink: 0,
    borderTop: "1px solid rgba(255,255,255,0.06)",
    background: "#0f0f13",
  },
  suggestions: {
    display: "flex",
    gap: "6px",
    padding: "8px 14px",
    overflowX: "auto",
    scrollbarWidth: "none",
  },
  chip: {
    background: "rgba(99,102,241,0.15)",
    border: "1px solid rgba(99,102,241,0.3)",
    color: "#a5b4fc",
    padding: "5px 12px",
    borderRadius: "20px",
    fontSize: "11.5px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  inputRow: {
    display: "flex",
    gap: "8px",
    padding: "12px 14px",
    alignItems: "flex-end",
  },
  textarea: {
    flex: 1,
    background: "#1e1e2e",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    color: "#e2e2f0",
    padding: "10px 14px",
    fontSize: "13px",
    resize: "none",
    outline: "none",
    fontFamily: "inherit",
    lineHeight: "1.4",
    maxHeight: "100px",
    overflowY: "auto",
  },
  sendBtn: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none",
    borderRadius: "12px",
    color: "#fff",
    width: "40px",
    height: "40px",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
};
