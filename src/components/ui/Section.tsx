import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SectionProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export const Section: React.FC<SectionProps> = ({ title, children, className = '' }) => {
  return (
    <Card className={cn("glass-card border-slate-200 shadow-none", className)}>
      {title && (
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-[18px] font-bold text-slate-800">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn("px-4 pb-4", !title && "pt-4")}>
        {children}
      </CardContent>
    </Card>
  )
}
