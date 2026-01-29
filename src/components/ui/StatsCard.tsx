import React from 'react'

interface StatsCardProps {
  label: string
  value: string | number
  subtext?: string
  className?: string
}

export const StatsCard: React.FC<StatsCardProps> = ({ label, value, subtext, className = '' }) => {
  return (
    <div className={`rounded-[12px] border border-[#e2e8f0] bg-[linear-gradient(135deg,rgba(248,250,252,0.9),rgba(255,255,255,0.9))] p-3 ${className}`}>
      <div className="text-[12px] text-[#64748b]">{label}</div>
      <div className="text-[22px] font-bold text-[#0f172a]">{value}</div>
      {subtext && <div className="mt-1 text-[12px] text-[#475569]">{subtext}</div>}
    </div>
  )
}
