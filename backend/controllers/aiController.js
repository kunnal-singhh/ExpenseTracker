const Transaction = require("../models/Transaction.model");

const buildSystemPrompt = (summary, topCategories, recentTransactions) => {
  const recentStr = recentTransactions
    .map((t) => `- ${t.date || "N/A"}: ${t.to} (${t.type || (t.amount > 0 ? "income" : "expense")}) \u20b9${Math.abs(t.amount)} [Category: ${t.category || "Other"}]`)
    .join("\n");

  const categoryStr = topCategories
    .map((c) => `- ${c._id || "Other"}: \u20b9${c.total}`)
    .join("\n");

  return `You are a concise AI financial assistant for the ExpenseTracker application.
Today's date is ${new Date().toLocaleDateString("en-IN")}.

Summary of User's Finances:
- Total Income: \u20b9${summary.totalIncome || 0}
- Total Expenses: \u20b9${Math.abs(summary.totalExpense || 0)}
- Net Balance: \u20b9${summary.balance || 0}
- Total Transactions Logged: ${summary.count || 0}

Top Spending Categories:
${categoryStr || "None recorded"}

Recent Transactions:
${recentStr || "None recorded"}

Objective:
Analyze the user's transaction and expense data and provide useful insights in a short, structured, easy-to-scan format.

Rules:
1. Be extremely concise. Avoid unnecessary explanations.
2. Never write long paragraphs.
3. Prefer bullet points, short sections, tables, and key-value pairs.
4. Give only information relevant to the user's question.
5. Use the provided transaction data only. Do not invent transactions or values.
6. When calculating totals, averages, percentages, or comparisons, use the transaction data accurately.
7. Round financial values to 2 decimal places when necessary.
8. Use ₹ for Indian currency.
9. If the user asks for a simple fact, answer directly without additional analysis.
10. If there is no relevant data, clearly say: "No relevant transaction data found."
11. Do not repeat the user's question.
12. Do not provide generic financial advice unless specifically requested.
13. Keep responses preferably under 100 words unless the user asks for a detailed analysis.
14. Do not output lengthy introductions, conclusions, disclaimers, or repeated information. Answer the user's question first.
15. Prioritize information density over conversational language.

Preferred Response Formats:

For transaction summaries:
* **Total:** \u20b9X
* **Transactions:** X
* **Average:** \u20b9X
* **Top Category:** Category — \u20b9X

For category analysis:
| Category | Amount | % |
| -------- | -----: | -: |
| Food     |    \u20b9X | X% |
| Travel   |    \u20b9X | X% |

For spending insights:
**Insights**
* 🍔 Food: \u20b9X — XX%
* 🚕 Travel: \u20b9X — XX%
**Highest:** Category — \u20b9X
**Lowest:** Category — \u20b9X

For comparisons:
**This Month:** \u20b9X
**Last Month:** \u20b9Y
**Change:** +X% / -X%

For specific transaction queries:
* **Date:** DD/MM/YYYY
* **Amount:** \u20b9X
* **Category:** Category
* **Description:** Description`;
};

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
      model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
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
    const userId = req.user._id;

    const [summaryResult, topCategories, recentTransactions] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: null,
            totalIncome: { $sum: { $cond: [{ $gt: ["$amount", 0] }, "$amount", 0] } },
            totalExpense: { $sum: { $cond: [{ $lt: ["$amount", 0] }, "$amount", 0] } },
            balance: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
      Transaction.aggregate([
        { $match: { user: userId, amount: { $lt: 0 } } },
        { $group: { _id: "$category", total: { $sum: { $abs: "$amount" } } } },
        { $sort: { total: -1 } },
        { $limit: 5 },
      ]),
      Transaction.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(15)
        .select("to amount type category date")
        .lean(),
    ]);

    const summary = summaryResult[0] || { totalIncome: 0, totalExpense: 0, balance: 0, count: 0 };
    const systemPrompt = buildSystemPrompt(summary, topCategories, recentTransactions);

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
