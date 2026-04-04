import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import type { AxiosError } from 'axios'
import api from '../lib/api'
import type { Client, PageResponse, ApiError } from '../types'

const CLIENTS_KEY = 'clients'

// ── Requests ────────────────────────────────────────────────────────────────

export interface ClientsFilter {
  search?: string
  page?: number
  size?: number
}

export interface ClientFormData {
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
  isRecurring?: boolean
}

// ── Queries ─────────────────────────────────────────────────────────────────

export function useClients(filter: ClientsFilter = {}) {
  const { search = '', page = 0, size = 20 } = filter
  return useQuery({
    queryKey: [CLIENTS_KEY, { search, page, size }],
    queryFn: () =>
      api
        .get<PageResponse<Client>>('/api/clients', { params: { search, page, size } })
        .then((r) => r.data),
  })
}

// ── Mutations ────────────────────────────────────────────────────────────────

function extractMessage(error: AxiosError<ApiError>, fallback: string): string {
  return error.response?.data?.message ?? fallback
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ClientFormData) =>
      api.post<Client>('/api/clients', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CLIENTS_KEY] })
      notifications.show({ title: 'Cliente criado', message: '', color: 'green' })
    },
    onError: (error: AxiosError<ApiError>) => {
      notifications.show({
        title: 'Erro ao criar cliente',
        message: extractMessage(error, 'Não foi possível criar o cliente'),
        color: 'red',
      })
    },
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientFormData }) =>
      api.put<Client>(`/api/clients/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CLIENTS_KEY] })
      notifications.show({ title: 'Cliente atualizado', message: '', color: 'green' })
    },
    onError: (error: AxiosError<ApiError>) => {
      notifications.show({
        title: 'Erro ao atualizar cliente',
        message: extractMessage(error, 'Não foi possível atualizar o cliente'),
        color: 'red',
      })
    },
  })
}

export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/clients/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CLIENTS_KEY] })
      notifications.show({ title: 'Cliente removido', message: '', color: 'green' })
    },
    onError: (error: AxiosError<ApiError>) => {
      notifications.show({
        title: 'Erro ao remover cliente',
        message: extractMessage(error, 'Não foi possível remover o cliente'),
        color: 'red',
      })
    },
  })
}
