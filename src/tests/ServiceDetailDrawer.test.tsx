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
import { ServiceStatus, PaymentMethod, PaymentMethodLabel, SERVICE_STATUS_ORDER } from '../types'
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
  // The drawer is a single editable form: every field is always rendered so the
  // user can fill/correct any of them regardless of the current status.

  describe('fields rendered (all fields are always editable)', () => {
    it('shows visitDate and visitNotes at TECHNICAL_VISIT', () => {
      renderDrawer(makeService({ status: ServiceStatus.TECHNICAL_VISIT }))

      expect(screen.getByLabelText('Data da visita')).toBeInTheDocument()
      expect(screen.getByLabelText('Notas da visita')).toBeInTheDocument()
    })

    it('shows scheduledAt at QUOTE_APPROVED', () => {
      renderDrawer(makeService({ status: ServiceStatus.QUOTE_APPROVED }))

      expect(screen.getByLabelText('Data agendada')).toBeInTheDocument()
    })

    it('shows completedAt and completionNotes at EXECUTION_SCHEDULED', () => {
      renderDrawer(makeService({ status: ServiceStatus.EXECUTION_SCHEDULED }))

      expect(screen.getByLabelText('Data de conclusão')).toBeInTheDocument()
      expect(screen.getByLabelText('Notas de conclusão')).toBeInTheDocument()
    })

    it('shows paidAt and paymentMethod at EXECUTION_COMPLETED', () => {
      renderDrawer(makeService({ status: ServiceStatus.EXECUTION_COMPLETED }))

      expect(screen.getByLabelText('Data do pagamento')).toBeInTheDocument()
      expect(screen.getAllByLabelText('Método de pagamento').length).toBeGreaterThan(0)
    })

    // Every field is present regardless of the status the service is currently in.
    SERVICE_STATUS_ORDER.forEach((status) => {
      it(`renders all editable fields at ${status}`, () => {
        renderDrawer(makeService({ status }))

        expect(screen.getAllByLabelText('Status').length).toBeGreaterThan(0)
        expect(screen.getByLabelText('Data da visita')).toBeInTheDocument()
        expect(screen.getByLabelText('Notas da visita')).toBeInTheDocument()
        expect(screen.getByLabelText('Valor do orçamento (R$)')).toBeInTheDocument()
        expect(screen.getByLabelText('Notas do orçamento')).toBeInTheDocument()
        expect(screen.getByLabelText('Data agendada')).toBeInTheDocument()
        expect(screen.getByLabelText('Data de conclusão')).toBeInTheDocument()
        expect(screen.getByLabelText('Notas de conclusão')).toBeInTheDocument()
        expect(screen.getByLabelText('Data do pagamento')).toBeInTheDocument()
        expect(screen.getAllByLabelText('Método de pagamento').length).toBeGreaterThan(0)
      })
    })
  })

  // ── Save success ────────────────────────────────────────────────────────────

  describe('save', () => {
    it('calls onClose after successfully saving', async () => {
      server.use(
        http.put(
          'http://localhost:8080/api/clients/:clientId/services/:serviceId',
          () =>
            HttpResponse.json({
              id: 'service-1',
              clientId: 'client-1',
              clientName: 'Maria Souza',
              description: 'Troca de disjuntor',
              nfIssued: false,
              createdAt: '2024-01-01T00:00:00',
              status: 'TECHNICAL_VISIT',
            }),
        ),
      )

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

      await user.click(screen.getByRole('button', { name: /Salvar/i }))

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1)
      })
    })

    it('shows a success notification after saving', async () => {
      server.use(
        http.put(
          'http://localhost:8080/api/clients/:clientId/services/:serviceId',
          () =>
            HttpResponse.json({
              id: 'service-1',
              clientId: 'client-1',
              clientName: 'Maria Souza',
              description: 'Troca de disjuntor',
              nfIssued: false,
              createdAt: '2024-01-01T00:00:00',
              status: 'TECHNICAL_VISIT',
            }),
        ),
      )

      const user = userEvent.setup()
      renderDrawer(makeService({ status: ServiceStatus.TECHNICAL_VISIT }))

      await user.click(screen.getByRole('button', { name: /Salvar/i }))

      await waitFor(() => {
        expect(screen.getByText('Serviço atualizado')).toBeInTheDocument()
      })
    })
  })

  // ── PUT body correctness ────────────────────────────────────────────────────

  describe('PUT body when saving', () => {
    function capturePutBody(ref: { body: Record<string, unknown> | null }) {
      server.use(
        http.put(
          'http://localhost:8080/api/clients/:clientId/services/:serviceId',
          async ({ request }) => {
            ref.body = (await request.json()) as Record<string, unknown>
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
    }

    it('always includes the current status', async () => {
      const ref: { body: Record<string, unknown> | null } = { body: null }
      capturePutBody(ref)

      const user = userEvent.setup()
      renderDrawer(makeService({ status: ServiceStatus.QUOTE_PENDING }))

      await user.click(screen.getByRole('button', { name: /Salvar/i }))

      await waitFor(() => {
        expect(ref.body).not.toBeNull()
        expect(ref.body!.status).toBe('QUOTE_PENDING')
      })
    })

    it('includes visitDate (non-null string) when service has visitDate set', async () => {
      const ref: { body: Record<string, unknown> | null } = { body: null }
      capturePutBody(ref)

      const user = userEvent.setup()
      renderDrawer(
        makeService({
          status: ServiceStatus.TECHNICAL_VISIT,
          visitDate: '2024-06-15T10:30:00',
        }),
      )

      await user.click(screen.getByRole('button', { name: /Salvar/i }))

      await waitFor(() => {
        expect(ref.body).not.toBeNull()
        expect(ref.body!.visitDate).toBeDefined()
        expect(ref.body!.visitDate).not.toBeNull()
        expect(typeof ref.body!.visitDate).toBe('string')
      })
    })

    it('includes visitNotes when service has visitNotes set', async () => {
      const ref: { body: Record<string, unknown> | null } = { body: null }
      capturePutBody(ref)

      const user = userEvent.setup()
      renderDrawer(
        makeService({
          status: ServiceStatus.TECHNICAL_VISIT,
          visitDate: '2024-06-15T10:30:00',
          visitNotes: 'Painel com sobrecarga detectada',
        }),
      )

      await user.click(screen.getByRole('button', { name: /Salvar/i }))

      await waitFor(() => {
        expect(ref.body).not.toBeNull()
        expect(ref.body!.visitNotes).toBe('Painel com sobrecarga detectada')
      })
    })

    it('does NOT include visitDate key when visitDate is absent from service', async () => {
      const ref: { body: Record<string, unknown> | null } = { body: null }
      capturePutBody(ref)

      const user = userEvent.setup()
      renderDrawer(makeService({ status: ServiceStatus.QUOTE_PENDING }))

      await user.click(screen.getByRole('button', { name: /Salvar/i }))

      await waitFor(() => {
        expect(ref.body).not.toBeNull()
        // buildPayload omits the key entirely (no null sent) when unset
        expect('visitDate' in ref.body!).toBe(false)
      })
    })

    it('does NOT include visitNotes key when visitNotes is empty', async () => {
      const ref: { body: Record<string, unknown> | null } = { body: null }
      capturePutBody(ref)

      const user = userEvent.setup()
      renderDrawer(makeService({ status: ServiceStatus.QUOTE_PENDING }))

      await user.click(screen.getByRole('button', { name: /Salvar/i }))

      await waitFor(() => {
        expect(ref.body).not.toBeNull()
        expect('visitNotes' in ref.body!).toBe(false)
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

  // ── PAID state ───────────────────────────────────────────────────────────────

  describe('PAID state', () => {
    it('pre-fills payment fields when service is PAID', () => {
      renderDrawer(
        makeService({
          status: ServiceStatus.PAID,
          quoteValue: 350,
          paidAt: '2024-08-01',
          paymentMethod: PaymentMethod.PIX,
        }),
      )

      // paymentMethod Select shows the localized label of the saved method
      expect(screen.getByDisplayValue(PaymentMethodLabel[PaymentMethod.PIX])).toBeInTheDocument()
    })

    it('keeps Salvar enabled at PAID so the user can still edit', () => {
      renderDrawer(
        makeService({
          status: ServiceStatus.PAID,
          quoteValue: 500,
          paidAt: '2024-08-01',
          paymentMethod: PaymentMethod.PIX,
        }),
      )

      expect(screen.getByRole('button', { name: /Salvar/i })).toBeEnabled()
    })
  })
})
