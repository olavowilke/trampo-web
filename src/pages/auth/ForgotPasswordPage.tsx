import { useState } from 'react'
import { useForm } from '@mantine/form'
import { zodResolver } from 'mantine-form-zod-resolver'
import {
  TextInput,
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
import { IconCheck } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { useForgotPassword } from '../../hooks/useAuthMutations'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
})

type FormValues = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword()
  const [sent, setSent] = useState(false)

  const form = useForm<FormValues>({
    validate: zodResolver(schema),
    initialValues: { email: '' },
  })

  function handleSubmit(values: FormValues) {
    forgotPassword.mutate(values, {
      onSuccess: () => setSent(true),
    })
  }

  return (
    <Center mih="100dvh" px="md">
      <Box w="100%" maw={400}>
        <Title ta="center" mb={4}>
          Trampo
        </Title>
        <Text ta="center" c="dimmed" mb="xl">
          Recuperação de senha
        </Text>

        <Paper withBorder shadow="md" p="xl" radius="md">
          <Title order={2} mb="sm">
            Esqueceu a senha?
          </Title>
          <Text size="sm" c="dimmed" mb="lg">
            Informe seu e-mail e enviaremos um link para redefinir sua senha.
          </Text>

          {sent ? (
            <Alert icon={<IconCheck size={16} />} color="green" title="E-mail enviado">
              Verifique sua caixa de entrada. O link expira em 1 hora.
            </Alert>
          ) : (
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack>
                <TextInput
                  label="E-mail"
                  placeholder="voce@email.com"
                  autoComplete="email"
                  {...form.getInputProps('email')}
                />
                <Button type="submit" fullWidth loading={forgotPassword.isPending}>
                  Enviar link
                </Button>
              </Stack>
            </form>
          )}
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
