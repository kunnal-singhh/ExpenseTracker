import { useContext, useEffect, useRef, useState } from "react";
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

Answer questions about these transactions clearly and concisely.`;
}

export default function AIAssistant() {
  const { transactions } = useContext(ExpenseContext);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: 'Hi! I am your expense AI assistant. Ask me anything about your transactions, like "total this month" or "top expenses".',
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

    const apiMessages = updatedMessages.slice(1).map((m) => ({ role: m.role, content: m.content }));

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
          messages: [{ role: "system", content: buildSystemPrompt(transactions) }, ...apiMessages],
        }),
      });

      const data = await response.json();
      if (data.error) {
        setMessages((prev) => [...prev, { role: "assistant", content: `API Error: ${data.error.message}` }]);
        return;
      }

      const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't process that.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Network error. Please try again." }]);
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
      <button onClick={() => setOpen((o) => !o)} className="ai-fab" title="AI Expense Assistant">
        <i className={`fa-solid ${open ? "fa-xmark" : "fa-robot"}`} />
      </button>

      {open && (
        <div className="ai-window">
          <div className="ai-header">
            <span className="ai-header-icon"><i className="fa-solid fa-sparkles" /></span>
            <div>
              <div className="ai-header-title">Expense AI</div>
              <div className="ai-header-sub">Ask anything about your transactions</div>
            </div>
          </div>

          <div className="ai-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`ai-bubble ${msg.role === "user" ? "ai-user" : "ai-assistant"}`}>
                {msg.content}
              </div>
            ))}
            {loading && <div className="ai-bubble ai-assistant ai-loading">...</div>}
            <div ref={bottomRef} />
          </div>

          <div className="ai-bottom">
            <div className="ai-suggestions">
              {["Total this month", "Previous month", "Top 5 expenses"].map((s) => (
                <button key={s} className="ai-chip" onClick={() => setInput(s)}>
                  {s}
                </button>
              ))}
            </div>

            <div className="ai-input-row">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about your expenses..."
                className="ai-textarea"
                rows={1}
              />
              <button onClick={sendMessage} disabled={loading || !input.trim()} className="ai-send">
                <i className="fa-solid fa-arrow-up" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
