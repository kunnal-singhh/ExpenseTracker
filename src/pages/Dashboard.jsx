import React from 'react'
import Transactions from './Transactions'

const Dashboard = () => {
  return (
    <> 
        <h3 className='ms-3 mb-3'>Dashboard</h3>
        <div className='mb-5'> 
            <div className='container w-100 h-25 '> 
         <div className='row justify-content-evenly'>
          <div className="amount-card col-3  mt-5 d-flex flex-column justify-content-center align-items-center" style={{height:'10rem',borderRadius:'10px'}}>
           
              <h4>Expense amount</h4>
              <h1>$123</h1>
            
          </div>
          <div className="amount-card col-3  d-flex flex-column justify-content-center align-items-center" style={{height:'10rem',borderRadius:'10px'}}>
           
              <h4>Added amount</h4>
              <h1>$123</h1>
            
          </div>
          <div className="amount-card col-3  mt-5 d-flex flex-column justify-content-center align-items-center" style={{height:'10rem',borderRadius:'10px'}}>
           
              <h4>Remaining amount</h4>
              <h1>$123</h1>
            
          </div>
          
         </div>
       </div>
       </div>
     
        <Transactions />
    </>
    
  )
}

export default Dashboard