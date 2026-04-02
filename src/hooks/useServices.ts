import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import type { AxiosError } from 'axios'
import api from '../lib/api'
import type { Service, PageResponse, ServiceStatus, ApiError } from '../types'

const SERVICES_KEY = 'services'

// ── Requests ────────────────────────────────────────────────────────────────

export interface ServicesFilter {
  status?: ServiceStatus | ''
  page?: number
  size?: number
}

export interface CreateServiceData {
  description: string
}

export interface UpdateStatusData {
  targetStatus: ServiceStatus
  quoteValue?: number
  quoteNotes?: string
  visitDate?: string
  visitNotes?: string
  scheduledAt?: string
  completedAt?: string
  completionNotes?: string
  paidAt?: string
  paymentMethod?: string
}

// ── Queries ──────────────────────────────────────────────────────────────────

export function useServices(clientId: string, filter: ServicesFilter = {}) {
  const { status = '', page = 0, size = 20 } = filter
  return useQuery({
    queryKey: [SERVICES_KEY, clientId, { status, page, size }],
    queryFn: () =>
      api
        .get<PageResponse<Service>>(`/api/clients/${clientId}/services`, {
          params: { ...(status ? { status } : {}), page, size },
        })
        .then((r) => r.data),
    enabled: !!clientId,
  })
}

// ── Mutations ────────────────────────────────────────────────────────────────

function extractMessage(error: AxiosError<ApiError>, fallback: string): string {
  return error.response?.data?.message ?? fallback
}

export function useCreateService(clientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateServiceData) =>
      api.post<Service>(`/api/clients/${clientId}/services`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SERVICES_KEY, clientId] })
      notifications.show({ title: 'Serviço criado', message: '', color: 'green' })
    },
    onError: (error: AxiosError<ApiError>) => {
      notifications.show({
        title: 'Erro ao criar serviço',
        message: extractMessage(error, 'Não foi possível criar o serviço'),
        color: 'red',
      })
    },
  })
}

export function useUpdateServiceStatus(clientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ serviceId, data }: { serviceId: string; data: UpdateStatusData }) =>
      api
        .patch<Service>(`/api/clients/${clientId}/services/${serviceId}/status`, data)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SERVICES_KEY, clientId] })
    },
    onError: (error: AxiosError<ApiError>) => {
      notifications.show({
        title: 'Erro ao atualizar status',
        message: extractMessage(error, 'Transição de status inválida'),
        color: 'red',
      })
    },
  })
}

export function useDeleteService(clientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (serviceId: string) =>
      api.delete(`/api/clients/${clientId}/services/${serviceId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SERVICES_KEY, clientId] })
      notifications.show({ title: 'Serviço removido', message: '', color: 'green' })
    },
    onError: (error: AxiosError<ApiError>) => {
      notifications.show({
        title: 'Erro ao remover serviço',
        message: extractMessage(error, 'Não foi possível remover o serviço'),
        color: 'red',
      })
    },
  })
}
