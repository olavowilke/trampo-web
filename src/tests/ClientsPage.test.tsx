import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { ClientsPage } from '../pages/clients/ClientsPage'
import { renderWithProviders } from './helpers/renderWithProviders'
import { server } from './mocks/server'

describe('ClientsPage', () => {
  it('renders the page heading and search input', () => {
    renderWithProviders(<ClientsPage />)

    expect(screen.getByRole('heading', { name: 'Clientes' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Buscar por nome ou telefone...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Novo cliente' })).toBeInTheDocument()
  })

  it('renders client names after loading', async () => {
    renderWithProviders(<ClientsPage />)

    await waitFor(() => {
      expect(screen.getByText('Maria Souza')).toBeInTheDocument()
      expect(screen.getByText('Carlos Lima')).toBeInTheDocument()
    })
  })

  it('shows empty-search state when no clients match', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ClientsPage />)

    await waitFor(() => screen.getByText('Maria Souza'))

    const search = screen.getByPlaceholderText('Buscar por nome ou telefone...')
    await user.type(search, 'vazio')

    await waitFor(() => {
      expect(screen.getByText('Nenhum cliente encontrado.')).toBeInTheDocument()
    })
  })

  it('shows empty state with add-first-client button when list is empty', async () => {
    server.use(
      http.get('http://localhost:8080/api/clients', () =>
        HttpResponse.json({
          content: [],
          page: 0,
          size: 20,
          totalElements: 0,
          totalPages: 0,
          last: true,
        }),
      ),
    )

    renderWithProviders(<ClientsPage />)

    await waitFor(() => {
      expect(screen.getByText('Você ainda não tem clientes.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Adicionar primeiro cliente' })).toBeInTheDocument()
    })
  })

  it('shows error message when API fails', async () => {
    server.use(
      http.get('http://localhost:8080/api/clients', () =>
        HttpResponse.json({ message: 'Erro interno' }, { status: 500 }),
      ),
    )

    renderWithProviders(<ClientsPage />)

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar clientes.')).toBeInTheDocument()
    })
  })

  it('"Novo cliente" button opens the create drawer', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ClientsPage />)

    await waitFor(() => screen.getByText('Maria Souza'))

    await user.click(screen.getByRole('button', { name: 'Novo cliente' }))

    // The drawer form has a "Nome *" field that only appears when the drawer is open
    await waitFor(() => {
      expect(screen.getByLabelText('Nome *')).toBeInTheDocument()
    })
  })

  it('"Adicionar primeiro cliente" button opens the create drawer', async () => {
    server.use(
      http.get('http://localhost:8080/api/clients', () =>
        HttpResponse.json({
          content: [],
          page: 0,
          size: 20,
          totalElements: 0,
          totalPages: 0,
          last: true,
        }),
      ),
    )

    const user = userEvent.setup()
    renderWithProviders(<ClientsPage />)

    await user.click(await screen.findByRole('button', { name: 'Adicionar primeiro cliente' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Nome *')).toBeInTheDocument()
    })
  })

  describe('client card actions', () => {
    it('opens the delete modal when "Remover" menu item is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ClientsPage />)

      await waitFor(() => screen.getByText('Maria Souza'))

      // Open the context menu for the first card
      const moreButtons = screen.getAllByRole('button', { name: 'Mais opções' })
      await user.click(moreButtons[0])

      // Click "Remover" inside the dropdown
      await user.click(await screen.findByRole('menuitem', { name: /remover/i }))

      await waitFor(() => {
        expect(screen.getByText('Remover cliente')).toBeInTheDocument()
      })
    })

    it('opens the edit drawer when "Editar" menu item is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ClientsPage />)

      await waitFor(() => screen.getByText('Maria Souza'))

      const moreButtons = screen.getAllByRole('button', { name: 'Mais opções' })
      await user.click(moreButtons[0])

      await user.click(await screen.findByRole('menuitem', { name: /editar/i }))

      // In edit mode the submit button says "Salvar" instead of "Criar"
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument()
      })
    })
  })

  describe('delete flow', () => {
    it('closes modal and refreshes list after successful delete', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ClientsPage />)

      await waitFor(() => screen.getByText('Maria Souza'))

      const moreButtons = screen.getAllByRole('button', { name: 'Mais opções' })
      await user.click(moreButtons[0])
      await user.click(await screen.findByRole('menuitem', { name: /remover/i }))

      await waitFor(() => screen.getByText('Remover cliente'))

      await user.click(screen.getByRole('button', { name: 'Remover' }))

      await waitFor(() => {
        expect(screen.queryByText('Remover cliente')).not.toBeInTheDocument()
      })
    })

    it('closes modal when "Cancelar" is clicked without deleting', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ClientsPage />)

      await waitFor(() => screen.getByText('Maria Souza'))

      const moreButtons = screen.getAllByRole('button', { name: 'Mais opções' })
      await user.click(moreButtons[0])
      await user.click(await screen.findByRole('menuitem', { name: /remover/i }))

      await waitFor(() => screen.getByText('Remover cliente'))

      await user.click(screen.getByRole('button', { name: 'Cancelar' }))

      await waitFor(() => {
        expect(screen.queryByText('Remover cliente')).not.toBeInTheDocument()
      })
    })
  })
})
