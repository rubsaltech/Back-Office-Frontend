import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { DollarSign, CreditCard, Truck } from 'lucide-react'
import { PosModal } from './PosOverlay'
import { Button, Field, Select } from '../../../../shared/ui'
import { cn } from '../../../../lib/cn'

export function PaymentModal({ open, onClose, onSelect, devices = [], allowCod }) {
  const { t } = useTranslation()
  const [method, setMethod] = useState('CASH')
  const [deviceId, setDeviceId] = useState('')

  useEffect(() => {
    if (open) {
      setMethod('CASH')
      setDeviceId(devices[0]?.id != null ? String(devices[0].id) : '')
    }
  }, [open, devices])

  const methods = [
    { value: 'CASH', label: t('pos.payment.cash'), icon: DollarSign },
    { value: 'CARD', label: t('pos.payment.card'), icon: CreditCard },
    ...(allowCod ? [{ value: 'COD', label: t('pos.payment.cod'), icon: Truck }] : []),
  ]

  const submit = () => {
    onSelect({ method, deviceId: method === 'CARD' && deviceId ? Number(deviceId) : null })
  }

  return (
    <PosModal
      open={open}
      onClose={onClose}
      title={t('pos.payment.title')}
      size="md"
      footer={<Button onClick={submit} disabled={method === 'CARD' && !deviceId}>{t('pos.payment.select')}</Button>}
    >
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium text-ink"><span className="text-danger">*</span>{t('pos.payment.method')}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {methods.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setMethod(value)}
                className={cn('flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium',
                  method === value ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-line text-ink hover:bg-canvas')}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        </div>

        {method === 'CARD' && (
          <Field label={t('pos.payment.deviceSerial')} required>
            {devices.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted">{t('pos.payment.noDevices')}</p>
            ) : (
              <Select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
                <option value="">{t('pos.payment.selectDevice')}</option>
                {devices.map((d) => <option key={d.id} value={d.id}>{d.serialNumber}{d.label ? ` — ${d.label}` : ''}</option>)}
              </Select>
            )}
          </Field>
        )}
      </div>
    </PosModal>
  )
}
