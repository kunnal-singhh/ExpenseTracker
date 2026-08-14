export const EXPENSE_CATEGORIES = [
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

export const INCOME_CATEGORIES = [
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

const CATEGORY_RULES = [
  {
    category: "Transport",
    keywords: [
      "uber",
      "ola",
      "rapido",
      "taxi",
      "cab",
      "auto",
      "rickshaw",
      "metro",
      "bus",
      "train",
      "fuel",
      "petrol",
      "diesel",
      "parking",
      "toll",
      "office",
      "commute",
    ],
  },
  {
    category: "Alcohol",
    keywords: ["alcohol", "beer", "wine", "whiskey", "whisky", "vodka", "rum", "gin", "liquor", "cocktail", "bar"],
  },
  {
    category: "Beverage",
    keywords: ["drink", "drinks", "cold drink", "cold drinks", "soda", "juice", "tea", "chai", "coffee", "shake", "smoothie", "beverage"],
  },
  {
    category: "Food",
    keywords: [
      "food",
      "ate",
      "eat",
      "meal",
      "restaurant",
      "cafe",
      "lunch",
      "dinner",
      "breakfast",
      "swiggy",
      "zomato",
      "grocery",
      "groceries",
      "snack",
      "chocolate",
      "chocolates",
      "choclate",
      "candy",
      "sweet",
      "sweets",
      "blinkit",
      "zepto",
      "bigbasket",
    ],
  },
  {
    category: "Rent",
    keywords: ["rent", "landlord", "flat", "apartment", "pg", "hostel"],
  },
  {
    category: "Shopping",
    keywords: ["shopping", "amazon", "flipkart", "myntra", "clothes", "shoes", "store", "mall"],
  },
  {
    category: "Bills",
    keywords: ["bill", "electricity", "water", "wifi", "internet", "recharge", "phone", "mobile", "gas"],
  },
  {
    category: "Health",
    keywords: ["doctor", "medicine", "medical", "pharmacy", "hospital", "clinic", "health"],
  },
  {
    category: "Entertainment",
    keywords: ["movie", "netflix", "prime", "spotify", "hotstar", "game", "concert", "party"],
  },
  {
    category: "Education",
    keywords: ["course", "book", "college", "school", "tuition", "exam", "class", "udemy"],
  },
  {
    category: "Travel",
    keywords: ["flight", "hotel", "airbnb", "trip", "vacation", "holiday", "airport"],
  },
];

const INCOME_RULES = [
  {
    category: "Salary",
    keywords: ["salary", "paycheck", "payroll", "wages", "monthly pay"],
  },
  {
    category: "Freelance",
    keywords: ["freelance", "client", "project", "contract", "gig"],
  },
  {
    category: "Business",
    keywords: ["business", "sales", "shop", "revenue", "invoice"],
  },
  {
    category: "Gift",
    keywords: ["gift", "birthday", "family", "friend"],
  },
  {
    category: "Refund",
    keywords: ["refund", "cashback", "reimbursement", "returned"],
  },
  {
    category: "Investment",
    keywords: ["investment", "dividend", "stock", "mutual fund", "sip"],
  },
  {
    category: "Interest",
    keywords: ["interest", "bank interest"],
  },
  {
    category: "Bonus",
    keywords: ["bonus", "incentive", "reward"],
  },
  {
    category: "Savings",
    keywords: ["savings", "saved", "deposit"],
  },
];

export const detectExpenseCategory = (description = "") => {
  const normalized = description.toLowerCase();
  const match = CATEGORY_RULES.find(({ keywords }) =>
    keywords.some((keyword) => matchesKeyword(normalized, keyword))
  );

  return match?.category || "Other";
};

export const detectIncomeCategory = (description = "") => {
  const normalized = description.toLowerCase();
  const match = INCOME_RULES.find(({ keywords }) =>
    keywords.some((keyword) => matchesKeyword(normalized, keyword))
  );

  return match?.category || "Other";
};

const matchesKeyword = (text, keyword) => {
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escapedKeyword}\\b`, "i").test(text);
};
