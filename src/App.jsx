import {Routes,Route} from 'react-router-dom'
import Layout from "./components/Layout";
import Dashboard from './pages/Dashboard'
import AddBalance from './pages/AddBalance'
import AddExpense from "./pages/AddExpense";
import Transactions from "./pages/Transactions";
import Settings from './pages/Settings'
import NotFound from './pages/NotFound';
import Support from './pages/Support'
import { ExpenseProvider } from '../src/context/expenseContext';

function App() {
  return ( 
     <ExpenseProvider> 
        
       <Routes>
      <Route path='/' element={<Layout />}>
        {/* 'index' makes this the default page for the '/' path */}
        <Route index element={<Dashboard />} />
        
        {/* Paths should be relative (no leading slash needed for children) */}
        <Route path='balance' element={<AddBalance />} />
        <Route path='expense' element={<AddExpense />} />
        <Route path='transactions' element={<Transactions />} />
        <Route path='settings' element={<Settings />} />
        <Route path='support' element={<Support />} />
        
        {/* Catch-all for 404s */}
        <Route path='*' element={<NotFound />} />
      </Route>
    </Routes>

      
     </ExpenseProvider>  

  )
}

export default App;
