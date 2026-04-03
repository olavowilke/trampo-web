import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { LoginPage } from '../pages/auth/LoginPage'
import { renderWithProviders } from './helpers/renderWithProviders'
import { server } from './mocks/server'

describe('LoginPage', () => {
  it('renders email and password fields', () => {
    renderWithProviders(<LoginPage />)

    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('shows links to register and forgot password', () => {
    renderWithProviders(<LoginPage />)

    expect(screen.getByRole('link', { name: 'Cadastre-se' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Esqueceu a senha?' })).toBeInTheDocument()
  })

  describe('validation', () => {
    it('shows error for invalid email format', async () => {
      const user = userEvent.setup()
      renderWithProviders(<LoginPage />)

      await user.type(screen.getByLabelText('E-mail'), 'not-an-email')
      await user.click(screen.getByRole('button', { name: 'Entrar' }))

      await waitFor(() => {
        expect(screen.getByText('E-mail inválido')).toBeInTheDocument()
      })
    })

    it('shows error when password is empty', async () => {
      const user = userEvent.setup()
      renderWithProviders(<LoginPage />)

      await user.type(screen.getByLabelText('E-mail'), 'user@example.com')
      await user.click(screen.getByRole('button', { name: 'Entrar' }))

      await waitFor(() => {
        expect(screen.getByText('Senha obrigatória')).toBeInTheDocument()
      })
    })
  })

  describe('API interaction', () => {
    it('navigates to /clients after successful login', async () => {
      const user = userEvent.setup()
      renderWithProviders(<LoginPage />, {
        routerProps: { initialEntries: ['/login'] },
        extraRoutes: [{ path: '/clients', element: <div>Página de clientes</div> }],
      })

      await user.type(screen.getByLabelText('E-mail'), 'user@example.com')
      await user.type(screen.getByLabelText('Senha'), 'password123')
      await user.click(screen.getByRole('button', { name: 'Entrar' }))

      await waitFor(() => {
        expect(screen.getByText('Página de clientes')).toBeInTheDocument()
      })
    })

    it('shows error notification for invalid credentials', async () => {
      const user = userEvent.setup()
      renderWithProviders(<LoginPage />)

      await user.type(screen.getByLabelText('E-mail'), 'user@example.com')
      await user.type(screen.getByLabelText('Senha'), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: 'Entrar' }))

      await waitFor(() => {
        expect(screen.getByText('E-mail ou senha inválidos')).toBeInTheDocument()
      })
    })

    it('shows generic error when server returns no message', async () => {
      server.use(
        http.post('http://localhost:8080/api/auth/login', () => {
          return HttpResponse.json({}, { status: 500 })
        }),
      )

      const user = userEvent.setup()
      renderWithProviders(<LoginPage />)

      await user.type(screen.getByLabelText('E-mail'), 'user@example.com')
      await user.type(screen.getByLabelText('Senha'), 'password123')
      await user.click(screen.getByRole('button', { name: 'Entrar' }))

      await waitFor(() => {
        expect(screen.getByText('E-mail ou senha inválidos')).toBeInTheDocument()
      })
    })

    it('disables submit button while request is pending', async () => {
      let resolveRequest!: () => void
      server.use(
        http.post('http://localhost:8080/api/auth/login', () => {
          return new Promise<Response>((resolve) => {
            resolveRequest = () =>
              resolve(
                HttpResponse.json(
                  {
                    accessToken: 'token',
                    refreshToken: 'refresh',
                    tenantId: 'tid',
                    name: 'João',
                    businessName: 'JB',
                  },
                ) as unknown as Response,
              )
          })
        }),
      )

      const user = userEvent.setup()
      renderWithProviders(<LoginPage />)

      await user.type(screen.getByLabelText('E-mail'), 'user@example.com')
      await user.type(screen.getByLabelText('Senha'), 'password123')
      await user.click(screen.getByRole('button', { name: 'Entrar' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Entrar' })).toBeDisabled()
      })

      resolveRequest()
    })
  })
})
