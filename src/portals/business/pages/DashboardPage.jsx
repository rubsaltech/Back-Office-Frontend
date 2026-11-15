import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area, Cell,
} from 'recharts'
import { Wallet, ShoppingBasket, TrendingUp, Package, AlertTriangle } from 'lucide-react'
import { Card, Avatar } from '../../../shared/ui'
import { DataTable } from '../../../shared/DataTable'
import { Loading, ErrorState } from '../../../shared/States'
import { money, number } from '../../../lib/format'
import { useGetDashboardQuery } from '../../../store/api'

const STAT_TONES = {
  brand: 'bg-brand-50 text-brand-700',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
}

function StatCard({ icon: Icon, value, label, tone = 'brand', onClick }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Card className="p-0">
      <Tag onClick={onClick} className={`flex w-full items-center gap-4 p-5 text-left ${onClick ? 'cursor-pointer transition hover:bg-canvas' : ''}`}>
        <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${STAT_TONES[tone]}`}>
          <Icon className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-2xl font-bold text-ink">{value}</p>
          <p className="text-sm text-muted">{label}</p>
        </div>
      </Tag>
    </Card>
  )
}

function Gauge({ value, fraction, sub }) {
  const r = 90
  const c = Math.PI * r
  const filled = Math.max(0, Math.min(1, fraction || 0)) * c
  return (
    <div className="relative flex flex-col items-center">
      <svg width="220" height="130" viewBox="0 0 220 130">
        <path d="M20 120 A90 90 0 0 1 200 120" fill="none" stroke="var(--color-line)" strokeWidth="14" strokeLinecap="round" />
        <path d="M20 120 A90 90 0 0 1 200 120" fill="none" stroke="var(--color-chart-1)" strokeWidth="14" strokeLinecap="round" strokeDasharray={`${filled} ${c}`} />
      </svg>
      <div className="absolute inset-x-0 bottom-1 text-center">
        <p className="text-2xl font-bold text-ink">{money(value)}</p>
        {sub != null && <p className="text-xs text-muted">{sub}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useGetDashboardQuery()

  if (isLoading) return <Loading label={t('common.loading')} />
  if (isError) return <ErrorState error={error} />

  const topSelling = data.topSellingProducts ?? []
  const maxSold = Math.max(1, ...topSelling.map((p) => p.sold))
  const topData = topSelling.map((p) => ({ name: p.name, sold: p.sold, cap: maxSold }))

  const trend = (data.salesTrend ?? []).map((p) => ({ label: p.label, amount: Number(p.amount) || 0 }))
  const todays = Number(data.todaysSales) || 0
  const bestDay = Math.max(1, todays, ...trend.map((p) => p.amount))
  const todayFraction = todays / bestDay

  const empColumns = [
    {
      key: 'name', header: t('dashboard.employeeName'),
      render: (r) => <span className="flex items-center gap-2"><Avatar name={r.name} size={28} /> {r.name}</span>,
    },
    { key: 'email', header: t('dashboard.emailAddress'), render: (r) => <span className="text-muted">{r.email}</span> },
    { key: 'sales', header: t('dashboard.sales'), render: (r) => money(r.sales) },
    { key: 'tips', header: t('dashboard.tips'), render: (r) => money(r.tips) },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard icon={Wallet} value={money(todays)} label={t('dashboard.todaysSales')} />
        <StatCard icon={ShoppingBasket} value={number(data.todaysOrders)} label={t('dashboard.ordersToday')} />
        <StatCard icon={TrendingUp} value={money(data.totalSales)} label={t('dashboard.totalSalesAmount')} />
        <StatCard icon={Package} value={number(data.itemsSold)} label={t('dashboard.itemsSold')} />
        <StatCard
          icon={AlertTriangle}
          value={number(data.lowStockCount)}
          label={t('dashboard.lowStock')}
          tone={data.lowStockCount > 0 ? 'danger' : 'brand'}
          onClick={() => navigate('/business/inventory')}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-1 text-lg font-semibold text-ink">{t('dashboard.topSelling')}</h3>
          <p className="mb-4 text-xs text-muted">{t('dashboard.topSellingHint')}</p>
          {topData.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">{t('dashboard.noSalesYet')}</p>
          ) : (
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
          )}
        </Card>

        <Card className="p-6">
          <h3 className="mb-1 text-lg font-semibold text-ink">{t('dashboard.totalSales')}</h3>
          <p className="mb-4 text-xs text-muted">{t('dashboard.last7days')}</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--color-grid)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--color-muted)' }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--color-muted)' }} tickFormatter={(v) => number(v, { compact: true })} />
              <Tooltip formatter={(v) => money(v)} />
              <Area type="monotone" dataKey="amount" stroke="var(--color-chart-1)" strokeWidth={2.5} fill="url(#salesFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-ink">{t('dashboard.todaysSale')}</h3>
          <div className="flex flex-col items-center py-4">
            <Gauge value={todays} fraction={todayFraction} sub={t('dashboard.ordersCount', { count: data.todaysOrders })} />
            <p className="mt-3 text-center text-sm text-muted">{t('dashboard.todaysHint')}</p>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h3 className="mb-4 text-lg font-semibold text-ink">{t('dashboard.employeesOverview')}</h3>
          <DataTable columns={empColumns} rows={data.employeesOverview ?? []} rowKey={(r) => r.id}
            empty={t('dashboard.noEmployees')} />
        </Card>
      </div>
    </div>
  )
}
