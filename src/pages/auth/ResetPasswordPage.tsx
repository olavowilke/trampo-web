import { useForm } from '@mantine/form'
import { zodResolver } from 'mantine-form-zod-resolver'
import {
  PasswordInput,
  Button,
  Paper,
  Title,
  Text,
  Anchor,
  Stack,
  Center,
  Box,
  Alert,
} from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { Link, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { useResetPassword } from '../../hooks/useAuthMutations'

const schema = z
  .object({
    newPassword: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const resetPassword = useResetPassword()

  const form = useForm<FormValues>({
    validate: zodResolver(schema),
    initialValues: { newPassword: '', confirmPassword: '' },
  })

  function handleSubmit(values: FormValues) {
    if (!token) return
    resetPassword.mutate({ token, newPassword: values.newPassword })
  }

  if (!token) {
    return (
      <Center mih="100dvh" px="md">
        <Box w="100%" maw={400}>
          <Alert icon={<IconAlertCircle size={16} />} color="red" title="Link inválido">
            O link de redefinição é inválido. Solicite um novo link.
          </Alert>
          <Text ta="center" mt="md" size="sm">
            <Anchor component={Link} to="/forgot-password">
              Solicitar novo link
            </Anchor>
          </Text>
        </Box>
      </Center>
    )
  }

  return (
    <Center mih="100dvh" px="md">
      <Box w="100%" maw={400}>
        <Title ta="center" mb={4}>
          Trampo
        </Title>
        <Text ta="center" c="dimmed" mb="xl">
          Redefinir senha
        </Text>

        <Paper withBorder shadow="md" p="xl" radius="md">
          <Title order={2} mb="sm">
            Nova senha
          </Title>
          <Text size="sm" c="dimmed" mb="lg">
            Digite sua nova senha abaixo.
          </Text>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <PasswordInput
                label="Nova senha"
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                {...form.getInputProps('newPassword')}
              />
              <PasswordInput
                label="Confirmar senha"
                placeholder="Repita a nova senha"
                autoComplete="new-password"
                {...form.getInputProps('confirmPassword')}
              />
              <Button type="submit" fullWidth loading={resetPassword.isPending}>
                Redefinir senha
              </Button>
            </Stack>
          </form>
        </Paper>

        <Text ta="center" mt="md" size="sm">
          <Anchor component={Link} to="/login">
            Voltar ao login
          </Anchor>
        </Text>
      </Box>
    </Center>
  )
}
