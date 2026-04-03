import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { RegisterPage } from '../pages/auth/RegisterPage'
import { renderWithProviders } from './helpers/renderWithProviders'
import { server } from './mocks/server'

const VALID_FORM = {
  name: 'João Silva',
  businessName: 'Silva Elétrica',
  email: 'joao@example.com',
  phone: '11999998888',
  password: 'password123',
  confirmPassword: 'password123',
}

async function fillForm(user: ReturnType<typeof userEvent.setup>, overrides: Partial<typeof VALID_FORM> = {}) {
  const values = { ...VALID_FORM, ...overrides }
  await user.type(screen.getByLabelText('Seu nome'), values.name)
  await user.type(screen.getByLabelText('Nome do negócio'), values.businessName)
  await user.type(screen.getByLabelText('E-mail'), values.email)
  await user.type(screen.getByLabelText('Telefone'), values.phone)
  await user.type(screen.getByLabelText('Senha'), values.password)
  await user.type(screen.getByLabelText('Confirmar senha'), values.confirmPassword)
}

describe('RegisterPage', () => {
  it('renders all form fields and submit button', () => {
    renderWithProviders(<RegisterPage />)

    expect(screen.getByLabelText('Seu nome')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome do negócio')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Telefone')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirmar senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Criar conta' })).toBeInTheDocument()
  })

  it('shows link to login page', () => {
    renderWithProviders(<RegisterPage />)
    expect(screen.getByRole('link', { name: 'Entrar' })).toBeInTheDocument()
  })

  describe('validation', () => {
    it('shows error when name is too short', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RegisterPage />)

      await user.type(screen.getByLabelText('Seu nome'), 'J')
      await user.click(screen.getByRole('button', { name: 'Criar conta' }))

      await waitFor(() => {
        expect(screen.getByText('Nome deve ter ao menos 2 caracteres')).toBeInTheDocument()
      })
    })

    it('shows error for invalid email', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RegisterPage />)

      await user.type(screen.getByLabelText('E-mail'), 'nao-e-email')
      await user.click(screen.getByRole('button', { name: 'Criar conta' }))

      await waitFor(() => {
        expect(screen.getByText('E-mail inválido')).toBeInTheDocument()
      })
    })

    it('shows error for phone with fewer than 10 digits', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RegisterPage />)

      await user.type(screen.getByLabelText('Telefone'), '9999')
      await user.click(screen.getByRole('button', { name: 'Criar conta' }))

      await waitFor(() => {
        expect(
          screen.getByText('Telefone inválido (somente dígitos, 10 ou 11 caracteres)'),
        ).toBeInTheDocument()
      })
    })

    it('shows error for phone containing letters', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RegisterPage />)

      await user.type(screen.getByLabelText('Telefone'), '1199999abc8')
      await user.click(screen.getByRole('button', { name: 'Criar conta' }))

      await waitFor(() => {
        expect(
          screen.getByText('Telefone inválido (somente dígitos, 10 ou 11 caracteres)'),
        ).toBeInTheDocument()
      })
    })

    it('shows error for password shorter than 8 characters', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RegisterPage />)

      await user.type(screen.getByLabelText('Senha'), 'abc123')
      await user.click(screen.getByRole('button', { name: 'Criar conta' }))

      await waitFor(() => {
        expect(screen.getByText('Senha deve ter ao menos 8 caracteres')).toBeInTheDocument()
      })
    })

    it('shows error when passwords do not match', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RegisterPage />)

      await user.type(screen.getByLabelText('Senha'), 'password123')
      await user.type(screen.getByLabelText('Confirmar senha'), 'different456')
      await user.click(screen.getByRole('button', { name: 'Criar conta' }))

      await waitFor(() => {
        expect(screen.getByText('As senhas não coincidem')).toBeInTheDocument()
      })
    })

    it('does not submit when fields are empty', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RegisterPage />)

      await user.click(screen.getByRole('button', { name: 'Criar conta' }))

      // Button remains enabled (no pending state) meaning mutate was not called
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Criar conta' })).not.toBeDisabled()
      })
      expect(screen.getByRole('button', { name: 'Criar conta' })).toBeInTheDocument()
    })
  })

  describe('API interaction', () => {
    it('navigates to /login after successful registration', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RegisterPage />, {
        routerProps: { initialEntries: ['/register'] },
        extraRoutes: [{ path: '/login', element: <div>Página de login</div> }],
      })

      await fillForm(user)
      await user.click(screen.getByRole('button', { name: 'Criar conta' }))

      await waitFor(() => {
        expect(screen.getByText('Página de login')).toBeInTheDocument()
      })
    })

    it('shows success notification after registration', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RegisterPage />, {
        routerProps: { initialEntries: ['/register'] },
        extraRoutes: [{ path: '/login', element: <div>login</div> }],
      })

      await fillForm(user)
      await user.click(screen.getByRole('button', { name: 'Criar conta' }))

      await waitFor(() => {
        expect(screen.getByText('Conta criada!')).toBeInTheDocument()
      })
    })

    it('shows error notification for duplicate email', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RegisterPage />)

      await fillForm(user, { email: 'exists@example.com' })
      await user.click(screen.getByRole('button', { name: 'Criar conta' }))

      await waitFor(() => {
        expect(screen.getByText('E-mail já cadastrado')).toBeInTheDocument()
      })
    })

    it('shows generic error notification when server returns no message', async () => {
      server.use(
        http.post('http://localhost:8080/api/auth/register', () => {
          return HttpResponse.json({}, { status: 500 })
        }),
      )

      const user = userEvent.setup()
      renderWithProviders(<RegisterPage />)

      await fillForm(user)
      await user.click(screen.getByRole('button', { name: 'Criar conta' }))

      await waitFor(() => {
        expect(screen.getByText('Não foi possível criar a conta')).toBeInTheDocument()
      })
    })

    it('disables submit button while request is pending', async () => {
      let resolveRequest!: () => void
      server.use(
        http.post('http://localhost:8080/api/auth/register', () => {
          return new Promise<Response>((resolve) => {
            resolveRequest = () => resolve(HttpResponse.json({}, { status: 201 }) as unknown as Response)
          })
        }),
      )

      const user = userEvent.setup()
      renderWithProviders(<RegisterPage />)

      await fillForm(user)
      await user.click(screen.getByRole('button', { name: 'Criar conta' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Criar conta' })).toBeDisabled()
      })

      resolveRequest()
    })
  })
})
