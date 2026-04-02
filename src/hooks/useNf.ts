import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import type { AxiosError } from 'axios'
import api from '../lib/api'
import type { ApiError } from '../types'

function extractMessage(error: AxiosError<ApiError>, fallback: string): string {
  return error.response?.data?.message ?? fallback
}

export function useUploadNf(clientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ serviceId, file }: { serviceId: string; file: File }) => {
      const form = new FormData()
      form.append('file', file)
      return api
        .post(`/api/clients/${clientId}/services/${serviceId}/nf`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services', clientId] })
      notifications.show({ title: 'NF enviada', message: '', color: 'green' })
    },
    onError: (error: AxiosError<ApiError>) => {
      notifications.show({
        title: 'Erro ao enviar NF',
        message: extractMessage(error, 'Arquivo inválido ou muito grande (max 10MB)'),
        color: 'red',
      })
    },
  })
}

export function useDeleteNf(clientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (serviceId: string) =>
      api.delete(`/api/clients/${clientId}/services/${serviceId}/nf`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services', clientId] })
      notifications.show({ title: 'NF removida', message: '', color: 'green' })
    },
    onError: (error: AxiosError<ApiError>) => {
      notifications.show({
        title: 'Erro ao remover NF',
        message: extractMessage(error, 'Não foi possível remover a NF'),
        color: 'red',
      })
    },
  })
}

export function useDownloadNfUrl(clientId: string) {
  return useMutation({
    mutationFn: (serviceId: string) =>
      api
        .get<{ url: string }>(`/api/clients/${clientId}/services/${serviceId}/nf`)
        .then((r) => r.data),
  })
}
