import { Group, Text, Stack, ActionIcon, Tooltip, Button } from '@mantine/core'
import { Dropzone, MIME_TYPES } from '@mantine/dropzone'
import { IconUpload, IconFileTypePdf, IconX, IconDownload, IconTrash } from '@tabler/icons-react'
import type { Service } from '../../types'
import { useUploadQuoteFile, useDeleteQuoteFile, useDownloadQuoteFileUrl } from '../../hooks/useQuoteFile'

interface Props {
  clientId: string
  service: Service
}

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export function QuoteFileUploadSection({ clientId, service }: Props) {
  const uploadQuoteFile = useUploadQuoteFile(clientId)
  const deleteQuoteFile = useDeleteQuoteFile(clientId)
  const downloadUrl = useDownloadQuoteFileUrl(clientId)

  function handleDrop(files: File[]) {
    const file = files[0]
    if (!file) return
    uploadQuoteFile.mutate({ serviceId: service.id, file })
  }

  function handleDownload() {
    downloadUrl.mutate(service.id, {
      onSuccess: (data) => window.open(data.url, '_blank', 'noopener,noreferrer'),
    })
  }

  if (service.quoteFileUrl) {
    return (
      <Stack gap="xs">
        <Group gap="xs">
          <IconFileTypePdf size={20} color="red" />
          <Text size="sm" fw={500}>
            PDF de orçamento anexado
          </Text>
        </Group>

        <Group gap="xs">
          <Button
            variant="light"
            size="xs"
            leftSection={<IconDownload size={14} />}
            onClick={handleDownload}
            loading={downloadUrl.isPending}
          >
            Baixar orçamento
          </Button>

          <Tooltip label="Remover PDF">
            <ActionIcon
              variant="subtle"
              color="red"
              size="sm"
              loading={deleteQuoteFile.isPending}
              onClick={() => deleteQuoteFile.mutate(service.id)}
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <Text size="xs" c="dimmed">
          Envie outro arquivo para substituir o PDF atual.
        </Text>
        <Dropzone
          onDrop={handleDrop}
          accept={[MIME_TYPES.pdf]}
          maxSize={MAX_SIZE}
          maxFiles={1}
          loading={uploadQuoteFile.isPending}
          p="xs"
        >
          <Group justify="center" gap="xs">
            <IconUpload size={16} />
            <Text size="xs" c="dimmed">
              Substituir PDF (max 10MB)
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
      loading={uploadQuoteFile.isPending}
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
          Arraste o PDF do orçamento aqui ou clique para selecionar
        </Text>
        <Text size="xs" c="dimmed">
          PDF, máximo 10MB
        </Text>
      </Stack>
    </Dropzone>
  )
}
