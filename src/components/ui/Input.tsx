import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = ({ className = '', ...props }) => (
  <input
    className={`border border-[#888] px-2 py-1 text-sm focus:border-[#444] focus:outline-none ${className}`}
    {...props}
  />
)
