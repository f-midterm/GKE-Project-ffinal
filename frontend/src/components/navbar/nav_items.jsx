import React from 'react'
import { NavLink } from 'react-router-dom'

export default function NavItem({ to, children, activeClass = 'text-gradient font-semibold', className = 'text-gray-800 text-lg font-medium hover:text-gradient', ...props }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => {
        const base = `${className} nav-link-hover-underline`;
        return isActive ? `${base} ${activeClass} active` : base;
      }}
      {...props}
    >
      {children}
    </NavLink>
  )
}