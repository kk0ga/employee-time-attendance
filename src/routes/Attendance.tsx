/* eslint-disable react-hooks/incompatible-library */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import type { AttendanceDay } from '../domain/attendance'
import { fetchAttendanceMonth } from '../lib/attendanceRepo'
import { getTokyoYearMonth, weekdayJa } from '../lib/tokyoDate'

export function Attendance() {
  const { year, month } = getTokyoYearMonth()

  const attendanceQuery = useQuery({
    queryKey: ['attendance', year, month],
    queryFn: () => fetchAttendanceMonth({ year, month }),
  })

  const columns = useMemo<ColumnDef<AttendanceDay>[]>(
    () => [
      {
        header: '日付',
        accessorKey: 'date',
      },
      {
        header: '曜日',
        accessorKey: 'weekday',
        cell: ({ getValue }) => weekdayJa(getValue<number>()),
      },
      { header: '出勤', accessorKey: 'start' },
      { header: '退勤', accessorKey: 'end' },
    ],
    [],
  )

  const table = useReactTable({
    data: attendanceQuery.data?.days ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <main className="app">
      <h1>勤怠一覧</h1>
      <p>
        対象: {year}年{month}月（モック）
      </p>

      {attendanceQuery.isPending ? (
        <p>読み込み中...</p>
      ) : attendanceQuery.isError ? (
        <p>読み込みに失敗しました</p>
      ) : (
        <table style={{ borderCollapse: 'collapse', width: 'min(720px, 100%)' }}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{
                      textAlign: 'left',
                      borderBottom: '1px solid #8884',
                      padding: '8px 10px',
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    style={{ borderBottom: '1px solid #8882', padding: '8px 10px' }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
