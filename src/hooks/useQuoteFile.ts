import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import type { AxiosError } from 'axios'
import api from '../lib/api'
import type { ApiError, NfUrlResponse } from '../types'

function extractMessage(error: AxiosError<ApiError>, fallback: string): string {
  return error.response?.data?.message ?? fallback
}

export function useUploadQuoteFile(clientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ serviceId, file }: { serviceId: string; file: File }) => {
      // Passo 1: obter signed URL de escrita do backend
      const { data: { uploadUrl } } = await api.get<{ uploadUrl: string; objectName: string }>(
        `/api/clients/${clientId}/services/${serviceId}/quote-file/upload-url`
      )

      // Passo 2: upload direto para o GCS (sem Authorization — auth está na URL)
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': 'application/pdf' },
      })
      if (!uploadResponse.ok) {
        throw new Error(`Falha no upload para o storage: ${uploadResponse.status}`)
      }

      // Passo 3: confirmar upload no backend
      const { data } = await api.post(
        `/api/clients/${clientId}/services/${serviceId}/quote-file/confirm`
      )
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services', clientId] })
      notifications.show({ title: 'PDF de orçamento enviado', message: '', color: 'green' })
    },
    onError: () => {
      notifications.show({
        title: 'Erro ao enviar PDF',
        message: 'Verifique se o arquivo é um PDF válido (máx. 10MB)',
        color: 'red',
      })
    },
  })
}

export function useDeleteQuoteFile(clientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (serviceId: string) =>
      api
        .delete(`/api/clients/${clientId}/services/${serviceId}/quote-file`)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services', clientId] })
      notifications.show({ title: 'PDF de orçamento removido', message: '', color: 'green' })
    },
    onError: (error: AxiosError<ApiError>) => {
      notifications.show({
        title: 'Erro ao remover PDF',
        message: extractMessage(error, 'Não foi possível remover o PDF de orçamento'),
        color: 'red',
      })
    },
  })
}

export function useDownloadQuoteFileUrl(clientId: string) {
  return useMutation({
    mutationFn: (serviceId: string) =>
      api
        .get<NfUrlResponse>(`/api/clients/${clientId}/services/${serviceId}/quote-file`)
        .then((r) => r.data),
  })
}
