/* eslint-disable react-hooks/incompatible-library */
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import type { AttendanceDay } from '../domain/attendance'
import { fetchAttendanceMonth, updateAttendanceCategory } from '../lib/attendanceRepo'
import { fetchHolidaysForMonth } from '../lib/googleCalendar/holidayCalendar'
import { getTokyoYearMonth, weekdayJa } from '../lib/tokyoDate'
import { createPunch, type PunchType } from '../lib/graph/punches'
import { GraphRequestError } from '../lib/graph/graphClient'
import { fetchWorkCategories } from '../lib/workCategoryRepo'

function normalizeTime(value: string): string {
  const parts = value.split(':')
  if (parts.length === 2) return `${value}:00`
  return value
}

export function Attendance() {
  const { year, month } = getTokyoYearMonth()
  const queryClient = useQueryClient()

  const [editTimes, setEditTimes] = useState<
    Record<string, { start?: string; end?: string }>
  >({})
  const [editCategories, setEditCategories] = useState<Record<string, string>>({})

  const attendanceQuery = useQuery({
    queryKey: ['attendance', year, month],
    queryFn: () => fetchAttendanceMonth({ year, month }),
  })

  const holidaysQuery = useQuery({
    queryKey: ['holidays', year, month],
    queryFn: () => fetchHolidaysForMonth({ year, month }),
    retry: false,
    staleTime: 1000 * 60 * 60 * 12,
  })

  const workCategoriesQuery = useQuery({
    queryKey: ['work-categories'],
    queryFn: () => fetchWorkCategories(),
    retry: false,
    staleTime: 1000 * 60 * 60 * 12,
  })

  const createPunchMutation = useMutation({
    mutationFn: (params: { date: string; type: PunchType; time: string }) =>
      createPunch({
        type: params.type,
        date: params.date,
        time: normalizeTime(params.time),
      }),
    onSuccess: async (_data, variables) => {
      setEditTimes((prev) => {
        const current = prev[variables.date]
        if (!current) return prev
        const next = { ...current }
        delete next[variables.type]
        if (Object.keys(next).length === 0) {
          // remove date entry
          const rest = { ...prev }
          delete rest[variables.date]
          return rest
        }
        return { ...prev, [variables.date]: next }
      })

      await queryClient.invalidateQueries({ queryKey: ['attendance', year, month] })
    },
  })

  const updateCategoryMutation = useMutation({
    mutationFn: (params: { date: string; workCategory: string | null }) =>
      updateAttendanceCategory(params),
    onSuccess: async (_data, variables) => {
      setEditCategories((prev) => {
        const next = { ...prev }
        delete next[variables.date]
        return next
      })
      await queryClient.invalidateQueries({ queryKey: ['attendance', year, month] })
    },
  })

  const createErrorMessage = useMemo(() => {
    const err = createPunchMutation.error
    if (!err) return null
    if (err instanceof GraphRequestError) {
      return `${err.message} (status=${err.status}${err.code ? `, code=${err.code}` : ''})`
    }
    if (err instanceof Error) return err.message
    return '不明なエラー'
  }, [createPunchMutation.error])

  const updateCategoryErrorMessage = useMemo(() => {
    const err = updateCategoryMutation.error
    if (!err) return null
    if (err instanceof GraphRequestError) {
      return `${err.message} (status=${err.status}${err.code ? `, code=${err.code}` : ''})`
    }
    if (err instanceof Error) return err.message
    return '不明なエラー'
  }, [updateCategoryMutation.error])

  const setEditValue = useMemo(() => {
    return (date: string, type: PunchType, value: string) => {
      setEditTimes((prev) => ({
        ...prev,
        [date]: {
          ...prev[date],
          [type]: value,
        },
      }))
    }
  }, [])

  const setEditCategory = useMemo(() => {
    return (date: string, value: string) => {
      setEditCategories((prev) => ({ ...prev, [date]: value }))
    }
  }, [])

  const editIcon = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block' }}
    >
      <path
        d="M4 17.25V20h2.75L17.81 8.94l-2.75-2.75L4 17.25Zm14.71-9.04a1.003 1.003 0 0 0 0-1.42l-1.5-1.5a1.003 1.003 0 0 0-1.42 0l-1.13 1.13 2.75 2.75 1.3-1.3Z"
        fill="currentColor"
      />
    </svg>
  )

  const columns = useMemo<ColumnDef<AttendanceDay>[]>(
    () => [
      {
        header: '日付',
        accessorKey: 'date',
      },
      {
        header: '曜日',
        accessorKey: 'weekday',
        cell: ({ row, getValue }) => {
          const weekday = getValue<number>()
          const date = row.original.date
          const holidayName = holidaysQuery.data?.[date]
          return holidayName ? `${weekdayJa(weekday)}（祝: ${holidayName}）` : weekdayJa(weekday)
        },
      },
      {
        header: '勤務区分',
        accessorKey: 'workCategory',
        cell: ({ row }) => {
          const record = row.original
          const value = editCategories[record.date] ?? record.workCategory ?? ''
          const disabled = updateCategoryMutation.isPending
          const options = workCategoriesQuery.data ?? []

          return (
            <select
              value={value}
              onChange={(event) => {
                const selected = event.target.value
                setEditCategory(record.date, selected)
                updateCategoryMutation.mutateAsync({
                  date: record.date,
                  workCategory: selected ? selected : null,
                })
              }}
              disabled={disabled}
              style={{ padding: '4px 6px' }}
            >
              <option value="">未設定</option>
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )
        },
      },
      {
        header: '出勤',
        accessorKey: 'start',
        cell: ({ row }) => {
          const record = row.original
          const startValue = editTimes[record.date]?.start ?? record.start ?? ''
          const canSubmitStart = !!startValue && !createPunchMutation.isPending

          return (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="time"
                value={startValue}
                onChange={(event) => setEditValue(record.date, 'start', event.target.value)}
                style={{ padding: '4px 6px' }}
              />
              <button
                type="button"
                onClick={() =>
                  createPunchMutation.mutateAsync({
                    date: record.date,
                    type: 'start',
                    time: startValue,
                  })
                }
                disabled={!canSubmitStart}
                aria-label="出勤時刻を修正"
                title="出勤時刻を修正"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 6px' }}
              >
                {editIcon}
              </button>
            </div>
          )
        },
      },
      {
        header: '退勤',
        accessorKey: 'end',
        cell: ({ row }) => {
          const record = row.original
          const endValue = editTimes[record.date]?.end ?? record.end ?? ''
          const canSubmitEnd = !!endValue && !createPunchMutation.isPending

          return (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="time"
                value={endValue}
                onChange={(event) => setEditValue(record.date, 'end', event.target.value)}
                style={{ padding: '4px 6px' }}
              />
              <button
                type="button"
                onClick={() =>
                  createPunchMutation.mutateAsync({
                    date: record.date,
                    type: 'end',
                    time: endValue,
                  })
                }
                disabled={!canSubmitEnd}
                aria-label="退勤時刻を修正"
                title="退勤時刻を修正"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 6px' }}
              >
                {editIcon}
              </button>
            </div>
          )
        },
      },
    ],
    [
      createPunchMutation,
      editCategories,
      editTimes,
      holidaysQuery.data,
      setEditCategory,
      setEditValue,
      updateCategoryMutation.isPending,
      workCategoriesQuery.data,
    ],
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
        対象: {year}年{month}月（SharePoint）
      </p>

      {createPunchMutation.isError ? (
        <p style={{ color: '#b00' }}>修正打刻に失敗しました: {createErrorMessage}</p>
      ) : null}

      {updateCategoryMutation.isError ? (
        <p style={{ color: '#b00' }}>
          勤務区分の更新に失敗しました: {updateCategoryErrorMessage}
        </p>
      ) : null}

      {holidaysQuery.isError ? (
        <p style={{ color: '#b00' }}>
          祝日カレンダーの読み込みに失敗しました（`VITE_GCAL_HOLIDAY_CALENDAR_ID` を確認してください）
        </p>
      ) : null}

      {workCategoriesQuery.isError ? (
        <p style={{ color: '#b00' }}>勤務区分の取得に失敗しました。</p>
      ) : null}

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
            {table.getRowModel().rows.map((row) => {
              const record = row.original
              const isSundayOrHoliday =
                record.weekday === 0 || !!holidaysQuery.data?.[record.date]
              const isSaturday = record.weekday === 6
              const rowBackground = isSundayOrHoliday
                ? '#fee2e2'
                : isSaturday
                  ? '#e0f2fe'
                  : undefined

              return (
                <tr key={row.id} style={rowBackground ? { backgroundColor: rowBackground } : undefined}>
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    style={{ borderBottom: '1px solid #8882', padding: '8px 10px' }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </main>
  )
}
