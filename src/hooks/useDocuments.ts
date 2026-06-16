import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import api from '../lib/api'
import type { Document, DocumentTag, NfUrlResponse } from '../types'

const MAX_BATCH = 20
const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_SIZE = 10 * 1024 * 1024

interface FileSpec {
  fileName: string
  contentType: string
  sizeBytes: number
}

interface UploadUrlsResponse {
  items: { documentId: string; uploadUrl: string; objectName: string }[]
}

export function useListDocuments(clientId: string, serviceId: string | null) {
  return useQuery({
    queryKey: ['documents', clientId, serviceId],
    queryFn: () =>
      api
        .get<Document[]>(`/api/clients/${clientId}/services/${serviceId}/documents`)
        .then((r) => r.data),
    enabled: !!serviceId,
  })
}

export function useUploadDocuments(clientId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      serviceId,
      tag,
      files,
    }: {
      serviceId: string
      tag: DocumentTag
      files: File[]
    }) => {
      if (files.length === 0) throw new Error('Selecione pelo menos um arquivo')
      if (files.length > MAX_BATCH) {
        throw new Error(`Máximo de ${MAX_BATCH} arquivos por envio`)
      }

      const rejected = files.filter(
        (f) => !ALLOWED_MIME.includes(f.type) || f.size > MAX_SIZE,
      )
      if (rejected.length > 0) {
        throw new Error(
          `${rejected.length} arquivo(s) inválido(s): use PDF/JPG/PNG até 10MB`,
        )
      }

      const specs: FileSpec[] = files.map((f) => ({
        fileName: f.name,
        contentType: f.type,
        sizeBytes: f.size,
      }))

      const { data: urls } = await api.post<UploadUrlsResponse>(
        `/api/clients/${clientId}/services/${serviceId}/documents/upload-urls`,
        { tag, files: specs },
      )

      const uploads = urls.items.map((item, idx) =>
        fetch(item.uploadUrl, {
          method: 'PUT',
          body: files[idx],
          headers: { 'Content-Type': files[idx].type },
        }),
      )

      const results = await Promise.allSettled(uploads)

      const successful: string[] = []
      const failedNames: string[] = []
      results.forEach((r, i) => {
        const ok = r.status === 'fulfilled' && r.value.ok
        if (ok) successful.push(urls.items[i].documentId)
        else failedNames.push(files[i].name)
      })

      if (successful.length > 0) {
        await api.post(
          `/api/clients/${clientId}/services/${serviceId}/documents/confirm`,
          { documentIds: successful },
        )
      }

      return { successful: successful.length, failedNames }
    },
    onSuccess: ({ successful, failedNames }, { serviceId }) => {
      qc.invalidateQueries({ queryKey: ['documents', clientId, serviceId] })
      qc.invalidateQueries({ queryKey: ['services', clientId] })

      if (successful > 0) {
        notifications.show({
          title: `${successful} documento(s) anexado(s)`,
          message: '',
          color: 'green',
        })
      }
      if (failedNames.length > 0) {
        notifications.show({
          title: `${failedNames.length} arquivo(s) falharam`,
          message: failedNames.join(', '),
          color: 'red',
        })
      }
    },
    onError: (e: Error) => {
      notifications.show({
        title: 'Erro ao enviar documentos',
        message: e.message,
        color: 'red',
      })
    },
  })
}

export function useDownloadDocumentUrl(clientId: string) {
  return useMutation({
    mutationFn: ({
      serviceId,
      documentId,
    }: {
      serviceId: string
      documentId: string
    }) =>
      api
        .get<NfUrlResponse>(
          `/api/clients/${clientId}/services/${serviceId}/documents/${documentId}/download-url`,
        )
        .then((r) => r.data),
  })
}

export function useDeleteDocument(clientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      serviceId,
      documentId,
    }: {
      serviceId: string
      documentId: string
    }) =>
      api.delete(
        `/api/clients/${clientId}/services/${serviceId}/documents/${documentId}`,
      ),
    onSuccess: (_, { serviceId }) => {
      qc.invalidateQueries({ queryKey: ['documents', clientId, serviceId] })
      qc.invalidateQueries({ queryKey: ['services', clientId] })
      notifications.show({
        title: 'Documento removido',
        message: '',
        color: 'green',
      })
    },
    onError: () => {
      notifications.show({
        title: 'Erro ao remover documento',
        message: 'Tente novamente em instantes',
        color: 'red',
      })
    },
  })
}
