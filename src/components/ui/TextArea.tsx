import React from 'react'

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const TextArea: React.FC<TextAreaProps> = ({ className = '', ...props }) => (
  <textarea
    className={`border border-[#888] px-2 py-1 text-sm focus:border-[#444] focus:outline-none ${className}`}
    {...props}
  />
)
