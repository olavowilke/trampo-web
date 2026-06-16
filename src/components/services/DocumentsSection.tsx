import {
  Stack,
  Group,
  Text,
  Badge,
  ActionIcon,
  Tooltip,
  Card,
  Modal,
  Button,
} from '@mantine/core'
import { Dropzone } from '@mantine/dropzone'
import {
  IconDownload,
  IconTrash,
  IconUpload,
  IconFile,
  IconX,
} from '@tabler/icons-react'
import { useState } from 'react'
import {
  useListDocuments,
  useUploadDocuments,
  useDeleteDocument,
  useDownloadDocumentUrl,
} from '../../hooks/useDocuments'
import { DocumentTag, DocumentTagLabel, DocumentTagColor } from '../../types'
import { formatDateTime } from '../../utils/formatters'
import { DocumentUploadConfirmModal } from './DocumentUploadConfirmModal'

interface Props {
  clientId: string
  serviceId: string
}

const ACCEPT = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_SIZE = 10 * 1024 * 1024
const MAX_FILES = 20

export function DocumentsSection({ clientId, serviceId }: Props) {
  const { data: documents = [] } = useListDocuments(clientId, serviceId)
  const upload = useUploadDocuments(clientId)
  const remove = useDeleteDocument(clientId)
  const dlUrl = useDownloadDocumentUrl(clientId)

  const [pending, setPending] = useState<File[]>([])
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null)

  function handleDrop(files: File[]) {
    if (files.length === 0) return
    setPending(files)
  }

  function handleConfirm(tag: DocumentTag) {
    upload.mutate(
      { serviceId, tag, files: pending },
      { onSettled: () => setPending([]) },
    )
  }

  function handleDownload(documentId: string) {
    dlUrl.mutate(
      { serviceId, documentId },
      {
        onSuccess: ({ url }) => window.open(url, '_blank', 'noopener,noreferrer'),
      },
    )
  }

  function confirmDelete() {
    if (!toDelete) return
    remove.mutate(
      { serviceId, documentId: toDelete.id },
      { onSettled: () => setToDelete(null) },
    )
  }

  return (
    <Stack gap="sm">
      <Text fw={600}>Documentos</Text>

      {documents.length === 0 && (
        <Text size="sm" c="dimmed">
          Nenhum documento anexado.
        </Text>
      )}

      {documents.map((d) => (
        <Card key={d.id} withBorder radius="sm" padding="xs">
          <Group justify="space-between" wrap="nowrap">
            <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
              <IconFile size={18} />
              <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" truncate>
                  {d.fileName}
                </Text>
                <Group gap={6}>
                  <Badge size="xs" variant="light" color={DocumentTagColor[d.tag]}>
                    {DocumentTagLabel[d.tag]}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {formatDateTime(d.createdAt)}
                  </Text>
                </Group>
              </Stack>
            </Group>
            <Group gap={4}>
              <Tooltip label="Baixar">
                <ActionIcon
                  variant="subtle"
                  onClick={() => handleDownload(d.id)}
                  loading={dlUrl.isPending}
                >
                  <IconDownload size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Remover">
                <ActionIcon
                  variant="subtle"
                  color="red"
                  onClick={() => setToDelete({ id: d.id, name: d.fileName })}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        </Card>
      ))}

      <Dropzone
        onDrop={handleDrop}
        accept={ACCEPT}
        maxSize={MAX_SIZE}
        maxFiles={MAX_FILES}
        loading={upload.isPending}
      >
        <Stack align="center" gap="xs" py="md">
          <Dropzone.Accept>
            <IconUpload size={28} />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX size={28} color="red" />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconUpload size={28} color="gray" />
          </Dropzone.Idle>
          <Text size="sm" c="dimmed" ta="center">
            Arraste documentos aqui ou clique para selecionar
          </Text>
          <Text size="xs" c="dimmed">
            PDF, JPG ou PNG · até {MAX_FILES} arquivos · máx. 10MB cada
          </Text>
        </Stack>
      </Dropzone>

      <DocumentUploadConfirmModal
        opened={pending.length > 0}
        files={pending}
        onClose={() => setPending([])}
        onConfirm={handleConfirm}
        loading={upload.isPending}
      />

      <Modal
        opened={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Remover documento"
        centered
      >
        <Stack>
          <Text size="sm">
            Remover <b>{toDelete?.name}</b>? Esta ação não pode ser desfeita.
          </Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => setToDelete(null)}
              disabled={remove.isPending}
            >
              Cancelar
            </Button>
            <Button color="red" onClick={confirmDelete} loading={remove.isPending}>
              Remover
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
