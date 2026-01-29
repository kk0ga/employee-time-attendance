import React from 'react'
import { GraphRequestError } from '../../lib/graph/graphClient'
import { Button } from './button'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

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
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title || 'エラーが発生しました'}</AlertTitle>
      <AlertDescription className="mt-2">
        {(message || children) && (
          <div className="text-[13px] leading-relaxed">
            {message || children}
          </div>
        )}
        {detail && <p className="mt-1 text-[12px] opacity-90">{detail}</p>}
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="mt-3 h-8 border border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            再試行
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
