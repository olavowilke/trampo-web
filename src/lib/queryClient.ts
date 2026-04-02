import { QueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { AxiosError } from 'axios'
import type { ApiError } from '../types'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 minuto
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        const axiosError = error as AxiosError<ApiError>
        const message =
          axiosError.response?.data?.message ?? 'Ocorreu um erro inesperado'

        notifications.show({
          title: 'Erro',
          message,
          color: 'red',
          autoClose: 4000,
        })
      },
    },
  },
})
