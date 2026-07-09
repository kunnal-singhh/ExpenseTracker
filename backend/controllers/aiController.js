const Transaction = require("../models/Transaction.model");

const buildSystemPrompt = (transactions = []) => `You are a smart expense assistant. The user has the following transaction data:

${JSON.stringify(transactions, null, 2)}

Each transaction has:
- _id: unique MongoDB id
- to: the name/description of the expense/income
- amount: number (negative means money spent, positive means money received)
- date: in MM/DD/YYYY format
- time: time of the transaction
- type: "income" or "expense"

Today's date is ${new Date().toLocaleDateString("en-US")}.

Answer questions about these transactions clearly and concisely.`;

const normalizeMessages = (messages = []) =>
  Array.isArray(messages)
    ? messages
        .filter((message) => ["user", "assistant"].includes(message?.role) && typeof message?.content === "string")
        .slice(-20)
        .map(({ role, content }) => ({ role, content }))
    : [];

const chatWithGroq = async ({ apiKey, systemPrompt, messages }) => {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    }),
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || "AI request failed");
  }

  return data.choices?.[0]?.message?.content || "Sorry, I couldn't process that.";
};

const chatWithGemini = async ({ apiKey, systemPrompt, messages }) => {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const conversation = messages
    .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`)
    .join("\n\n");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\nConversation:\n${conversation}` }] }],
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.2,
        },
      }),
    }
  );

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || "AI request failed");
  }

  return data.candidates?.[0]?.content?.parts?.map((part) => part.text).join(" ").trim()
    || "Sorry, I couldn't process that.";
};

const chat = async (req, res) => {
  try {
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!groqKey && !geminiKey) {
      return res.status(500).json({
        success: false,
        message: "No backend AI API key is configured.",
      });
    }

    const { messages = [] } = req.body;
    const safeMessages = normalizeMessages(messages);
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    const systemPrompt = buildSystemPrompt(transactions);
    const reply = groqKey
      ? await chatWithGroq({ apiKey: groqKey, systemPrompt, messages: safeMessages })
      : await chatWithGemini({ apiKey: geminiKey, systemPrompt, messages: safeMessages });

    res.json({
      success: true,
      reply,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { chat };
