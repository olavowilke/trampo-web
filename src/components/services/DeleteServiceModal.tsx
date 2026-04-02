import { Modal, Text, Button, Group, Title } from '@mantine/core'
import { useDeleteService } from '../../hooks/useServices'
import type { Service } from '../../types'

interface Props {
  opened: boolean
  onClose: () => void
  clientId: string
  service: Service | null
}

export function DeleteServiceModal({ opened, onClose, clientId, service }: Props) {
  const deleteService = useDeleteService(clientId)

  function handleConfirm() {
    if (!service) return
    deleteService.mutate(service.id, { onSuccess: onClose })
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Title order={4}>Remover serviço</Title>}
      centered
    >
      <Text>
        Deseja remover o serviço <strong>"{service?.description}"</strong>? Esta ação não pode
        ser desfeita.
      </Text>
      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={onClose} disabled={deleteService.isPending}>
          Cancelar
        </Button>
        <Button color="red" loading={deleteService.isPending} onClick={handleConfirm}>
          Remover
        </Button>
      </Group>
    </Modal>
  )
}
