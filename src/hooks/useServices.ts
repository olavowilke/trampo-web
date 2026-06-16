import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import type { AxiosError } from 'axios'
import api from '../lib/api'
import type { Service, PageResponse, ServiceStatus, ApiError, PaymentMethod } from '../types'

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

export interface UpdateServiceData {
  description?: string
  status?: ServiceStatus
  visitDate?: string
  visitNotes?: string
  quoteValue?: number
  quoteNotes?: string
  scheduledAt?: string
  completedAt?: string
  completionNotes?: string
  paidAt?: string
  paymentMethod?: PaymentMethod | string
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

export function useUpdateService(clientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ serviceId, data }: { serviceId: string; data: UpdateServiceData }) =>
      api
        .put<Service>(`/api/clients/${clientId}/services/${serviceId}`, data)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SERVICES_KEY, clientId] })
    },
    onError: (error: AxiosError<ApiError>) => {
      notifications.show({
        title: 'Erro ao atualizar serviço',
        message: extractMessage(error, 'Não foi possível atualizar o serviço'),
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
