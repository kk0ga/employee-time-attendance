import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  label: string
  value: string | number
  subtext?: string
  className?: string
}

export const StatsCard: React.FC<StatsCardProps> = ({ label, value, subtext, className = '' }) => {
  return (
    <Card className={cn("border-[#e2e8f0] bg-[linear-gradient(135deg,rgba(248,250,252,0.9),rgba(255,255,255,0.9))] shadow-none", className)}>
      <CardContent className="p-3">
        <div className="text-[12px] text-[#64748b]">{label}</div>
        <div className="text-[22px] font-bold text-[#0f172a]">{value}</div>
        {subtext && <div className="mt-1 text-[12px] text-[#475569]">{subtext}</div>}
      </CardContent>
    </Card>
  )
}
