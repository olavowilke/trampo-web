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
import { useLogin } from '../../hooks/useAuthMutations'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const login = useLogin()

  const form = useForm<FormValues>({
    validate: zodResolver(schema),
    initialValues: { email: '', password: '' },
  })

  return (
    <Center mih="100dvh" px="md">
      <Box w="100%" maw={400}>
        <Title ta="center" mb={4}>
          Trampo
        </Title>
        <Text ta="center" c="dimmed" mb="xl">
          Gestão para autônomos
        </Text>

        <Paper withBorder shadow="md" p="xl" radius="md">
          <Title order={2} mb="lg">
            Entrar
          </Title>

          <form onSubmit={form.onSubmit((v: FormValues) => login.mutate(v))}>
            <Stack>
              <TextInput
                label="E-mail"
                placeholder="voce@email.com"
                autoComplete="email"
                {...form.getInputProps('email')}
              />
              <PasswordInput
                label="Senha"
                placeholder="Sua senha"
                autoComplete="current-password"
                {...form.getInputProps('password')}
              />

              <Anchor component={Link} to="/forgot-password" size="sm" ta="right">
                Esqueceu a senha?
              </Anchor>

              <Button type="submit" fullWidth loading={login.isPending}>
                Entrar
              </Button>
            </Stack>
          </form>
        </Paper>

        <Text ta="center" mt="md" size="sm">
          Ainda não tem conta?{' '}
          <Anchor component={Link} to="/register">
            Cadastre-se
          </Anchor>
        </Text>
      </Box>
    </Center>
  )
}
