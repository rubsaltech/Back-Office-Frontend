import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, Cell,
} from 'recharts'
import { Package, ShieldCheck, ShoppingBasket, Users, Pencil, Trash2 } from 'lucide-react'
import { Card, Avatar, Select } from '../../../shared/ui'
import { DataTable } from '../../../shared/DataTable'
import { Loading, ErrorState } from '../../../shared/States'
import { money, number } from '../../../lib/format'
import { useGetDashboardQuery } from '../../../store/api'
import { salesTrend } from '../data/mock' // sales trend chart is placeholder until the orders domain exists

function StatCard({ icon: Icon, value, sub, label }) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <Icon className="h-7 w-7" />
      </span>
      <div>
        <p className="text-2xl font-bold text-ink">
          {value}
          {sub != null && <span className="text-lg font-medium text-muted">/{sub}</span>}
        </p>
        <p className="text-sm text-muted">{label}</p>
      </div>
    </Card>
  )
}

function Gauge({ value }) {
  const r = 90
  const c = Math.PI * r
  return (
    <div className="relative flex flex-col items-center">
      <svg width="220" height="130" viewBox="0 0 220 130">
        <path d="M20 120 A90 90 0 0 1 200 120" fill="none" stroke="var(--color-line)" strokeWidth="14" strokeLinecap="round" />
        <path d="M20 120 A90 90 0 0 1 200 120" fill="none" stroke="var(--color-chart-1)" strokeWidth="14" strokeLinecap="round" strokeDasharray={`${0} ${c}`} />
      </svg>
      <div className="absolute inset-x-0 bottom-1 text-center">
        <p className="text-2xl font-bold text-ink">{money(value)}</p>
        <p className="text-xs text-muted">Today</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const [topRange, setTopRange] = useState('Monthly')
  const [salesRange, setSalesRange] = useState('Weekly')
  const { data, isLoading, isError, error } = useGetDashboardQuery()

  if (isLoading) return <Loading label={t('common.loading')} />
  if (isError) return <ErrorState error={error} />

  const maxSold = Math.max(1, ...(data.topSellingProducts.map((p) => p.sold)))
  const topData = data.topSellingProducts.map((p) => ({ name: p.name, sold: p.sold, cap: maxSold }))

  const empColumns = [
    { key: 'id', header: t('dashboard.employeeId') },
    {
      key: 'name', header: t('dashboard.employeeName'),
      render: (r) => <span className="flex items-center gap-2"><Avatar name={r.name} size={28} /> {r.name}</span>,
    },
    { key: 'email', header: t('dashboard.emailAddress'), render: (r) => <span className="text-muted">{r.email}</span> },
    { key: 'sales', header: t('dashboard.sales'), render: (r) => money(r.sales) },
    { key: 'tips', header: t('dashboard.tips'), render: (r) => money(r.tips) },
    {
      key: 'actions', header: t('common.actions'),
      render: () => (
        <span className="flex items-center gap-3">
          <button className="text-brand-600 hover:text-brand-800"><Pencil className="h-4 w-4" /></button>
          <button className="text-danger hover:text-danger-strong"><Trash2 className="h-4 w-4" /></button>
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Package} value={number(data.totalItems)} label={t('dashboard.totalItems')} />
        <StatCard icon={ShieldCheck} value={number(data.activeItems)} label={t('dashboard.activeItems')} />
        <StatCard icon={ShoppingBasket} value={number(data.itemsSold)} label={t('dashboard.itemsSold')} />
        <StatCard icon={Users} value={number(data.totalEmployees)} label={t('dashboard.totalEmployee')} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ink">{t('dashboard.topSelling')}</h3>
            <RangeSelect value={topRange} onChange={setTopRange} options={[t('dashboard.ranges.weekly'), t('dashboard.ranges.monthly'), t('dashboard.ranges.yearly')]} />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topData} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke="var(--color-grid)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--color-muted)' }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--color-muted)' }} tickFormatter={(v) => number(v, { compact: true })} />
              <Tooltip formatter={(v) => number(v)} cursor={{ fill: 'var(--color-canvas)' }} />
              <Bar dataKey="cap" fill="var(--color-line)" radius={[6, 6, 6, 6]} barSize={22} />
              <Bar dataKey="sold" fill="var(--color-chart-1)" radius={[6, 6, 6, 6]} barSize={22}>
                {topData.map((_, i) => <Cell key={i} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ink">{t('dashboard.totalSales')}</h3>
            <RangeSelect value={salesRange} onChange={setSalesRange} options={[t('dashboard.ranges.daily'), t('dashboard.ranges.weekly'), t('dashboard.ranges.monthly')]} />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={salesTrend}>
              <CartesianGrid vertical={false} stroke="var(--color-grid)" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--color-muted)' }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--color-muted)' }} tickFormatter={(v) => number(v, { compact: true })} />
              <Tooltip formatter={(v) => number(v)} />
              <Line type="monotone" dataKey="a" stroke="var(--color-chart-1)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="b" stroke="var(--color-chart-2)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="c" stroke="var(--color-chart-3)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-ink">{t('dashboard.todaysSale')}</h3>
          <div className="flex flex-col items-center py-4">
            <Gauge value={0} />
            <p className="mt-3 text-center text-sm text-muted">{t('dashboard.todaysHint')}</p>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h3 className="mb-4 text-lg font-semibold text-ink">{t('dashboard.employeesOverview')}</h3>
          <DataTable columns={empColumns} rows={data.employeesOverview} rowKey={(r) => r.id}
            empty={t('dashboard.noEmployees')} />
        </Card>
      </div>
    </div>
  )
}

function RangeSelect({ value, onChange, options }) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-32 bg-white text-sm">
      {options.map((o) => <option key={o}>{o}</option>)}
    </Select>
  )
}
