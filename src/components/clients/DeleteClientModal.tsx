import { Modal, Text, Button, Group, Title } from '@mantine/core'
import { useDeleteClient } from '../../hooks/useClients'
import type { Client } from '../../types'

interface Props {
  opened: boolean
  onClose: () => void
  client: Client | null
}

export function DeleteClientModal({ opened, onClose, client }: Props) {
  const deleteClient = useDeleteClient()

  function handleConfirm() {
    if (!client) return
    deleteClient.mutate(client.id, { onSuccess: onClose })
  }

  return (
    <Modal opened={opened} onClose={onClose} title={<Title order={4}>Remover cliente</Title>} centered>
      <Text>
        Deseja remover <strong>{client?.name}</strong>? Esta ação não pode ser desfeita.
      </Text>
      {(client?.activeServicesCount ?? 0) > 0 && (
        <Text c="red" size="sm" mt="xs">
          Este cliente possui {client?.activeServicesCount} serviço(s) ativo(s).
        </Text>
      )}
      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={onClose} disabled={deleteClient.isPending}>
          Cancelar
        </Button>
        <Button color="red" loading={deleteClient.isPending} onClick={handleConfirm}>
          Remover
        </Button>
      </Group>
    </Modal>
  )
}
