import React from 'react'

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode
}

export const Table: React.FC<TableProps> = ({ children, className = '', ...props }) => (
  <table className={`w-full border-collapse border border-[#ddd] bg-white text-sm ${className}`} {...props}>
    {children}
  </table>
)

export const Th: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ children, className = '', ...props }) => (
  <th className={`border border-[#ddd] bg-[#f2f2f2] p-2 text-left font-bold ${className}`} {...props}>
    {children}
  </th>
)

export const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ children, className = '', ...props }) => (
  <td className={`border border-[#ddd] p-2 ${className}`} {...props}>
    {children}
  </td>
)
