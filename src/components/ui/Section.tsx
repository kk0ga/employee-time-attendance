import React from 'react'

interface SectionProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export const Section: React.FC<SectionProps> = ({ title, children, className = '' }) => {
  return (
    <section className={`glass-card rounded-[12px] border border-slate-200 p-4 ${className}`}>
      {title && <h2 className="mb-3 text-[18px] font-bold text-slate-800">{title}</h2>}
      {children}
    </section>
  )
}
