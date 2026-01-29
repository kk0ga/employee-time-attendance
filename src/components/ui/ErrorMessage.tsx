import React from 'react'
import { GraphRequestError } from '../../lib/graph/graphClient'
import { Button } from './Button'

interface ErrorMessageProps {
  title?: string
  message?: string
  error?: unknown
  onRetry?: () => void
  className?: string
  children?: React.ReactNode
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  error,
  onRetry,
  className = '',
  children,
}) => {
  const detail = React.useMemo(() => {
    if (!error) return null
    if (error instanceof GraphRequestError) {
      return `${error.message} (status=${error.status}${error.code ? `, code=${error.code}` : ''})`
    }
    if (error instanceof Error) return error.message
    return String(error)
  }, [error])

  return (
    <div className={`mt-4 rounded-[12px] border border-[#f005] bg-[#f001] p-3 text-[#c00] ${className}`}>
      {title && <h2 className="text-[14px] font-bold">{title}</h2>}
      {(message || children) && (
        <div className="mt-1 text-[13px] leading-relaxed">
          {message || children}
        </div>
      )}
      {detail && <p className="mt-1 text-[12px] opacity-90">{detail}</p>}
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="mt-2 border-[#c006] text-[#c00] hover:bg-[#c001]"
        >
          再試行
        </Button>
      )}
    </div>
  )
}
