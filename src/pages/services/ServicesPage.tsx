import { useState } from 'react'
import {
  Container,
  Title,
  Button,
  Stack,
  Group,
  Text,
  Center,
  Loader,
  Pagination,
  Chip,
  ActionIcon,
  Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconPlus, IconArrowLeft, IconTool } from '@tabler/icons-react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Service } from '../../types'
import { ServiceStatus, ServiceStatusLabel, ServiceStatusColor } from '../../types'
import { useServices } from '../../hooks/useServices'
import { ServiceCard } from '../../components/services/ServiceCard'
import { CreateServiceModal } from '../../components/services/CreateServiceModal'
import { DeleteServiceModal } from '../../components/services/DeleteServiceModal'
import { ServiceDetailDrawer } from '../../components/services/ServiceDetailDrawer'

const STATUS_FILTERS: { value: ServiceStatus | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  ...Object.values(ServiceStatus).map((s) => ({
    value: s,
    label: ServiceStatusLabel[s],
  })),
]

export function ServicesPage() {
  const { clientId = '' } = useParams<{ clientId: string }>()
  const navigate = useNavigate()

  const [statusFilter, setStatusFilter] = useState<ServiceStatus | ''>('')
  const [page, setPage] = useState(1)

  const [createOpened, createHandlers] = useDisclosure(false)
  const [deleteOpened, deleteHandlers] = useDisclosure(false)
  const [detailOpened, detailHandlers] = useDisclosure(false)

  // Store only the ID so the drawer always receives live data from React Query,
  // not a stale snapshot captured at click time.
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)

  const { data, isLoading, isError } = useServices(clientId, {
    status: statusFilter,
    page: page - 1,
    size: 20,
  })

  const selectedService = data?.content.find((s) => s.id === selectedServiceId) ?? null

  function handleOpen(service: Service) {
    setSelectedServiceId(service.id)
    detailHandlers.open()
  }

  function handleDelete(service: Service) {
    setServiceToDelete(service)
    deleteHandlers.open()
  }

  const clientName = data?.content[0]?.clientName

  return (
    <Container size="sm" py="md">
      <Group mb="md" gap="xs">
        <Tooltip label="Voltar para clientes">
          <ActionIcon variant="subtle" onClick={() => navigate('/clients')}>
            <IconArrowLeft size={18} />
          </ActionIcon>
        </Tooltip>
        <div style={{ flex: 1 }}>
          <Title order={2}>Serviços</Title>
          {clientName && (
            <Text size="sm" c="dimmed">
              {clientName}
            </Text>
          )}
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={createHandlers.open}>
          Novo serviço
        </Button>
      </Group>

      {/* Filter chips */}
      <Chip.Group
        value={statusFilter}
        onChange={(v) => {
          setStatusFilter(v as ServiceStatus | '')
          setPage(1)
        }}
      >
        <Group gap="xs" wrap="wrap" mb="md">
          {STATUS_FILTERS.map((f) => (
            <Chip
              key={f.value}
              value={f.value}
              size="sm"
              color={f.value ? ServiceStatusColor[f.value] : 'blue'}
              variant="light"
            >
              {f.label}
            </Chip>
          ))}
        </Group>
      </Chip.Group>

      {isLoading && (
        <Center py="xl">
          <Loader />
        </Center>
      )}

      {isError && (
        <Center py="xl">
          <Text c="red">Erro ao carregar serviços.</Text>
        </Center>
      )}

      {data && data.content.length === 0 && (
        <Center py="xl">
          <Stack align="center" gap="xs">
            <IconTool size={40} color="gray" />
            <Text c="dimmed">
              {statusFilter ? 'Nenhum serviço com este status.' : 'Nenhum serviço cadastrado.'}
            </Text>
            {!statusFilter && (
              <Button variant="light" onClick={createHandlers.open}>
                Criar primeiro serviço
              </Button>
            )}
          </Stack>
        </Center>
      )}

      {data && data.content.length > 0 && (
        <Stack gap="sm">
          {data.content.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onOpen={handleOpen}
              onDelete={handleDelete}
            />
          ))}

          {data.totalPages > 1 && (
            <Center mt="md">
              <Pagination total={data.totalPages} value={page} onChange={setPage} size="sm" />
            </Center>
          )}
        </Stack>
      )}

      <CreateServiceModal
        opened={createOpened}
        onClose={createHandlers.close}
        clientId={clientId}
      />

      <DeleteServiceModal
        opened={deleteOpened}
        onClose={deleteHandlers.close}
        clientId={clientId}
        service={serviceToDelete}
      />

      <ServiceDetailDrawer
        opened={detailOpened}
        onClose={detailHandlers.close}
        clientId={clientId}
        service={selectedService}
      />
    </Container>
  )
}
