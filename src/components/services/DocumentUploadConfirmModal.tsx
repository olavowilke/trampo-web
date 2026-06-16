import { Modal, Stack, Select, Group, Button, Text, List, ThemeIcon } from '@mantine/core'
import { IconFile, IconX } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { DocumentTag, DocumentTagLabel } from '../../types'

interface Props {
  opened: boolean
  files: File[]
  onClose: () => void
  onConfirm: (tag: DocumentTag) => void
  loading: boolean
}

export function DocumentUploadConfirmModal({
  opened,
  files,
  onClose,
  onConfirm,
  loading,
}: Props) {
  const [tag, setTag] = useState<DocumentTag>(DocumentTag.OTHER)

  // Cada vez que o modal abre, reseta a tag para o default "Outros".
  useEffect(() => {
    if (opened) setTag(DocumentTag.OTHER)
  }, [opened])

  return (
    <Modal opened={opened} onClose={onClose} title="Anexar documentos" centered>
      <Stack>
        <Text size="sm" c="dimmed">
          {files.length} arquivo(s) selecionado(s)
        </Text>

        <List
          size="sm"
          spacing={4}
          icon={
            <ThemeIcon size={20} radius="xl" color="gray" variant="light">
              <IconFile size={12} />
            </ThemeIcon>
          }
        >
          {files.map((f, i) => (
            <List.Item key={i}>{f.name}</List.Item>
          ))}
        </List>

        <Select
          label="Tag"
          value={tag}
          onChange={(v) => v && setTag(v as DocumentTag)}
          data={Object.values(DocumentTag).map((t) => ({
            value: t,
            label: DocumentTagLabel[t],
          }))}
          allowDeselect={false}
        />

        <Group justify="space-between">
          <Button
            variant="default"
            leftSection={<IconX size={14} />}
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={() => onConfirm(tag)} loading={loading}>
            Enviar {files.length} arquivo(s)
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
