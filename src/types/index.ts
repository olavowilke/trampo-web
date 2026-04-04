// ── Enums ──────────────────────────────────────────────────────────────────

export enum ServiceStatus {
  TECHNICAL_VISIT = 'TECHNICAL_VISIT',
  QUOTE_PENDING = 'QUOTE_PENDING',
  QUOTE_APPROVED = 'QUOTE_APPROVED',
  EXECUTION_SCHEDULED = 'EXECUTION_SCHEDULED',
  EXECUTION_COMPLETED = 'EXECUTION_COMPLETED',
  PAID = 'PAID',
}

export const ServiceStatusLabel: Record<ServiceStatus, string> = {
  [ServiceStatus.TECHNICAL_VISIT]: 'Visita Técnica',
  [ServiceStatus.QUOTE_PENDING]: 'Orçamento a Fazer',
  [ServiceStatus.QUOTE_APPROVED]: 'Orçamento Aprovado',
  [ServiceStatus.EXECUTION_SCHEDULED]: 'Execução Agendada',
  [ServiceStatus.EXECUTION_COMPLETED]: 'Execução Concluída',
  [ServiceStatus.PAID]: 'Pago',
}

export const ServiceStatusColor: Record<ServiceStatus, string> = {
  [ServiceStatus.TECHNICAL_VISIT]: 'gray',
  [ServiceStatus.QUOTE_PENDING]: 'yellow',
  [ServiceStatus.QUOTE_APPROVED]: 'blue',
  [ServiceStatus.EXECUTION_SCHEDULED]: 'violet',
  [ServiceStatus.EXECUTION_COMPLETED]: 'orange',
  [ServiceStatus.PAID]: 'green',
}

// Ordem para o stepper
export const SERVICE_STATUS_ORDER: ServiceStatus[] = [
  ServiceStatus.TECHNICAL_VISIT,
  ServiceStatus.QUOTE_PENDING,
  ServiceStatus.QUOTE_APPROVED,
  ServiceStatus.EXECUTION_SCHEDULED,
  ServiceStatus.EXECUTION_COMPLETED,
  ServiceStatus.PAID,
]

export enum PaymentMethod {
  PIX = 'PIX',
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export const PaymentMethodLabel: Record<PaymentMethod, string> = {
  [PaymentMethod.PIX]: 'Pix',
  [PaymentMethod.CASH]: 'Dinheiro',
  [PaymentMethod.CREDIT_CARD]: 'Cartão de Crédito',
  [PaymentMethod.DEBIT_CARD]: 'Cartão de Débito',
  [PaymentMethod.BANK_TRANSFER]: 'Transferência Bancária',
}

// ── Modelos ────────────────────────────────────────────────────────────────

export interface Client {
  id: string
  name: string
  phone: string
  cpfCnpj?: string
  zipCode?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  isRecurring: boolean
  createdAt: string
  activeServicesCount: number
}

export interface Service {
  id: string
  clientId: string
  clientName: string
  description: string
  status: ServiceStatus
  visitDate?: string
  visitNotes?: string
  quoteValue?: number
  quoteNotes?: string
  quoteFileUrl?: string | null
  scheduledAt?: string
  completedAt?: string
  completionNotes?: string
  paidAt?: string
  paymentMethod?: PaymentMethod
  nfIssued: boolean
  nfFileUrl?: string | null
  createdAt: string
}

// ── Responses ──────────────────────────────────────────────────────────────

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tenantId: string
  name: string
  businessName: string
}

export interface AuthUser {
  tenantId: string
  name: string
  businessName: string
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface NfUrlResponse {
  url: string
  expiresIn: number
}

export interface ApiError {
  error: string
  message?: string
  fields?: { field: string; message: string }[]
}
