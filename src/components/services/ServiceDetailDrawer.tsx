import { useState, useEffect } from 'react'
import {
  Drawer,
  Stack,
  Text,
  Button,
  Group,
  NumberInput,
  Textarea,
  Select,
  Divider,
  Badge,
  Stepper,
} from '@mantine/core'
import { DatePickerInput, TimeInput } from '@mantine/dates'
import { IconArrowRight, IconArrowLeft } from '@tabler/icons-react'
import dayjs from 'dayjs'
import type { Service } from '../../types'
import {
  ServiceStatus,
  ServiceStatusLabel,
  ServiceStatusColor,
  SERVICE_STATUS_ORDER,
  PaymentMethod,
  PaymentMethodLabel,
} from '../../types'
import { useUpdateServiceStatus, type UpdateStatusData } from '../../hooks/useServices'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { notifications } from '@mantine/notifications'
import { NfUploadSection } from './NfUploadSection'

interface Props {
  opened: boolean
  onClose: () => void
  clientId: string
  service: Service | null
}

function statusIndex(status: ServiceStatus): number {
  return SERVICE_STATUS_ORDER.indexOf(status)
}

export function ServiceDetailDrawer({ opened, onClose, clientId, service }: Props) {
  const updateStatus = useUpdateServiceStatus(clientId)

  const [quoteValue, setQuoteValue] = useState<number | string>('')
  const [quoteNotes, setQuoteNotes] = useState('')

  // visitDate is LocalDateTime — store date and time separately for the TimeInput
  const [visitDatePart, setVisitDatePart] = useState<Date | null>(null)
  const [visitTimePart, setVisitTimePart] = useState('')
  const [visitNotes, setVisitNotes] = useState('')

  // scheduledAt is LocalDateTime — same split
  const [scheduledAtDatePart, setScheduledAtDatePart] = useState<Date | null>(null)
  const [scheduledAtTimePart, setScheduledAtTimePart] = useState('')

  // completedAt and paidAt are LocalDate (date-only) on the backend
  const [completedAt, setCompletedAt] = useState<Date | null>(null)
  const [completionNotes, setCompletionNotes] = useState('')
  const [paidAt, setPaidAt] = useState<Date | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)

  // Re-populate fields whenever the drawer opens or the service changes.
  // `opened` is intentionally in deps: Mantine Drawer keeps children mounted
  // (not unmounted on close), so without it the effect would not re-fire when
  // the drawer re-opens with the same service reference.
  useEffect(() => {
    if (!service || !opened) return

    setQuoteValue(service.quoteValue ?? '')
    setQuoteNotes(service.quoteNotes ?? '')
    setVisitNotes(service.visitNotes ?? '')
    setCompletionNotes(service.completionNotes ?? '')
    setPaymentMethod(service.paymentMethod ?? null)

    if (service.visitDate) {
      const d = dayjs(service.visitDate)
      setVisitDatePart(d.toDate())
      setVisitTimePart(d.format('HH:mm'))
    } else {
      setVisitDatePart(null)
      setVisitTimePart('')
    }

    if (service.scheduledAt) {
      const d = dayjs(service.scheduledAt)
      setScheduledAtDatePart(d.toDate())
      setScheduledAtTimePart(d.format('HH:mm'))
    } else {
      setScheduledAtDatePart(null)
      setScheduledAtTimePart('')
    }

    setCompletedAt(service.completedAt ? dayjs(service.completedAt).toDate() : null)
    setPaidAt(service.paidAt ? dayjs(service.paidAt).toDate() : null)
  }, [service, opened])

  if (!service) return null

  const currentIdx = statusIndex(service.status)
  const isTerminal = service.status === ServiceStatus.PAID
  const canAdvance = !isTerminal
  const canRetreat = currentIdx > 0 && !isTerminal

  function buildPayload(targetStatus: ServiceStatus): UpdateStatusData {
    const visitDateISO = visitDatePart
      ? `${dayjs(visitDatePart).format('YYYY-MM-DD')}T${visitTimePart || '00:00'}:00`
      : undefined

    const scheduledAtISO = scheduledAtDatePart
      ? `${dayjs(scheduledAtDatePart).format('YYYY-MM-DD')}T${scheduledAtTimePart || '00:00'}:00`
      : undefined

    return {
      targetStatus,
      ...(typeof quoteValue === 'number' ? { quoteValue } : {}),
      ...(quoteNotes ? { quoteNotes } : {}),
      ...(visitDateISO ? { visitDate: visitDateISO } : {}),
      ...(visitNotes ? { visitNotes } : {}),
      ...(scheduledAtISO ? { scheduledAt: scheduledAtISO } : {}),
      ...(completedAt ? { completedAt: dayjs(completedAt).format('YYYY-MM-DD') } : {}),
      ...(completionNotes ? { completionNotes } : {}),
      ...(paidAt ? { paidAt: dayjs(paidAt).format('YYYY-MM-DD') } : {}),
      ...(paymentMethod ? { paymentMethod } : {}),
    }
  }

  function handleAdvance() {
    const nextStatus = SERVICE_STATUS_ORDER[currentIdx + 1]
    if (!nextStatus) return

    if (nextStatus === ServiceStatus.QUOTE_PENDING && !visitDatePart) {
      notifications.show({ title: 'Campo obrigatório', message: 'Informe a data da visita', color: 'orange' })
      return
    }
    if (nextStatus === ServiceStatus.QUOTE_APPROVED && (typeof quoteValue !== 'number' || quoteValue <= 0)) {
      notifications.show({ title: 'Campo obrigatório', message: 'Informe o valor do orçamento', color: 'orange' })
      return
    }
    if (nextStatus === ServiceStatus.EXECUTION_SCHEDULED && !scheduledAtDatePart) {
      notifications.show({ title: 'Campo obrigatório', message: 'Informe a data agendada', color: 'orange' })
      return
    }
    if (nextStatus === ServiceStatus.EXECUTION_COMPLETED && !completedAt) {
      notifications.show({ title: 'Campo obrigatório', message: 'Informe a data de conclusão', color: 'orange' })
      return
    }
    if (nextStatus === ServiceStatus.PAID && (!paidAt || !paymentMethod)) {
      notifications.show({ title: 'Campos obrigatórios', message: 'Informe a data e o método de pagamento', color: 'orange' })
      return
    }

    updateStatus.mutate(
      { serviceId: service!.id, data: buildPayload(nextStatus) },
      {
        onSuccess: () => {
          notifications.show({
            title: 'Status atualizado',
            message: `Avançado para ${ServiceStatusLabel[nextStatus]}`,
            color: 'green',
          })
          onClose()
        },
      },
    )
  }

  function handleRetreat() {
    const prevStatus = SERVICE_STATUS_ORDER[currentIdx - 1]
    if (!prevStatus) return

    updateStatus.mutate(
      { serviceId: service!.id, data: buildPayload(prevStatus) },
      {
        onSuccess: () => {
          notifications.show({
            title: 'Status atualizado',
            message: `Retornado para ${ServiceStatusLabel[prevStatus]}`,
            color: 'blue',
          })
          onClose()
        },
      },
    )
  }

  const paymentOptions = Object.values(PaymentMethod).map((m) => ({
    value: m,
    label: PaymentMethodLabel[m],
  }))

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="md"
      title={<Text fw={700} size="lg" component="span">Detalhes do serviço</Text>}
    >
      <Stack gap="md">
        {/* Description */}
        <Text fw={600}>{service.description}</Text>
        <Badge color={ServiceStatusColor[service.status]} variant="light" size="lg">
          {ServiceStatusLabel[service.status]}
        </Badge>

        {/* Stepper visual */}
        <Stepper
          active={currentIdx}
          size="xs"
          orientation="vertical"
          styles={{ stepLabel: { fontSize: 12 } }}
        >
          {SERVICE_STATUS_ORDER.map((s) => (
            <Stepper.Step
              key={s}
              label={ServiceStatusLabel[s]}
              color={ServiceStatusColor[s]}
            />
          ))}
        </Stepper>

        <Divider />

        <Text fw={600}>Dados do serviço</Text>

        {/* Visita Técnica fields — always visible (idx >= 0) */}
        {currentIdx >= 0 && (
          <>
            <Group grow align="flex-end">
              <DatePickerInput
                label="Data da visita"
                placeholder="Selecione"
                value={visitDatePart}
                onChange={setVisitDatePart}
                clearable
              />
              <TimeInput
                label="Hora da visita"
                value={visitTimePart}
                onChange={(e) => setVisitTimePart(e.currentTarget.value)}
                disabled={!visitDatePart}
                style={{ maxWidth: 140 }}
              />
            </Group>
            <Textarea
              label="Notas da visita"
              placeholder="Observações (opcional)"
              autosize
              minRows={2}
              value={visitNotes}
              onChange={(e) => setVisitNotes(e.currentTarget.value)}
            />
          </>
        )}

        {/* Orçamento fields — from QUOTE_PENDING (idx >= 1) */}
        {currentIdx >= 1 && (
          <>
            <NumberInput
              label="Valor do orçamento (R$)"
              placeholder="0,00"
              min={0}
              decimalScale={2}
              decimalSeparator=","
              thousandSeparator="."
              value={quoteValue}
              onChange={setQuoteValue}
            />
            <Textarea
              label="Notas do orçamento"
              placeholder="Detalhes (opcional)"
              autosize
              minRows={2}
              value={quoteNotes}
              onChange={(e) => setQuoteNotes(e.currentTarget.value)}
            />
          </>
        )}

        {/* Agendamento fields — from QUOTE_APPROVED (idx >= 2) so the user
            can fill the date before advancing to EXECUTION_SCHEDULED */}
        {currentIdx >= 2 && (
          <Group grow align="flex-end">
            <DatePickerInput
              label="Data agendada"
              placeholder="Selecione"
              value={scheduledAtDatePart}
              onChange={setScheduledAtDatePart}
              clearable
            />
            <TimeInput
              label="Hora agendada"
              value={scheduledAtTimePart}
              onChange={(e) => setScheduledAtTimePart(e.currentTarget.value)}
              disabled={!scheduledAtDatePart}
              style={{ maxWidth: 140 }}
            />
          </Group>
        )}

        {/* Conclusão fields — from EXECUTION_SCHEDULED (idx >= 3) */}
        {currentIdx >= 3 && (
          <>
            <DatePickerInput
              label="Data de conclusão"
              placeholder="Selecione"
              value={completedAt}
              onChange={setCompletedAt}
              clearable
            />
            <Textarea
              label="Notas de conclusão"
              placeholder="Observações (opcional)"
              autosize
              minRows={2}
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.currentTarget.value)}
            />
          </>
        )}

        {/* Pagamento fields — from EXECUTION_COMPLETED (idx >= 4) */}
        {currentIdx >= 4 && (
          <>
            <DatePickerInput
              label="Data do pagamento"
              placeholder="Selecione"
              value={paidAt}
              onChange={setPaidAt}
              clearable
            />
            <Select
              label="Método de pagamento"
              placeholder="Selecione"
              data={paymentOptions}
              value={paymentMethod}
              onChange={setPaymentMethod}
            />
          </>
        )}

        {/* Summary for paid */}
        {isTerminal && service.quoteValue != null && (
          <Text size="sm" c="green" fw={600}>
            Total recebido: {formatCurrency(service.quoteValue)}
          </Text>
        )}
        {service.paidAt && (
          <Text size="xs" c="dimmed">
            Pago em: {formatDateTime(service.paidAt)}
          </Text>
        )}

        {/* NF Upload — only from EXECUTION_COMPLETED (idx >= 4) */}
        {currentIdx >= 4 && (
          <>
            <Divider label="Nota Fiscal" labelPosition="left" />
            <NfUploadSection clientId={clientId} service={service} />
          </>
        )}

        <Divider />

        {/* Actions */}
        <Group justify="space-between">
          <Button
            variant="light"
            color="gray"
            leftSection={<IconArrowLeft size={16} />}
            onClick={handleRetreat}
            disabled={!canRetreat}
            loading={updateStatus.isPending}
          >
            Voltar
          </Button>

          <Button
            rightSection={<IconArrowRight size={16} />}
            onClick={handleAdvance}
            disabled={!canAdvance}
            loading={updateStatus.isPending}
          >
            {canAdvance
              ? `Avançar para ${ServiceStatusLabel[SERVICE_STATUS_ORDER[currentIdx + 1]]}`
              : 'Concluído'}
          </Button>
        </Group>
      </Stack>
    </Drawer>
  )
}
