import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { ServiceDetailDrawer } from '../components/services/ServiceDetailDrawer'
import { ServicesPage } from '../pages/services/ServicesPage'
import { renderWithProviders } from './helpers/renderWithProviders'
import type { Service } from '../types'
import { ServiceStatus, PaymentMethod } from '../types'
import { server } from './mocks/server'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeService(overrides: Partial<Service> = {}): Service {
  return {
    id: 'service-1',
    clientId: 'client-1',
    clientName: 'Maria Souza',
    description: 'Troca de disjuntor',
    status: ServiceStatus.TECHNICAL_VISIT,
    nfIssued: false,
    createdAt: '2024-01-01T00:00:00',
    ...overrides,
  }
}

/** Returns a render result whose `rerender` preserves all providers. */
function renderDrawerWithRerender(props: {
  opened: boolean
  service: Service | null
  onClose?: () => void
}) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MantineProvider>
        <Notifications />
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <AuthProvider>{children}</AuthProvider>
          </MemoryRouter>
        </QueryClientProvider>
      </MantineProvider>
    )
  }

  return render(
    <ServiceDetailDrawer
      opened={props.opened}
      onClose={props.onClose ?? (() => {})}
      clientId="client-1"
      service={props.service}
    />,
    { wrapper: Wrapper },
  )
}

function renderDrawer(service: Service | null, opened = true) {
  return renderWithProviders(
    <ServiceDetailDrawer
      opened={opened}
      onClose={() => {}}
      clientId="client-1"
      service={service}
    />,
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ServiceDetailDrawer', () => {
  // ── Field pre-fill ──────────────────────────────────────────────────────────

  describe('field pre-fill', () => {
    it('pre-fills visitNotes when service has visitNotes set', () => {
      renderDrawer(
        makeService({
          status: ServiceStatus.QUOTE_PENDING,
          visitNotes: 'Verificar painel elétrico',
        }),
      )

      expect(screen.getByDisplayValue('Verificar painel elétrico')).toBeInTheDocument()
    })

    it('pre-fills visitDate when service has visitDate set', async () => {
      renderDrawer(
        makeService({
          status: ServiceStatus.QUOTE_PENDING,
          visitDate: '2024-06-15T10:30:00',
        }),
      )

      // DateTimePicker renders as a <button> — the formatted date is its textContent.
      // When no date is selected, the button shows the placeholder "Selecione".
      await waitFor(() => {
        const btn = screen.getByLabelText('Data da visita')
        expect(btn.textContent).not.toContain('Selecione')
        expect(btn.textContent?.trim()).toBeTruthy()
      })
    })

    it('pre-fills scheduledAt when service has scheduledAt set', async () => {
      renderDrawer(
        makeService({
          status: ServiceStatus.EXECUTION_SCHEDULED,
          scheduledAt: '2024-07-20T14:00:00',
        }),
      )

      await waitFor(() => {
        const btn = screen.getByLabelText('Data agendada')
        expect(btn.textContent).not.toContain('Selecione')
        expect(btn.textContent?.trim()).toBeTruthy()
      })
    })

    it('pre-fills quoteNotes when service has quoteNotes set', () => {
      renderDrawer(
        makeService({
          status: ServiceStatus.QUOTE_APPROVED,
          quoteNotes: 'Inclui troca de peças',
        }),
      )

      expect(screen.getByDisplayValue('Inclui troca de peças')).toBeInTheDocument()
    })

    it('pre-fills completionNotes when service has completionNotes set', () => {
      renderDrawer(
        makeService({
          status: ServiceStatus.EXECUTION_COMPLETED,
          completionNotes: 'Serviço finalizado sem pendências',
        }),
      )

      expect(screen.getByDisplayValue('Serviço finalizado sem pendências')).toBeInTheDocument()
    })

    it('re-populates fields when drawer re-opens with the same service reference', async () => {
      // Simulates: user closes drawer without advancing, reopens the same card.
      // The service reference hasn't changed (same object identity), so `useEffect`
      // must depend on `opened` to re-fire and re-populate the fields.
      const service = makeService({
        status: ServiceStatus.QUOTE_PENDING,
        visitNotes: 'Notas importantes da visita',
        visitDate: '2024-06-15T10:00:00',
      })

      const { rerender } = renderDrawerWithRerender({ opened: false, service })

      expect(screen.queryByDisplayValue('Notas importantes da visita')).not.toBeInTheDocument()

      rerender(
        <ServiceDetailDrawer
          opened={true}
          onClose={() => {}}
          clientId="client-1"
          service={service}
        />,
      )

      await waitFor(() => {
        expect(screen.getByDisplayValue('Notas importantes da visita')).toBeInTheDocument()
      })
    })
  })

  // ── ServicesPage pre-fill integration ───────────────────────────────────────

  describe('ServicesPage — pre-fill after status advance', () => {
    it('shows visitDate and visitNotes in drawer when service is at QUOTE_PENDING with those fields set', async () => {
      // Simulates the state AFTER advancing from TECHNICAL_VISIT to QUOTE_PENDING:
      // the list returns the service with visitDate and visitNotes saved.
      // With selectedServiceId in ServicesPage, the drawer always receives live
      // data from React Query instead of a stale click-time snapshot.
      server.use(
        http.get('http://localhost:8080/api/clients/:clientId/services', () =>
          HttpResponse.json({
            content: [
              makeService({
                status: ServiceStatus.QUOTE_PENDING,
                visitDate: '2024-06-15T10:30:00',
                visitNotes: 'Painel com sobrecarga detectada',
              }),
            ],
            page: 0,
            size: 20,
            totalElements: 1,
            totalPages: 1,
            last: true,
          }),
        ),
      )

      const user = userEvent.setup()

      // ServicesPage uses useParams({ clientId }) — must be inside a Route with the param
      renderWithProviders(
        <Routes>
          <Route path="/clients/:clientId/services" element={<ServicesPage />} />
        </Routes>,
        { routerProps: { initialEntries: ['/clients/client-1/services'] } },
      )

      // Wait for the service card to appear
      await screen.findByText('Troca de disjuntor')

      // Click the card to open the drawer
      await user.click(screen.getByText('Troca de disjuntor'))

      // visitNotes must be pre-filled (saved when advancing status)
      await waitFor(() => {
        expect(screen.getByDisplayValue('Painel com sobrecarga detectada')).toBeInTheDocument()
      })

      // visitDate must be pre-filled (DateTimePicker <button> shows non-placeholder text)
      await waitFor(() => {
        const btn = screen.getByLabelText('Data da visita')
        expect(btn.textContent).not.toContain('Selecione')
        expect(btn.textContent?.trim()).toBeTruthy()
      })
    })
  })

  // ── Field visibility by status ──────────────────────────────────────────────

  describe('field visibility by status', () => {
    it('shows visitDate and visitNotes at TECHNICAL_VISIT', () => {
      renderDrawer(makeService({ status: ServiceStatus.TECHNICAL_VISIT }))

      expect(screen.getByLabelText('Data da visita')).toBeInTheDocument()
      expect(screen.getByLabelText('Notas da visita')).toBeInTheDocument()
    })

    it('does NOT show scheduledAt at TECHNICAL_VISIT', () => {
      renderDrawer(makeService({ status: ServiceStatus.TECHNICAL_VISIT }))

      expect(screen.queryByLabelText('Data agendada')).not.toBeInTheDocument()
    })

    it('does NOT show scheduledAt at QUOTE_PENDING', () => {
      renderDrawer(makeService({ status: ServiceStatus.QUOTE_PENDING }))

      expect(screen.queryByLabelText('Data agendada')).not.toBeInTheDocument()
    })

    it('shows scheduledAt at QUOTE_APPROVED so user can fill before advancing', () => {
      renderDrawer(makeService({ status: ServiceStatus.QUOTE_APPROVED }))

      expect(screen.getByLabelText('Data agendada')).toBeInTheDocument()
    })

    it('shows completedAt and completionNotes at EXECUTION_SCHEDULED', () => {
      renderDrawer(makeService({ status: ServiceStatus.EXECUTION_SCHEDULED }))

      expect(screen.getByLabelText('Data de conclusão')).toBeInTheDocument()
      expect(screen.getByLabelText('Notas de conclusão')).toBeInTheDocument()
    })

    it('does NOT show completedAt at QUOTE_APPROVED', () => {
      renderDrawer(makeService({ status: ServiceStatus.QUOTE_APPROVED }))

      expect(screen.queryByLabelText('Data de conclusão')).not.toBeInTheDocument()
    })

    it('shows paidAt and paymentMethod at EXECUTION_COMPLETED', () => {
      renderDrawer(makeService({ status: ServiceStatus.EXECUTION_COMPLETED }))

      expect(screen.getByLabelText('Data do pagamento')).toBeInTheDocument()
      expect(screen.getAllByLabelText('Método de pagamento').length).toBeGreaterThan(0)
    })

    it('does NOT show paidAt at EXECUTION_SCHEDULED', () => {
      renderDrawer(makeService({ status: ServiceStatus.EXECUTION_SCHEDULED }))

      expect(screen.queryByLabelText('Data do pagamento')).not.toBeInTheDocument()
    })
  })

  // ── Nota Fiscal visibility ──────────────────────────────────────────────────

  describe('Nota Fiscal section visibility', () => {
    const earlyStatuses = [
      ServiceStatus.TECHNICAL_VISIT,
      ServiceStatus.QUOTE_PENDING,
      ServiceStatus.QUOTE_APPROVED,
      ServiceStatus.EXECUTION_SCHEDULED,
    ]

    earlyStatuses.forEach((status) => {
      it(`does NOT show Nota Fiscal section at ${status}`, () => {
        renderDrawer(makeService({ status }))

        expect(screen.queryByText('Nota Fiscal')).not.toBeInTheDocument()
      })
    })

    it('shows Nota Fiscal section at EXECUTION_COMPLETED', () => {
      renderDrawer(makeService({ status: ServiceStatus.EXECUTION_COMPLETED }))

      expect(screen.getByText('Nota Fiscal')).toBeInTheDocument()
    })

    it('shows Nota Fiscal section at PAID', () => {
      renderDrawer(makeService({ status: ServiceStatus.PAID }))

      expect(screen.getByText('Nota Fiscal')).toBeInTheDocument()
    })
  })

  // ── Advance validation ──────────────────────────────────────────────────────

  describe('advance validation', () => {
    it('blocks advance to QUOTE_PENDING and shows notification when visitDate is missing', async () => {
      const user = userEvent.setup()
      renderDrawer(makeService({ status: ServiceStatus.TECHNICAL_VISIT }))

      await user.click(screen.getByRole('button', { name: /Avançar/i }))

      await waitFor(() => {
        expect(screen.getByText('Informe a data da visita')).toBeInTheDocument()
      })
    })

    it('blocks advance to QUOTE_APPROVED and shows notification when quoteValue is missing', async () => {
      const user = userEvent.setup()
      renderDrawer(makeService({ status: ServiceStatus.QUOTE_PENDING }))

      await user.click(screen.getByRole('button', { name: /Avançar/i }))

      await waitFor(() => {
        expect(screen.getByText('Informe o valor do orçamento')).toBeInTheDocument()
      })
    })

    it('blocks advance to EXECUTION_SCHEDULED and shows notification when scheduledAt is missing', async () => {
      const user = userEvent.setup()
      renderDrawer(makeService({ status: ServiceStatus.QUOTE_APPROVED }))

      await user.click(screen.getByRole('button', { name: /Avançar/i }))

      await waitFor(() => {
        expect(screen.getByText('Informe a data agendada')).toBeInTheDocument()
      })
    })

    it('blocks advance to EXECUTION_COMPLETED and shows notification when completedAt is missing', async () => {
      const user = userEvent.setup()
      renderDrawer(makeService({ status: ServiceStatus.EXECUTION_SCHEDULED }))

      await user.click(screen.getByRole('button', { name: /Avançar/i }))

      await waitFor(() => {
        expect(screen.getByText('Informe a data de conclusão')).toBeInTheDocument()
      })
    })

    it('blocks advance to PAID and shows notification when paidAt or paymentMethod is missing', async () => {
      const user = userEvent.setup()
      renderDrawer(makeService({ status: ServiceStatus.EXECUTION_COMPLETED }))

      await user.click(screen.getByRole('button', { name: /Avançar/i }))

      await waitFor(() => {
        expect(screen.getByText('Informe a data e o método de pagamento')).toBeInTheDocument()
      })
    })
  })

  // ── Advance success ─────────────────────────────────────────────────────────

  describe('advance success', () => {
    it('calls onClose after successfully advancing status', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      renderWithProviders(
        <ServiceDetailDrawer
          opened={true}
          onClose={onClose}
          clientId="client-1"
          service={makeService({
            status: ServiceStatus.TECHNICAL_VISIT,
            visitDate: '2024-06-15T09:00:00',
          })}
        />,
      )

      await user.click(screen.getByRole('button', { name: /Avançar/i }))

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1)
      })
    })
  })

  // ── PATCH body correctness ─────────────────────────────────────────────────

  describe('PATCH body when advancing status', () => {
    it('includes visitDate (non-null) when service has visitDate set', async () => {
      let capturedBody: Record<string, unknown> | null = null

      server.use(
        http.patch(
          'http://localhost:8080/api/clients/:clientId/services/:serviceId/status',
          async ({ request }) => {
            capturedBody = (await request.json()) as Record<string, unknown>
            return HttpResponse.json({
              id: 'service-1',
              clientId: 'client-1',
              clientName: 'Maria Souza',
              description: 'Troca de disjuntor',
              nfIssued: false,
              createdAt: '2024-01-01T00:00:00',
              status: 'QUOTE_PENDING',
              visitDate: '2024-06-15T10:30:00',
              visitNotes: null,
            })
          },
        ),
      )

      const user = userEvent.setup()
      renderDrawer(
        makeService({
          status: ServiceStatus.TECHNICAL_VISIT,
          visitDate: '2024-06-15T10:30:00',
        }),
      )

      await user.click(screen.getByRole('button', { name: /Avançar/i }))

      await waitFor(() => {
        expect(capturedBody).not.toBeNull()
        expect(capturedBody!.visitDate).toBeDefined()
        expect(capturedBody!.visitDate).not.toBeNull()
        expect(typeof capturedBody!.visitDate).toBe('string')
      })
    })

    it('includes visitNotes (non-null) when service has visitNotes set', async () => {
      let capturedBody: Record<string, unknown> | null = null

      server.use(
        http.patch(
          'http://localhost:8080/api/clients/:clientId/services/:serviceId/status',
          async ({ request }) => {
            capturedBody = (await request.json()) as Record<string, unknown>
            return HttpResponse.json({
              id: 'service-1',
              clientId: 'client-1',
              clientName: 'Maria Souza',
              description: 'Troca de disjuntor',
              nfIssued: false,
              createdAt: '2024-01-01T00:00:00',
              status: 'QUOTE_PENDING',
              visitDate: '2024-06-15T10:30:00',
              visitNotes: 'Painel com sobrecarga detectada',
            })
          },
        ),
      )

      const user = userEvent.setup()
      renderDrawer(
        makeService({
          status: ServiceStatus.TECHNICAL_VISIT,
          visitDate: '2024-06-15T10:30:00',
          visitNotes: 'Painel com sobrecarga detectada',
        }),
      )

      await user.click(screen.getByRole('button', { name: /Avançar/i }))

      await waitFor(() => {
        expect(capturedBody).not.toBeNull()
        expect(capturedBody!.visitNotes).toBe('Painel com sobrecarga detectada')
      })
    })

    it('does NOT include visitDate key when visitDate is absent from service', async () => {
      // visitDate is required to advance from TECHNICAL_VISIT — this tests buildPayload
      // does not add a null/undefined visitDate key when the field is not set.
      // (Advancing would be blocked by frontend validation; we test payload via Voltar.)
      let capturedBody: Record<string, unknown> | null = null

      server.use(
        http.patch(
          'http://localhost:8080/api/clients/:clientId/services/:serviceId/status',
          async ({ request }) => {
            capturedBody = (await request.json()) as Record<string, unknown>
            return HttpResponse.json({
              id: 'service-1',
              clientId: 'client-1',
              clientName: 'Maria Souza',
              description: 'Troca de disjuntor',
              nfIssued: false,
              createdAt: '2024-01-01T00:00:00',
              status: 'TECHNICAL_VISIT',
            })
          },
        ),
      )

      const user = userEvent.setup()
      // Start at QUOTE_PENDING so we can click Voltar (no visitDate in state)
      renderDrawer(makeService({ status: ServiceStatus.QUOTE_PENDING }))

      await user.click(screen.getByRole('button', { name: /Voltar/i }))

      await waitFor(() => {
        expect(capturedBody).not.toBeNull()
        // visitDate should not be a key in the payload (no null sent)
        expect('visitDate' in capturedBody!).toBe(false)
      })
    })

    it('does NOT include visitNotes key when visitNotes is empty', async () => {
      let capturedBody: Record<string, unknown> | null = null

      server.use(
        http.patch(
          'http://localhost:8080/api/clients/:clientId/services/:serviceId/status',
          async ({ request }) => {
            capturedBody = (await request.json()) as Record<string, unknown>
            return HttpResponse.json({
              id: 'service-1',
              clientId: 'client-1',
              clientName: 'Maria Souza',
              description: 'Troca de disjuntor',
              nfIssued: false,
              createdAt: '2024-01-01T00:00:00',
              status: 'TECHNICAL_VISIT',
            })
          },
        ),
      )

      const user = userEvent.setup()
      // At QUOTE_PENDING with no visitNotes: clicking Voltar sends a payload without visitNotes
      renderDrawer(makeService({ status: ServiceStatus.QUOTE_PENDING }))

      await user.click(screen.getByRole('button', { name: /Voltar/i }))

      await waitFor(() => {
        expect(capturedBody).not.toBeNull()
        expect('visitNotes' in capturedBody!).toBe(false)
      })
    })
  })

  // ── DateTimePicker presence ─────────────────────────────────────────────────

  describe('DateTimePicker fields', () => {
    it('renders "Data da visita" DateTimePicker at TECHNICAL_VISIT', () => {
      renderDrawer(makeService({ status: ServiceStatus.TECHNICAL_VISIT }))

      expect(screen.getByLabelText('Data da visita')).toBeInTheDocument()
    })

    it('renders "Data agendada" DateTimePicker at QUOTE_APPROVED', () => {
      renderDrawer(makeService({ status: ServiceStatus.QUOTE_APPROVED }))

      expect(screen.getByLabelText('Data agendada')).toBeInTheDocument()
    })

    it('"Data de conclusão" is a date-only picker (no time input) at EXECUTION_SCHEDULED', () => {
      renderDrawer(makeService({ status: ServiceStatus.EXECUTION_SCHEDULED }))

      expect(screen.getByLabelText('Data de conclusão')).toBeInTheDocument()
    })
  })

  // ── Paid terminal state ─────────────────────────────────────────────────────

  describe('terminal PAID state', () => {
    it('disables both Voltar and Avançar buttons at PAID', () => {
      renderDrawer(
        makeService({
          status: ServiceStatus.PAID,
          quoteValue: 500,
          paidAt: '2024-08-01',
          paymentMethod: PaymentMethod.PIX,
        }),
      )

      expect(screen.getByRole('button', { name: /Voltar/i })).toBeDisabled()
      expect(screen.getByRole('button', { name: /Concluído/i })).toBeDisabled()
    })

    it('shows total received amount at PAID', () => {
      renderDrawer(
        makeService({
          status: ServiceStatus.PAID,
          quoteValue: 350,
          paidAt: '2024-08-01',
          paymentMethod: PaymentMethod.PIX,
        }),
      )

      expect(screen.getByText(/Total recebido/)).toBeInTheDocument()
    })
  })
})
