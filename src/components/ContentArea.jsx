import React, { useState } from 'react'
import Dashboard from '../pages/Dashboard'

const ContentArea = () => {
  // const [collapsed,setCollapsed]=useState(false)
  // const manage=()=>{ 
  //   setCollapsed((prev)=>!prev)
  // }
  return (
    <div className='w-100  h-100' style={{backgroundColor:'black'}}> 
    
              {/* <div className=' bg-black' onClick={manage} style={{border:"10px solid #ccc",width:'80px',height:'50px',borderRadius:'30px',padding:'3px'}}>
                <div className={`bg-light toggle-icon ${collapsed?"":"rotate-icon"}`} style={{width:'25px',height:'25px',borderRadius:'50%'}}></div>
              </div> */}
              <Dashboard />
    </div>
  )
}

export default ContentArea