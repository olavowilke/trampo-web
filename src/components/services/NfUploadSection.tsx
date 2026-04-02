import { Group, Text, Stack, Anchor, ActionIcon, Tooltip } from '@mantine/core'
import { Dropzone, MIME_TYPES } from '@mantine/dropzone'
import { IconUpload, IconFileTypePdf, IconX, IconDownload, IconTrash } from '@tabler/icons-react'
import type { Service } from '../../types'
import { useUploadNf, useDeleteNf } from '../../hooks/useNf'

interface Props {
  clientId: string
  service: Service
}

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export function NfUploadSection({ clientId, service }: Props) {
  const uploadNf = useUploadNf(clientId)
  const deleteNf = useDeleteNf(clientId)

  function handleDrop(files: File[]) {
    const file = files[0]
    if (!file) return
    uploadNf.mutate({ serviceId: service.id, file })
  }

  if (service.nfIssued && service.nfFileUrl) {
    return (
      <Stack gap="xs">
        <Group gap="xs">
          <IconFileTypePdf size={20} color="red" />
          <Text size="sm" fw={500}>
            NF anexada
          </Text>
        </Group>

        <Group gap="xs">
          <Anchor
            href={service.nfFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
          >
            <Group gap={4}>
              <IconDownload size={14} />
              Baixar NF
            </Group>
          </Anchor>

          <Tooltip label="Remover NF">
            <ActionIcon
              variant="subtle"
              color="red"
              size="sm"
              loading={deleteNf.isPending}
              onClick={() => deleteNf.mutate(service.id)}
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>

        {/* Allow replacement */}
        <Text size="xs" c="dimmed">
          Envie outro arquivo para substituir a NF atual.
        </Text>
        <Dropzone
          onDrop={handleDrop}
          accept={[MIME_TYPES.pdf]}
          maxSize={MAX_SIZE}
          maxFiles={1}
          loading={uploadNf.isPending}
          p="xs"
        >
          <Group justify="center" gap="xs">
            <IconUpload size={16} />
            <Text size="xs" c="dimmed">
              Substituir NF (PDF, max 10MB)
            </Text>
          </Group>
        </Dropzone>
      </Stack>
    )
  }

  return (
    <Dropzone
      onDrop={handleDrop}
      accept={[MIME_TYPES.pdf]}
      maxSize={MAX_SIZE}
      maxFiles={1}
      loading={uploadNf.isPending}
    >
      <Stack align="center" gap="xs" py="md">
        <Dropzone.Accept>
          <IconFileTypePdf size={32} color="green" />
        </Dropzone.Accept>
        <Dropzone.Reject>
          <IconX size={32} color="red" />
        </Dropzone.Reject>
        <Dropzone.Idle>
          <IconUpload size={32} color="gray" />
        </Dropzone.Idle>

        <Text size="sm" c="dimmed" ta="center">
          Arraste o PDF da NF aqui ou clique para selecionar
        </Text>
        <Text size="xs" c="dimmed">
          PDF, máximo 10MB
        </Text>
      </Stack>
    </Dropzone>
  )
}
