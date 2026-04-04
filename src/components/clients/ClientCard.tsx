import { Card, Text, Group, Badge, ActionIcon, Anchor, Stack, Menu } from '@mantine/core'
import {
  IconEdit,
  IconTrash,
  IconBrandWhatsapp,
  IconPhone,
  IconChevronRight,
  IconDots,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import type { Client } from '../../types'
import { formatPhone, whatsappUrl, telUrl } from '../../utils/formatters'

interface Props {
  client: Client
  onEdit: (client: Client) => void
  onDelete: (client: Client) => void
}

export function ClientCard({ client, onEdit, onDelete }: Props) {
  const navigate = useNavigate()

  return (
    <Card withBorder radius="md" padding="md">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs">
            <Text fw={600} truncate>
              {client.name}
            </Text>
            {client.activeServicesCount > 0 && (
              <Badge size="sm" variant="light" color="blue">
                {client.activeServicesCount} serviço ativo{client.activeServicesCount > 1 ? 's' : ''}
              </Badge>
            )}
            {client.isRecurring && (
              <Badge size="sm" variant="light" color="teal">
                Recorrente
              </Badge>
            )}
          </Group>

          <Group gap="xs">
            <Anchor href={telUrl(client.phone)} size="sm" c="dimmed">
              {formatPhone(client.phone)}
            </Anchor>
          </Group>

          {client.city && (
            <Text size="xs" c="dimmed">
              {client.city}
              {client.state ? ` — ${client.state}` : ''}
            </Text>
          )}
        </Stack>

        <Group gap="xs" wrap="nowrap">
          <ActionIcon
            component="a"
            href={whatsappUrl(client.phone)}
            target="_blank"
            rel="noopener noreferrer"
            variant="light"
            color="green"
            size="lg"
            aria-label="WhatsApp"
          >
            <IconBrandWhatsapp size={18} />
          </ActionIcon>

          <ActionIcon
            component="a"
            href={telUrl(client.phone)}
            variant="light"
            color="blue"
            size="lg"
            aria-label="Ligar"
          >
            <IconPhone size={18} />
          </ActionIcon>

          <Menu position="bottom-end" withinPortal>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" size="lg" aria-label="Mais opções">
                <IconDots size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconChevronRight size={14} />}
                onClick={() => navigate(`/clients/${client.id}/services`)}
              >
                Ver serviços
              </Menu.Item>
              <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => onEdit(client)}>
                Editar
              </Menu.Item>
              <Menu.Item
                leftSection={<IconTrash size={14} />}
                color="red"
                onClick={() => onDelete(client)}
              >
                Remover
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </Card>
  )
}
