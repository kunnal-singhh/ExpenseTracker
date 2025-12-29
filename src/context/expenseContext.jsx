import { createContext, useContext, useState ,useEffect} from "react";

export const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  // const [transactions, setTransactions] = useState([
  //   {
  //     id: 1,
  //     from: "kunal",
  //     to: "rahul",
  //     date: "12/12/2025",
  //     time: "23:45:34",
  //     amount: 34,
  //   },
  // ]);

  const [transactions, setTransactions] = useState(() => {
    const storedData = localStorage.getItem("transactions");
    return storedData ? JSON.parse(storedData) : [];
  });

 useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  const addTransactions = (trans) => {
    setTransactions((prev) => [...prev, trans]);
  };

  return (
    <ExpenseContext.Provider value={{ transactions, addTransactions }}>
      {children}
    </ExpenseContext.Provider>
  )
}

// custom hook
export default function useExpense  () {
  return useContext(ExpenseContext)
}
