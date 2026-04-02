import { Card, Text, Group, Badge, ActionIcon, Stack, Menu, Anchor } from '@mantine/core'
import { IconEdit, IconTrash, IconDots, IconCurrencyReal } from '@tabler/icons-react'
import type { Service } from '../../types'
import { ServiceStatusLabel, ServiceStatusColor } from '../../types'
import { formatCurrency, formatDate } from '../../utils/formatters'

interface Props {
  service: Service
  onOpen: (service: Service) => void
  onDelete: (service: Service) => void
}

function statusDateLine(service: Service): string | null {
  switch (service.status) {
    case 'TECHNICAL_VISIT':
      return service.visitDate ? `Visita: ${formatDate(service.visitDate)}` : null
    case 'EXECUTION_SCHEDULED':
      return service.scheduledAt ? `Agendado: ${formatDate(service.scheduledAt)}` : null
    case 'EXECUTION_COMPLETED':
      return service.completedAt ? `Concluído: ${formatDate(service.completedAt)}` : null
    case 'PAID':
      return service.paidAt ? `Pago: ${formatDate(service.paidAt)}` : null
    default:
      return null
  }
}

export function ServiceCard({ service, onOpen, onDelete }: Props) {
  const dateLine = statusDateLine(service)

  return (
    <Card withBorder radius="md" padding="md" style={{ cursor: 'pointer' }} onClick={() => onOpen(service)}>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Text fw={600} lineClamp={2}>
            {service.description}
          </Text>

          <Group gap="xs">
            <Badge
              size="sm"
              variant="light"
              color={ServiceStatusColor[service.status]}
            >
              {ServiceStatusLabel[service.status]}
            </Badge>

            {service.quoteValue != null && (
              <Group gap={4}>
                <IconCurrencyReal size={13} />
                <Text size="xs" c="dimmed">
                  {formatCurrency(service.quoteValue)}
                </Text>
              </Group>
            )}
          </Group>

          {dateLine && (
            <Text size="xs" c="dimmed">
              {dateLine}
            </Text>
          )}

          {service.nfIssued && (
            <Anchor
              size="xs"
              href={service.nfFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              Ver NF
            </Anchor>
          )}
        </Stack>

        <Menu position="bottom-end" withinPortal>
          <Menu.Target>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              aria-label="Mais opções"
              onClick={(e) => e.stopPropagation()}
            >
              <IconDots size={18} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconEdit size={14} />}
              onClick={(e) => {
                e.stopPropagation()
                onOpen(service)
              }}
            >
              Abrir detalhes
            </Menu.Item>
            <Menu.Item
              leftSection={<IconTrash size={14} />}
              color="red"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(service)
              }}
            >
              Remover
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Card>
  )
}
