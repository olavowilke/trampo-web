import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { ServiceDetailDrawer } from '../components/services/ServiceDetailDrawer'
import { renderWithProviders } from './helpers/renderWithProviders'
import type { Service } from '../types'
import { ServiceStatus, PaymentMethod } from '../types'

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

/** Renders the drawer with all required providers and a stable query client,
 *  returning the rerender function for re-open tests. */
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

/** Shortcut for simple renders where re-render isn't needed. */
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

    it('pre-fills visit time when service has visitDate with time', () => {
      renderDrawer(
        makeService({
          status: ServiceStatus.QUOTE_PENDING,
          visitDate: '2024-06-15T10:30:00',
        }),
      )

      // TimeInput renders <input type="time"> — value is HH:MM
      const timeInput = screen.getByLabelText('Hora da visita') as HTMLInputElement
      expect(timeInput.value).toBe('10:30')
    })

    it('pre-fills scheduled time when service has scheduledAt with time', () => {
      renderDrawer(
        makeService({
          status: ServiceStatus.EXECUTION_SCHEDULED,
          scheduledAt: '2024-07-20T14:00:00',
        }),
      )

      const timeInput = screen.getByLabelText('Hora agendada') as HTMLInputElement
      expect(timeInput.value).toBe('14:00')
    })

    it('re-populates fields when drawer re-opens with the same service reference', async () => {
      const service = makeService({
        status: ServiceStatus.QUOTE_PENDING,
        visitNotes: 'Notas importantes da visita',
        visitDate: '2024-06-15T10:00:00',
      })

      const { rerender } = renderDrawerWithRerender({ opened: false, service })

      // Fields are not visible when drawer is closed
      expect(screen.queryByDisplayValue('Notas importantes da visita')).not.toBeInTheDocument()

      // Re-open with the same object reference (simulates clicking same card again)
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

    it('pre-fills quoteValue when service has quoteValue set', () => {
      renderDrawer(
        makeService({
          status: ServiceStatus.QUOTE_APPROVED,
          quoteValue: 350,
          quoteNotes: 'Inclui peças',
        }),
      )

      expect(screen.getByDisplayValue('Inclui peças')).toBeInTheDocument()
    })

    it('pre-fills paymentMethod when service is PAID', () => {
      renderDrawer(
        makeService({
          status: ServiceStatus.PAID,
          paymentMethod: PaymentMethod.PIX,
          paidAt: '2024-08-01',
        }),
      )

      // The Select should show the label for PIX
      expect(screen.getByText('Pix')).toBeInTheDocument()
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
      expect(screen.getByLabelText('Hora agendada')).toBeInTheDocument()
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
      // getAllByLabelText because Mantine Select's portal renders a listbox also linked to the label
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

  // ── Advance succeeds ────────────────────────────────────────────────────────

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
            visitDate: '2024-06-15T09:00:00', // pre-filled so validation passes
          })}
        />,
      )

      await user.click(screen.getByRole('button', { name: /Avançar/i }))

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1)
      })
    })
  })

  // ── TimePicker visibility ───────────────────────────────────────────────────

  describe('TimePicker presence', () => {
    it('renders Hora da visita TimePicker alongside the date picker', () => {
      renderDrawer(makeService({ status: ServiceStatus.TECHNICAL_VISIT }))

      expect(screen.getByLabelText('Hora da visita')).toBeInTheDocument()
    })

    it('renders Hora agendada TimePicker when at QUOTE_APPROVED', () => {
      renderDrawer(makeService({ status: ServiceStatus.QUOTE_APPROVED }))

      expect(screen.getByLabelText('Hora agendada')).toBeInTheDocument()
    })

    it('Hora da visita TimePicker is disabled when no date is selected', () => {
      renderDrawer(makeService({ status: ServiceStatus.TECHNICAL_VISIT }))

      expect(screen.getByLabelText('Hora da visita')).toBeDisabled()
    })

    it('Hora da visita TimePicker is enabled when a date is pre-filled', () => {
      renderDrawer(
        makeService({
          status: ServiceStatus.QUOTE_PENDING,
          visitDate: '2024-06-15T09:00:00',
        }),
      )

      expect(screen.getByLabelText('Hora da visita')).not.toBeDisabled()
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
