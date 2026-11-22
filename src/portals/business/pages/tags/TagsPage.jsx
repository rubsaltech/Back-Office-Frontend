import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Printer } from 'lucide-react'
import { PageHeader } from '../../../../shared/Page'
import { Card, Button, Avatar } from '../../../../shared/ui'
import { DataTable, SearchInput, Pagination } from '../../../../shared/DataTable'
import { Loading, ErrorState } from '../../../../shared/States'
import { number } from '../../../../lib/format'
import { useGetProductsQuery } from '../../../../store/api'
import { PrintTagsModal } from './PrintTagsModal'

const SIZE = 10

export default function TagsPage() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [printFor, setPrintFor] = useState(null)
  const q = useGetProductsQuery({ query: query || undefined, page, size: SIZE })

  const columns = [
    { key: 'name', header: t('inventory.product'), render: (r) => <span className="flex items-center gap-3"><Avatar name={r.name} size={32} /><span className="font-medium">{r.name}</span></span> },
    { key: 'sku', header: t('inventory.sku'), render: (r) => <span className="text-muted">{r.sku}</span> },
    { key: 'variants', header: t('inventory.variants'), render: (r) => (r.hasVariants ? number((r.variants ?? []).length) : t('inventory.simple')) },
    { key: 'actions', header: t('common.actions'), render: (r) => <Button size="sm" variant="secondary" onClick={() => setPrintFor(r)}><Printer className="h-4 w-4" /> {t('tags.printTags')}</Button> },
  ]

  return (
    <div>
      <PageHeader title={t('tags.title')} subtitle={t('tags.subtitle')} />
      <Card className="p-5">
        <div className="mb-5">
          <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(0) }} placeholder={t('common.search')} className="w-full sm:w-72" />
        </div>
        {q.isLoading ? <Loading /> : q.isError ? <ErrorState error={q.error} /> : (
          <>
            <DataTable columns={columns} rows={q.data?.content ?? []} rowKey={(r) => r.id} empty={t('tags.empty')} />
            {(q.data?.totalPages ?? 0) > 1 && <Pagination page={page + 1} pageCount={q.data.totalPages} onChange={(p) => setPage(p - 1)} />}
          </>
        )}
      </Card>
      <PrintTagsModal open={!!printFor} product={printFor} onClose={() => setPrintFor(null)} />
    </div>
  )
}
