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
import { fetchWorkCategories } from '../lib/workCategoryRepo'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Table, Td, Th } from '../components/ui/Table'
import { Section } from '../components/ui/Section'

function normalizeTime(value: string): string {
  const parts = value.split(':')
  if (parts.length === 2) return `${value}:00`
  return value
}

export function Attendance() {
  const { year, month } = getTokyoYearMonth()
  const queryClient = useQueryClient()
  const todayTokyo = useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  }, [])

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
      className="block"
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
            <Select
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
            >
              <option value="">未設定</option>
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
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
            <div className="flex flex-wrap items-center gap-1.5">
              <Input
                type="time"
                value={startValue}
                onChange={(event) => setEditValue(record.date, 'start', event.target.value)}
              />
              <Button
                variant="ghost"
                size="sm"
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
                className="min-w-0 px-1.5"
              >
                {editIcon}
              </Button>
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
            <div className="flex flex-wrap items-center gap-1.5">
              <Input
                type="time"
                value={endValue}
                onChange={(event) => setEditValue(record.date, 'end', event.target.value)}
              />
              <Button
                variant="ghost"
                size="sm"
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
                className="min-w-0 px-1.5"
              >
                {editIcon}
              </Button>
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
    <main className="mx-auto w-full max-w-[960px] p-4">
      <h1>勤怠一覧</h1>
      <p className="mt-1 opacity-80">
        対象: {year}年{month}月（SharePoint）
      </p>

      {createPunchMutation.isError && (
        <ErrorMessage
          title="修正打刻に失敗しました"
          error={createPunchMutation.error}
        />
      )}

      {updateCategoryMutation.isError && (
        <ErrorMessage
          title="勤務区分の更新に失敗しました"
          error={updateCategoryMutation.error}
        />
      )}

      {holidaysQuery.isError && (
        <ErrorMessage
          title="祝日カレンダーの読み込みに失敗しました"
          message="`VITE_GCAL_HOLIDAY_CALENDAR_ID` を確認してください。"
          error={holidaysQuery.error}
        />
      )}

      {workCategoriesQuery.isError && (
        <ErrorMessage
          title="勤務区分の取得に失敗しました"
          error={workCategoriesQuery.error}
        />
      )}

      {attendanceQuery.isPending ? (
        <p className="mt-4">読み込み中...</p>
      ) : attendanceQuery.isError ? (
        <ErrorMessage
          title="読み込みに失敗しました"
          error={attendanceQuery.error}
          onRetry={() => attendanceQuery.refetch()}
        />
      ) : (
        <Section className="mt-4 overflow-hidden !p-0">
          <Table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <Th key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </Th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => {
                const record = row.original
                const isToday = record.date === todayTokyo
                const isSundayOrHoliday =
                  record.weekday === 0 || !!holidaysQuery.data?.[record.date]
                const isSaturday = record.weekday === 6
                const rowClassName = isToday
                  ? 'bg-[#fef9c3]'
                  : isSundayOrHoliday
                    ? 'bg-[#fee2e2]'
                    : isSaturday
                      ? 'bg-[#e0f2fe]'
                      : undefined

                return (
                  <tr key={row.id} className={rowClassName}>
                    {row.getVisibleCells().map((cell) => (
                      <Td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </Section>
      )}
    </main>
  )
}
