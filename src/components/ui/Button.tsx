import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'punch' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'punch'
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-white border border-[#444] text-[#444] hover:bg-[#f0f0f0]',
    secondary: 'bg-[#444] border border-[#444] text-white hover:bg-[#333]',
    punch: 'flex-col rounded-full border-2 border-[#b00] text-[#b00] hover:bg-red-50',
    ghost: 'bg-transparent hover:bg-black/5 border-none',
  }

  const sizes = {
    sm: 'px-3 py-1 text-xs min-w-[80px]',
    md: 'px-4 py-2 text-sm min-w-[100px] rounded',
    lg: 'px-6 py-3 text-base min-w-[120px] rounded',
    punch: 'w-32 h-32 text-base',
  }

  const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`

  return (
    <button className={combinedClassName} {...props}>
      {children}
    </button>
  )
}
