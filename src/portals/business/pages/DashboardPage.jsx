import { useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Cell,
} from 'recharts'
import { Package, ShieldCheck, ShoppingBasket, Users, Pencil, Trash2 } from 'lucide-react'
import { Card, Avatar, Select } from '../../../shared/ui'
import { DataTable } from '../../../shared/DataTable'
import { money, number } from '../../../lib/format'
import {
  dashboardStats,
  topSellingProducts,
  salesTrend,
  employeesOverview,
} from '../data/mock'

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

function Gauge({ percent }) {
  // Simple SVG semi-circle gauge.
  const r = 90
  const c = Math.PI * r
  const dash = (percent / 100) * c
  return (
    <div className="relative flex flex-col items-center">
      <svg width="220" height="130" viewBox="0 0 220 130">
        <path d="M20 120 A90 90 0 0 1 200 120" fill="none" stroke="var(--color-line)" strokeWidth="14" strokeLinecap="round" />
        <path
          d="M20 120 A90 90 0 0 1 200 120"
          fill="none"
          stroke="var(--color-chart-1)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-1 text-center">
        <p className="text-2xl font-bold text-ink">{money(dashboardStats.todaysSale)}</p>
        <p className="text-xs text-muted">15/12/2023</p>
      </div>
      <div className="mt-1 flex w-full justify-between px-2 text-xs text-muted">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [topRange, setTopRange] = useState('Monthly')
  const [salesRange, setSalesRange] = useState('Weekly')

  const empColumns = [
    { key: 'id', header: 'Employee ID' },
    {
      key: 'name',
      header: 'Employee Name',
      render: (r) => (
        <span className="flex items-center gap-2">
          <Avatar name={r.name} size={28} src={r.avatar} />
          {r.name}
        </span>
      ),
    },
    { key: 'email', header: 'Email Address', render: (r) => <span className="text-muted">{r.email}</span> },
    { key: 'sales', header: 'Sales', render: (r) => money(r.sales) },
    { key: 'tips', header: 'Tips', render: (r) => money(r.tips) },
    {
      key: 'actions',
      header: 'Actions',
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
      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Package} value={number(dashboardStats.totalItems)} label="Total Items" />
        <StatCard icon={ShieldCheck} value={dashboardStats.activeItems} label="Active Items" />
        <StatCard icon={ShoppingBasket} value={dashboardStats.itemsSoldDone} sub={dashboardStats.itemsSold} label="Items Sold" />
        <StatCard icon={Users} value={number(dashboardStats.totalEmployees)} label="Total Employee" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ink">Top Selling Products</h3>
            <RangeSelect value={topRange} onChange={setTopRange} options={['Weekly', 'Monthly', 'Yearly']} />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topSellingProducts} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke="var(--color-grid)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--color-muted)' }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--color-muted)' }} tickFormatter={(v) => number(v, { compact: true })} />
              <Tooltip formatter={(v) => number(v)} cursor={{ fill: 'var(--color-canvas)' }} />
              <Bar dataKey="cap" fill="var(--color-line)" radius={[6, 6, 6, 6]} barSize={22} />
              <Bar dataKey="sold" fill="var(--color-chart-1)" radius={[6, 6, 6, 6]} barSize={22} xAxisId={0}>
                {topSellingProducts.map((_, i) => (
                  <Cell key={i} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ink">
              Total Sales <span className="text-sm font-normal text-muted">(till 8/1/2024)</span>
            </h3>
            <RangeSelect value={salesRange} onChange={setSalesRange} options={['Daily', 'Weekly', 'Monthly']} />
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

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-ink">Today's Sale</h3>
          <div className="flex flex-col items-center py-4">
            <Gauge percent={62} />
            <p className="mt-3 text-center text-sm text-muted">This sale is calculated till yesterday</p>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h3 className="mb-4 text-lg font-semibold text-ink">Employees Overview</h3>
          <DataTable columns={empColumns} rows={employeesOverview} rowKey={(r) => r.key} />
        </Card>
      </div>
    </div>
  )
}

function RangeSelect({ value, onChange, options }) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-32 bg-white text-sm">
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </Select>
  )
}
