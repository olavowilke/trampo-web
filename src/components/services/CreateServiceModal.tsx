import { Modal, Textarea, Button, Group, Title, Stack } from '@mantine/core'
import { useForm } from '@mantine/form'
import { zodResolver } from 'mantine-form-zod-resolver'
import { z } from 'zod'
import { useCreateService } from '../../hooks/useServices'

const schema = z.object({
  description: z.string().min(3, 'Descrição deve ter ao menos 3 caracteres'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  opened: boolean
  onClose: () => void
  clientId: string
}

export function CreateServiceModal({ opened, onClose, clientId }: Props) {
  const createService = useCreateService(clientId)

  const form = useForm<FormValues>({
    validate: zodResolver(schema),
    initialValues: { description: '' },
  })

  function handleSubmit(values: FormValues) {
    createService.mutate(values, {
      onSuccess: () => {
        form.reset()
        onClose()
      },
    })
  }

  function handleClose() {
    form.reset()
    onClose()
  }

  return (
    <Modal opened={opened} onClose={handleClose} title={<Title order={4}>Novo serviço</Title>} centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Textarea
            label="Descrição *"
            placeholder="Descreva o serviço a ser realizado..."
            autosize
            minRows={3}
            {...form.getInputProps('description')}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={handleClose} disabled={createService.isPending}>
              Cancelar
            </Button>
            <Button type="submit" loading={createService.isPending}>
              Criar
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
