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
} from '@mantine/core'
import { DateTimePicker, DatePickerInput } from '@mantine/dates'
import { IconDeviceFloppy } from '@tabler/icons-react'
import dayjs from 'dayjs'
import type { Service } from '../../types'
import {
  ServiceStatus,
  ServiceStatusLabel,
  SERVICE_STATUS_ORDER,
  PaymentMethod,
  PaymentMethodLabel,
} from '../../types'
import { useUpdateService, type UpdateServiceData } from '../../hooks/useServices'
import { notifications } from '@mantine/notifications'
import { DocumentsSection } from './DocumentsSection'

interface Props {
  opened: boolean
  onClose: () => void
  clientId: string
  service: Service | null
}

export function ServiceDetailDrawer({ opened, onClose, clientId, service }: Props) {
  const updateService = useUpdateService(clientId)

  const [status, setStatus] = useState<ServiceStatus>(ServiceStatus.TECHNICAL_VISIT)
  const [quoteValue, setQuoteValue] = useState<number | string>('')
  const [quoteNotes, setQuoteNotes] = useState('')

  // LocalDateTime no backend — DateTimePicker no front
  const [visitDate, setVisitDate] = useState<Date | null>(null)
  const [visitNotes, setVisitNotes] = useState('')
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null)

  // LocalDate no backend — DatePickerInput no front
  const [completedAt, setCompletedAt] = useState<Date | null>(null)
  const [completionNotes, setCompletionNotes] = useState('')
  const [paidAt, setPaidAt] = useState<Date | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)

  useEffect(() => {
    if (!service || !opened) return
    setStatus(service.status)
    setQuoteValue(service.quoteValue ?? '')
    setQuoteNotes(service.quoteNotes ?? '')
    setVisitDate(service.visitDate ? dayjs(service.visitDate).toDate() : null)
    setVisitNotes(service.visitNotes ?? '')
    setScheduledAt(service.scheduledAt ? dayjs(service.scheduledAt).toDate() : null)
    setCompletedAt(service.completedAt ? dayjs(service.completedAt).toDate() : null)
    setCompletionNotes(service.completionNotes ?? '')
    setPaidAt(service.paidAt ? dayjs(service.paidAt).toDate() : null)
    setPaymentMethod(service.paymentMethod ?? null)
  }, [service, opened])

  if (!service) return null

  function buildPayload(): UpdateServiceData {
    return {
      status,
      ...(typeof quoteValue === 'number' ? { quoteValue } : {}),
      ...(quoteNotes ? { quoteNotes } : {}),
      ...(visitDate ? { visitDate: dayjs(visitDate).format('YYYY-MM-DDTHH:mm:ss') } : {}),
      ...(visitNotes ? { visitNotes } : {}),
      ...(scheduledAt
        ? { scheduledAt: dayjs(scheduledAt).format('YYYY-MM-DDTHH:mm:ss') }
        : {}),
      ...(completedAt ? { completedAt: dayjs(completedAt).format('YYYY-MM-DD') } : {}),
      ...(completionNotes ? { completionNotes } : {}),
      ...(paidAt ? { paidAt: dayjs(paidAt).format('YYYY-MM-DD') } : {}),
      ...(paymentMethod ? { paymentMethod } : {}),
    }
  }

  function handleSave() {
    updateService.mutate(
      { serviceId: service!.id, data: buildPayload() },
      {
        onSuccess: () => {
          notifications.show({
            title: 'Serviço atualizado',
            message: '',
            color: 'green',
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

  const statusOptions = SERVICE_STATUS_ORDER.map((s) => ({
    value: s,
    label: ServiceStatusLabel[s],
  }))

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="md"
      title={
        <Text fw={700} size="lg" component="span">
          Detalhes do serviço
        </Text>
      }
    >
      <Stack gap="md">
        <Text fw={600}>{service.description}</Text>

        <Select
          label="Status"
          value={status}
          onChange={(v) => v && setStatus(v as ServiceStatus)}
          data={statusOptions}
          allowDeselect={false}
        />

        <Divider />
        <Text fw={600}>Dados do serviço</Text>

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

        <DateTimePicker
          label="Data agendada"
          placeholder="Selecione"
          value={scheduledAt}
          onChange={setScheduledAt}
          clearable
        />

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
          clearable
        />

        <Divider />
        <DocumentsSection clientId={clientId} serviceId={service.id} />

        <Divider />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={handleSave}
            loading={updateService.isPending}
          >
            Salvar
          </Button>
        </Group>
      </Stack>
    </Drawer>
  )
}
