import React from 'react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import ETlogo from "../assets/ETlogo.png"
const SideMenu = () => {
  const [collapsed, setCollapsed] = useState(false)
  
  return (
    <div className={`sidebar position-relative bg-dark ${collapsed ? "collapsed" : ""}`} >
      <div className='pt-3 text-center'>
        {
          !collapsed && (
            <>
              <img src='https://images.pexels.com/photos/14653174/pexels-photo-14653174.jpeg?_gl=1*12m2wmg*_ga*NTI2MDMzMDAuMTc2NjEwMDExMA..*_ga_8JE65Q40S6*czE3NjY3ODAxNzQkbzIkZzAkdDE3NjY3ODAxNzQkajYwJGwwJGgw' alt='profile' className='profile-img' />
              <h4 className='text-center'>Kunal Singh</h4>
            </>
          )
        }
      </div>
      <button
        className="toggle-btn"
        onClick={() => setCollapsed(!collapsed)}
      >
        <i className="fa-solid fa-bars"></i>
      </button>
      <div className='menu'>
        <NavLink to="/" >
          <i
            className="fa-solid fa-house "
          ></i>
          {!collapsed && <span>Dashboard</span>}
        </NavLink>
        <NavLink to="/balance" >
          <i
            className="fa-solid fa-piggy-bank "
          ></i>
          {!collapsed && <span>Balance</span>}
        </NavLink>
        <NavLink to="/expense" >
          <i
            className="fa-solid fa-money-check-dollar "
          ></i>
          {!collapsed && <span>Expense</span>}
        </NavLink>
        <NavLink to="/transactions" >
          <i
            className="fa-solid fa-money-bill-transfer "
          ></i>
          {!collapsed && <span>Transactions</span>}
        </NavLink>
        <NavLink to="/settings" >
          <i
            className="fa-solid fa-gear "
          ></i>
          {!collapsed && <span>Settings</span>}
        </NavLink>
        <NavLink to="/support" >
          <i
            className="fa-solid fa-call "
          ></i>
          {!collapsed && <span>Support</span>}
        </NavLink>

      </div>

      <div className='logo-area' ><img src={ETlogo} alt="ETlogo" className={`logo ${collapsed ? "rotate" : ""}`} /></div>
    </div>
  )
}

export default SideMenu