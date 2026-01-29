import React from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
}

export const Select: React.FC<SelectProps> = ({ children, className = '', ...props }) => (
  <select
    className={`border border-[#888] bg-white px-2 py-1 text-sm focus:border-[#444] focus:outline-none ${className}`}
    {...props}
  >
    {children}
  </select>
)
