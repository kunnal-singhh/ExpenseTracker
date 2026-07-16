const mongoose = require("mongoose");
const Transaction = require("../models/Transaction.model");

const EXPENSE_CATEGORIES = [
  "Food",
  "Beverage",
  "Alcohol",
  "Transport",
  "Rent",
  "Shopping",
  "Bills",
  "Health",
  "Entertainment",
  "Education",
  "Travel",
  "Other",
];

const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "Gift",
  "Refund",
  "Investment",
  "Interest",
  "Bonus",
  "Savings",
  "Other",
];

const EXPENSE_CATEGORY_DESCRIPTIONS = {
  Food: "Meals, snacks, groceries, cafes, restaurants, delivery, packaged food, and edible items. Do not use for drinks when Beverage or Alcohol fits better.",
  Beverage: "Non-alcoholic drinks such as cold drinks, soda, juice, tea, coffee, shakes, smoothies, water, and soft drinks.",
  Alcohol: "Alcoholic drinks such as beer, wine, whiskey, vodka, rum, gin, cocktails, liquor, and bar purchases.",
  Transport: "Cabs, fuel, parking, commute, public transport, trains, buses, flights used as transport, and rides.",
  Rent: "House rent, room rent, PG rent, hostel rent, landlord payments, and accommodation rent.",
  Shopping: "Clothes, shoes, electronics, online shopping, personal items, gifts, and store purchases.",
  Bills: "Electricity, water, internet, mobile recharge, gas, subscriptions, and recurring utility payments.",
  Health: "Doctors, medicines, hospitals, pharmacy, tests, fitness, wellness, and health services.",
  Entertainment: "Movies, games, concerts, streaming, events, parties, and leisure activities.",
  Education: "Books, courses, school, college, tuition, exams, learning apps, and study material.",
  Travel: "Hotels, trips, vacations, sightseeing, tours, and travel stays.",
  Other: "Only for unclear expenses or expenses that do not fit any category above.",
};

const INCOME_CATEGORY_DESCRIPTIONS = {
  Salary: "Regular employment income, monthly salary, payroll, paycheck, wages, and stipend.",
  Freelance: "Freelance work, client payments, contract work, side gigs, and project income.",
  Business: "Business income, sales revenue, shop earnings, invoice payments, and service revenue.",
  Gift: "Money received as gifts from family, friends, birthdays, festivals, or personal occasions.",
  Refund: "Refunds, cashback, reimbursements, returned payments, and reversed charges.",
  Investment: "Investment returns, dividends, stock proceeds, mutual fund withdrawals, and SIP returns.",
  Interest: "Bank interest, fixed deposit interest, savings account interest, and lending interest.",
  Bonus: "Bonuses, incentives, rewards, awards, and extra pay.",
  Savings: "Money moved from savings, cash deposits, piggy bank deposits, or existing saved funds.",
  Other: "Only for unclear income sources or income that does not fit any category above.",
};

const expenseCategoryRules = [
  { category: "Transport", keywords: ["uber", "ola", "rapido", "taxi", "cab", "auto", "rickshaw", "metro", "bus", "train", "fuel", "petrol", "diesel", "parking", "toll", "office", "commute"] },
  { category: "Alcohol", keywords: ["alcohol", "beer", "wine", "whiskey", "whisky", "vodka", "rum", "gin", "liquor", "cocktail", "bar"] },
  { category: "Beverage", keywords: ["drink", "drinks", "cold drink", "cold drinks", "soda", "juice", "tea", "chai", "coffee", "shake", "smoothie", "beverage"] },
  { category: "Food", keywords: ["food", "ate", "eat", "meal", "restaurant", "cafe", "lunch", "dinner", "breakfast", "swiggy", "zomato", "grocery", "groceries", "snack", "blinkit", "zepto", "bigbasket"] },
  { category: "Rent", keywords: ["rent", "landlord", "flat", "apartment", "pg", "hostel"] },
  { category: "Shopping", keywords: ["shopping", "amazon", "flipkart", "myntra", "clothes", "shoes", "store", "mall"] },
  { category: "Bills", keywords: ["bill", "electricity", "water", "wifi", "internet", "recharge", "phone", "mobile", "gas"] },
  { category: "Health", keywords: ["doctor", "medicine", "medical", "pharmacy", "hospital", "clinic", "health"] },
  { category: "Entertainment", keywords: ["movie", "netflix", "prime", "spotify", "hotstar", "game", "concert", "party"] },
  { category: "Education", keywords: ["course", "book", "college", "school", "tuition", "exam", "class", "udemy"] },
  { category: "Travel", keywords: ["flight", "hotel", "airbnb", "trip", "vacation", "holiday", "airport"] },
];

const incomeCategoryRules = [
  { category: "Salary", keywords: ["salary", "paycheck", "payroll", "wages", "monthly pay"] },
  { category: "Freelance", keywords: ["freelance", "client", "project", "contract", "gig"] },
  { category: "Business", keywords: ["business", "sales", "shop", "revenue", "invoice"] },
  { category: "Gift", keywords: ["gift", "birthday", "family", "friend"] },
  { category: "Refund", keywords: ["refund", "cashback", "reimbursement", "returned"] },
  { category: "Investment", keywords: ["investment", "dividend", "stock", "mutual fund", "sip"] },
  { category: "Interest", keywords: ["interest", "bank interest"] },
  { category: "Bonus", keywords: ["bonus", "incentive", "reward"] },
  { category: "Savings", keywords: ["savings", "saved", "deposit"] },
];

const detectCategory = (description = "", rules) => {
  const normalized = description.toLowerCase();
  const match = rules.find(({ keywords }) =>
    keywords.some((keyword) => normalized.includes(keyword))
  );
  return match?.category || "Other";
};

const normalizeCategory = (category = "", allowedCategories = EXPENSE_CATEGORIES) => {
  const normalized = String(category).trim().replace(/^["']|["']$/g, "").toLowerCase();
  const exactMatch = allowedCategories.find((item) => item.toLowerCase() === normalized);
  if (exactMatch) return exactMatch;

  return allowedCategories.find((item) =>
    item !== "Other" && normalized.includes(item.toLowerCase())
  ) || "Other";
};

const categoryPrompt = (description, type = "expense") => {
  const isIncome = type === "income";
  const descriptions = isIncome ? INCOME_CATEGORY_DESCRIPTIONS : EXPENSE_CATEGORY_DESCRIPTIONS;
  const exampleCategory = isIncome ? "Salary" : "Food";

  return `
You are a ${isIncome ? "income source" : "expense"} categorization engine.

Transaction description:
"${description}"

Allowed categories and meanings:
${Object.entries(descriptions).map(([name, meaning]) => `- ${name}: ${meaning}`).join("\n")}

Return JSON only in this exact shape:
{"category":"${exampleCategory}"}

Rules:
- Pick exactly one category from the allowed list.
- Prefer the closest useful category instead of Other.
- Use Other only when the description is too vague or genuinely does not fit the allowed categories.
${isIncome ? "- Categorize where the money came from, not what it might be spent on." : `- If the item is a non-alcoholic drink, choose Beverage.
- If the item is an alcoholic drink, choose Alcohol.
- If the item is edible food, choose Food even if the food name is regional, brand-specific, or unfamiliar.`}
`;
};

const parseGeminiCategory = (rawText = "") => {
  const cleaned = rawText.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    return parsed.category || "";
  } catch {
    return cleaned;
  }
};

const categorizeWithGemini = async (description, type = "expense") => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const allowedCategories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: categoryPrompt(description, type) }] }],
        generationConfig: {
          maxOutputTokens: 80,
          temperature: 0,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Gemini categorization failed: ${response.status} ${message}`);
  }
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text).join(" ");

  return normalizeCategory(parseGeminiCategory(text), allowedCategories);
};

const categorizeWithAI = async (description, type = "expense") => {
  try {
    const category = await categorizeWithGemini(description, type);
    if (category && category !== "Other") return { category, error: null };
  } catch (err) {
    console.error(err.message);
    return { category: "Other", error: err.message };
  }

  return { category: "Other", error: null };
};

const resolveTransactionCategory = async (description, category, type = "expense") => {
  const allowedCategories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const rules = type === "income" ? incomeCategoryRules : expenseCategoryRules;
  const requestedCategory = normalizeCategory(category, allowedCategories);
  if (requestedCategory !== "Other") return { category: requestedCategory, source: "manual" };

  const localCategory = detectCategory(description, rules);
  if (localCategory !== "Other") return { category: localCategory, source: "local" };

  const aiResult = await categorizeWithAI(description, type);
  return {
    category: aiResult.category,
    source: aiResult.category === "Other" ? (aiResult.error ? "ai_error" : "none") : "ai",
    error: aiResult.error,
  };
};

const categorizeTransaction = async (req, res) => {
  try {
    const { description, type = "expense" } = req.body;
    if (!description?.trim()) {
      return res.status(400).json({ success: false, message: "description is required" });
    }

    const result = await resolveTransactionCategory(description, undefined, type === "income" ? "income" : "expense");
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @GET /api/transactions ────────────────────────────
const getTransactions = async (req, res) => {
  try {
    const { type, page = 1, limit = 50 } = req.query;

    const filter = { user: req.user._id };
    if (type === "income") filter.amount = { $gt: 0 };
    if (type === "expense") filter.amount = { $lt: 0 };

    const skip = (Number(page) - 1) * Number(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      transactions,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @POST /api/transactions ───────────────────────────
const createTransaction = async (req, res) => {
  try {
    const { to, amount, category } = req.body;

    if (!to || amount === undefined || amount === 0) {
      return res.status(400).json({ success: false, message: "to and a non-zero amount are required" });
    }

    /* 
    // Removed hard balance check so users can track expenses normally 
    // and rely on the soft budget alert instead.
    if (Number(amount) < 0) {
      const result = await Transaction.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
        { $group: { _id: null, balance: { $sum: "$amount" } } },
      ]);
      const balance = result[0]?.balance || 0;

      if (balance <= 0) {
        return res.status(400).json({ success: false, message: "Balance is zero. Cannot add expense." });
      }
      if (Math.abs(Number(amount)) > balance) {
        return res.status(400).json({ success: false, message: "Expense exceeds available balance." });
      }
    }
    */

    const resolvedCategory = Number(amount) < 0
      ? await resolveTransactionCategory(to, category, "expense")
      : await resolveTransactionCategory(to, category, "income");
    const now = new Date();
    const transaction = await Transaction.create({
      user: req.user._id,
      to,
      amount: Number(amount),
      type: Number(amount) > 0 ? "income" : "expense",
      category: resolvedCategory.category,
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
    });

    // --- BUDGET ALERT LOGIC ---
    if (Number(amount) < 0) {
      const userDoc = await mongoose.model("User").findById(req.user._id);
      if (userDoc && userDoc.budgetAmount > 0) {
        const now = new Date();
        let startDate = new Date(now);
        let endDate = new Date(now);

        if (userDoc.budgetPeriod === "daily") {
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
        } else if (userDoc.budgetPeriod === "weekly") {
          const day = startDate.getDay();
          const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
          startDate.setDate(diff);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
        } else if (userDoc.budgetPeriod === "yearly") {
          startDate.setMonth(0, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate.setMonth(11, 31);
          endDate.setHours(23, 59, 59, 999);
        } else { // monthly (default)
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);
        }

        // Check if an alert was already sent in this specific period
        let alreadySentThisPeriod = false;
        if (userDoc.lastBudgetAlertDate) {
          const lastAlert = new Date(userDoc.lastBudgetAlertDate);
          if (lastAlert >= startDate && lastAlert <= endDate) {
            alreadySentThisPeriod = true;
          }
        }

        if (!alreadySentThisPeriod) {
          const expenseResult = await Transaction.aggregate([
            { 
              $match: { 
                user: new mongoose.Types.ObjectId(req.user._id),
                amount: { $lt: 0 },
                createdAt: { $gte: startDate, $lte: endDate }
              } 
            },
            { $group: { _id: null, total: { $sum: "$amount" } } }
          ]);
          
          const totalExpensesThisPeriod = Math.abs(expenseResult[0]?.total || 0);

          if (totalExpensesThisPeriod > userDoc.budgetAmount) {
            const { sendBudgetAlertEmail } = require("../utils/emailService");
            const sent = await sendBudgetAlertEmail(
              userDoc.email, 
              userDoc.name, 
              userDoc.budgetAmount, 
              totalExpensesThisPeriod,
              userDoc.budgetPeriod
            );
            if (sent) {
              userDoc.lastBudgetAlertDate = new Date();
              await userDoc.save();
            }
          }
        }
      }
    }
    // --------------------------

    res.status(201).json({ success: true, transaction });
  } catch (err) {
    console.error("createTransaction error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @DELETE /api/transactions/:id ────────────────────
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    res.json({ success: true, message: "Transaction deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @GET /api/transactions/summary ───────────────────
const getSummary = async (req, res) => {
  try {
    const result = await Transaction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: { $cond: [{ $gt: ["$amount", 0] }, "$amount", 0] } },
          totalExpense: { $sum: { $cond: [{ $lt: ["$amount", 0] }, "$amount", 0] } },
          balance: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const summary = result[0] || { totalIncome: 0, totalExpense: 0, balance: 0, count: 0 };
    delete summary._id;

    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getTransactions, createTransaction, deleteTransaction, getSummary, categorizeTransaction };
