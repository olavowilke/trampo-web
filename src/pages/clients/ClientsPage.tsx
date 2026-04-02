import { useState } from 'react'
import {
  Container,
  Title,
  Button,
  TextInput,
  Stack,
  Group,
  Text,
  Center,
  Loader,
  Pagination,
} from '@mantine/core'
import { useDebouncedValue, useDisclosure } from '@mantine/hooks'
import { IconSearch, IconPlus, IconUsers } from '@tabler/icons-react'
import type { Client } from '../../types'
import { useClients } from '../../hooks/useClients'
import { ClientCard } from '../../components/clients/ClientCard'
import { ClientFormDrawer } from '../../components/clients/ClientFormDrawer'
import { DeleteClientModal } from '../../components/clients/DeleteClientModal'
import { useAuth } from '../../contexts/AuthContext'

export function ClientsPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 400)
  const [page, setPage] = useState(1)

  const [drawerOpened, drawerHandlers] = useDisclosure(false)
  const [deleteOpened, deleteHandlers] = useDisclosure(false)

  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)

  const { data, isLoading, isError } = useClients({
    search: debouncedSearch,
    page: page - 1,
    size: 20,
  })

  function handleEdit(client: Client) {
    setSelectedClient(client)
    drawerHandlers.open()
  }

  function handleDelete(client: Client) {
    setClientToDelete(client)
    deleteHandlers.open()
  }

  function handleNewClient() {
    setSelectedClient(null)
    drawerHandlers.open()
  }

  function handleCloseDrawer() {
    drawerHandlers.close()
    setSelectedClient(null)
  }

  return (
    <Container size="sm" py="md">
      <Group justify="space-between" mb="md">
        <div>
          <Title order={2}>Clientes</Title>
          {user && (
            <Text size="sm" c="dimmed">
              {user.businessName}
            </Text>
          )}
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={handleNewClient}>
          Novo cliente
        </Button>
      </Group>

      <TextInput
        placeholder="Buscar por nome ou telefone..."
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => {
          setSearch(e.currentTarget.value)
          setPage(1)
        }}
        mb="md"
      />

      {isLoading && (
        <Center py="xl">
          <Loader />
        </Center>
      )}

      {isError && (
        <Center py="xl">
          <Text c="red">Erro ao carregar clientes.</Text>
        </Center>
      )}

      {data && data.content.length === 0 && (
        <Center py="xl">
          <Stack align="center" gap="xs">
            <IconUsers size={40} color="gray" />
            <Text c="dimmed">
              {debouncedSearch ? 'Nenhum cliente encontrado.' : 'Você ainda não tem clientes.'}
            </Text>
            {!debouncedSearch && (
              <Button variant="light" onClick={handleNewClient}>
                Adicionar primeiro cliente
              </Button>
            )}
          </Stack>
        </Center>
      )}

      {data && data.content.length > 0 && (
        <Stack gap="sm">
          {data.content.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}

          {data.totalPages > 1 && (
            <Center mt="md">
              <Pagination
                total={data.totalPages}
                value={page}
                onChange={setPage}
                size="sm"
              />
            </Center>
          )}
        </Stack>
      )}

      <ClientFormDrawer
        opened={drawerOpened}
        onClose={handleCloseDrawer}
        client={selectedClient}
      />

      <DeleteClientModal
        opened={deleteOpened}
        onClose={deleteHandlers.close}
        client={clientToDelete}
      />
    </Container>
  )
}
