import { useState, useEffect } from 'react'
import {
  Drawer,
  Title,
  Stepper,
  Stack,
  Text,
  Button,
  Group,
  NumberInput,
  Textarea,
  Select,
  Divider,
  Badge,
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { IconArrowRight, IconArrowLeft } from '@tabler/icons-react'
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

  // Local form state for transition fields
  const [quoteValue, setQuoteValue] = useState<number | string>('')
  const [quoteNotes, setQuoteNotes] = useState('')
  const [visitDate, setVisitDate] = useState<Date | null>(null)
  const [visitNotes, setVisitNotes] = useState('')
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null)
  const [completedAt, setCompletedAt] = useState<Date | null>(null)
  const [completionNotes, setCompletionNotes] = useState('')
  const [paidAt, setPaidAt] = useState<Date | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)

  // Reset fields when service changes
  useEffect(() => {
    if (!service) return
    setQuoteValue(service.quoteValue ?? '')
    setQuoteNotes(service.quoteNotes ?? '')
    setVisitDate(service.visitDate ? new Date(service.visitDate) : null)
    setVisitNotes(service.visitNotes ?? '')
    setScheduledAt(service.scheduledAt ? new Date(service.scheduledAt) : null)
    setCompletedAt(service.completedAt ? new Date(service.completedAt) : null)
    setCompletionNotes(service.completionNotes ?? '')
    setPaidAt(service.paidAt ? new Date(service.paidAt) : null)
    setPaymentMethod(service.paymentMethod ?? null)
  }, [service])

  if (!service) return null

  const currentIdx = statusIndex(service.status)
  const isTerminal = service.status === ServiceStatus.PAID
  const canAdvance = !isTerminal
  const canRetreat = currentIdx > 0 && !isTerminal

  function buildPayload(targetStatus: ServiceStatus): UpdateStatusData {
    return {
      targetStatus,
      ...(typeof quoteValue === 'number' ? { quoteValue } : {}),
      ...(quoteNotes ? { quoteNotes } : {}),
      ...(visitDate ? { visitDate: visitDate.toISOString() } : {}),
      ...(visitNotes ? { visitNotes } : {}),
      ...(scheduledAt ? { scheduledAt: scheduledAt.toISOString() } : {}),
      ...(completedAt ? { completedAt: completedAt.toISOString() } : {}),
      ...(completionNotes ? { completionNotes } : {}),
      ...(paidAt ? { paidAt: paidAt.toISOString() } : {}),
      ...(paymentMethod ? { paymentMethod } : {}),
    }
  }

  function handleAdvance() {
    const nextStatus = SERVICE_STATUS_ORDER[currentIdx + 1]
    if (!nextStatus) return

    // Validate required fields
    if (nextStatus === ServiceStatus.QUOTE_PENDING && !visitDate) {
      notifications.show({ title: 'Campo obrigatório', message: 'Informe a data da visita', color: 'orange' })
      return
    }
    if (nextStatus === ServiceStatus.QUOTE_APPROVED && (typeof quoteValue !== 'number' || quoteValue <= 0)) {
      notifications.show({ title: 'Campo obrigatório', message: 'Informe o valor do orçamento', color: 'orange' })
      return
    }
    if (nextStatus === ServiceStatus.EXECUTION_SCHEDULED && !scheduledAt) {
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
      title={<Title order={4}>Detalhes do serviço</Title>}
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

        {/* Context fields based on current and next status */}
        <Title order={5}>Dados do serviço</Title>

        {/* Visita Técnica fields */}
        {currentIdx >= 0 && (
          <>
            <DateTimePicker
              label="Data da visita"
              placeholder="Selecione"
              value={visitDate}
              onChange={setVisitDate}
              clearable
            />
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

        {/* Orçamento fields */}
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

        {/* Agendamento field */}
        {currentIdx >= 3 && (
          <DateTimePicker
            label="Data agendada"
            placeholder="Selecione"
            value={scheduledAt}
            onChange={setScheduledAt}
            clearable
          />
        )}

        {/* Conclusão fields */}
        {currentIdx >= 4 && (
          <>
            <DateTimePicker
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

        {/* Pagamento fields */}
        {currentIdx >= 5 && (
          <>
            <DateTimePicker
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

        {/* NF Upload — disponível em qualquer status */}
        <Divider label="Nota Fiscal" labelPosition="left" />
        <NfUploadSection clientId={clientId} service={service} />

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
