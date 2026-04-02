import { useEffect } from 'react'
import {
  Drawer,
  TextInput,
  Button,
  Stack,
  Group,
  Title,
  Divider,
  Loader,
  Text,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { zodResolver } from 'mantine-form-zod-resolver'
import { z } from 'zod'
import type { Client } from '../../types'
import type { ClientFormData } from '../../hooks/useClients'
import { useCreateClient, useUpdateClient } from '../../hooks/useClients'

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  phone: z
    .string()
    .regex(/^\d{10,11}$/, 'Telefone inválido (somente dígitos, 10 ou 11)'),
  cpfCnpj: z.string().optional(),
  zipCode: z
    .string()
    .regex(/^\d{8}$/, 'CEP inválido')
    .optional()
    .or(z.literal('')),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  opened: boolean
  onClose: () => void
  client?: Client | null
}

async function fetchAddress(cep: string) {
  const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
  if (!res.ok) return null
  const data = await res.json()
  if (data.erro) return null
  return data as { logradouro: string; bairro: string; localidade: string; uf: string }
}

export function ClientFormDrawer({ opened, onClose, client }: Props) {
  const isEditing = !!client
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const isPending = createClient.isPending || updateClient.isPending

  const form = useForm<FormValues>({
    validate: zodResolver(schema),
    initialValues: {
      name: '',
      phone: '',
      cpfCnpj: '',
      zipCode: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
    },
  })

  useEffect(() => {
    if (opened) {
      if (client) {
        form.setValues({
          name: client.name,
          phone: client.phone,
          cpfCnpj: client.cpfCnpj ?? '',
          zipCode: client.zipCode ?? '',
          street: client.street ?? '',
          number: client.number ?? '',
          complement: client.complement ?? '',
          neighborhood: client.neighborhood ?? '',
          city: client.city ?? '',
          state: client.state ?? '',
        })
      } else {
        form.reset()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, client])

  async function handleZipCodeBlur() {
    const cep = form.values.zipCode?.replace(/\D/g, '') ?? ''
    if (cep.length !== 8) return
    const address = await fetchAddress(cep)
    if (!address) return
    form.setValues({
      street: address.logradouro,
      neighborhood: address.bairro,
      city: address.localidade,
      state: address.uf,
    })
  }

  function handleSubmit(values: FormValues) {
    const payload: ClientFormData = {
      name: values.name,
      phone: values.phone,
      cpfCnpj: values.cpfCnpj || undefined,
      zipCode: values.zipCode || undefined,
      street: values.street || undefined,
      number: values.number || undefined,
      complement: values.complement || undefined,
      neighborhood: values.neighborhood || undefined,
      city: values.city || undefined,
      state: values.state || undefined,
    }

    if (isEditing && client) {
      updateClient.mutate(
        { id: client.id, data: payload },
        { onSuccess: onClose },
      )
    } else {
      createClient.mutate(payload, { onSuccess: onClose })
    }
  }

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="md"
      title={
        <Title order={4}>{isEditing ? 'Editar cliente' : 'Novo cliente'}</Title>
      }
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput label="Nome *" placeholder="Maria Souza" {...form.getInputProps('name')} />
          <TextInput
            label="Telefone *"
            placeholder="11999998888"
            description="Somente dígitos"
            {...form.getInputProps('phone')}
          />
          <TextInput
            label="CPF / CNPJ"
            placeholder="Somente dígitos (opcional)"
            {...form.getInputProps('cpfCnpj')}
          />

          <Divider label="Endereço" labelPosition="left" mt="xs" />

          <Group grow>
            <TextInput
              label="CEP"
              placeholder="00000000"
              maxLength={8}
              {...form.getInputProps('zipCode')}
              onBlur={handleZipCodeBlur}
              rightSection={
                form.values.zipCode?.length === 8 ? <Loader size="xs" /> : null
              }
            />
            <TextInput label="Número" placeholder="42" {...form.getInputProps('number')} />
          </Group>

          <TextInput label="Rua" placeholder="Rua das Flores" {...form.getInputProps('street')} />
          <TextInput
            label="Complemento"
            placeholder="Apto 10 (opcional)"
            {...form.getInputProps('complement')}
          />
          <TextInput
            label="Bairro"
            placeholder="Centro"
            {...form.getInputProps('neighborhood')}
          />
          <Group grow>
            <TextInput label="Cidade" placeholder="São Paulo" {...form.getInputProps('city')} />
            <TextInput label="Estado" placeholder="SP" maxLength={2} {...form.getInputProps('state')} />
          </Group>

          <Text size="xs" c="dimmed">
            * Campos obrigatórios
          </Text>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" loading={isPending}>
              {isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Drawer>
  )
}
