import { useForm } from '@mantine/form'
import { zodResolver } from 'mantine-form-zod-resolver'
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Text,
  Anchor,
  Stack,
  Center,
  Box,
} from '@mantine/core'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { useRegister } from '../../hooks/useAuthMutations'

const schema = z
  .object({
    name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
    businessName: z.string().min(2, 'Nome do negócio deve ter ao menos 2 caracteres'),
    email: z.string().email('E-mail inválido'),
    phone: z
      .string()
      .regex(/^\d{10,11}$/, 'Telefone inválido (somente dígitos, 10 ou 11 caracteres)'),
    password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export function RegisterPage() {
  const register = useRegister()

  const form = useForm<FormValues>({
    validate: zodResolver(schema),
    initialValues: {
      name: '',
      businessName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  })

  function handleSubmit(values: FormValues) {
    const { confirmPassword: _, ...payload } = values
    register.mutate(payload)
  }

  return (
    <Center mih="100dvh" px="md" py="xl">
      <Box w="100%" maw={400}>
        <Title ta="center" mb={4}>
          Trampo(Beta)
        </Title>
        <Text ta="center" c="dimmed" mb="xl">
          Crie sua conta grátis
        </Text>

        <Paper withBorder shadow="md" p="xl" radius="md">
          <Title order={2} mb="lg">
            Cadastro
          </Title>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <TextInput
                label="Seu nome"
                placeholder="João Silva"
                autoComplete="name"
                {...form.getInputProps('name')}
              />
              <TextInput
                label="Nome do negócio"
                placeholder="Silva Elétrica"
                {...form.getInputProps('businessName')}
              />
              <TextInput
                label="E-mail"
                placeholder="voce@email.com"
                autoComplete="email"
                {...form.getInputProps('email')}
              />
              <TextInput
                label="Telefone"
                placeholder="11999998888"
                autoComplete="tel"
                {...form.getInputProps('phone')}
              />
              <PasswordInput
                label="Senha"
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                {...form.getInputProps('password')}
              />
              <PasswordInput
                label="Confirmar senha"
                placeholder="Repita a senha"
                autoComplete="new-password"
                {...form.getInputProps('confirmPassword')}
              />

              <Button type="submit" fullWidth loading={register.isPending} mt="xs">
                Criar conta
              </Button>
            </Stack>
          </form>
        </Paper>

        <Text ta="center" mt="md" size="sm">
          Já tem conta?{' '}
          <Anchor component={Link} to="/login">
            Entrar
          </Anchor>
        </Text>
      </Box>
    </Center>
  )
}
