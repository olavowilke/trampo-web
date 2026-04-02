import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { notifications } from '@mantine/notifications'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import type { ApiError } from '../types'
import type { AxiosError } from 'axios'

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  accessToken: string
  refreshToken: string
  tenantId: string
  name: string
  businessName: string
}

interface RegisterRequest {
  name: string
  businessName: string
  email: string
  password: string
  phone: string
}

interface ForgotPasswordRequest {
  email: string
}

interface ResetPasswordRequest {
  token: string
  newPassword: string
}

function extractMessage(error: AxiosError<ApiError>, fallback: string): string {
  return error.response?.data?.message ?? fallback
}

export function useLogin() {
  const { setAuthData } = useAuth()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: LoginRequest) =>
      api.post<LoginResponse>('/api/auth/login', data).then((r) => r.data),
    onSuccess: (data) => {
      setAuthData(data)
      navigate('/clients', { replace: true })
    },
    onError: (error: AxiosError<ApiError>) => {
      const msg = extractMessage(error, 'E-mail ou senha inválidos')
      notifications.show({ title: 'Erro ao entrar', message: msg, color: 'red' })
    },
  })
}

export function useRegister() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: RegisterRequest) =>
      api.post('/api/auth/register', data).then((r) => r.data),
    onSuccess: () => {
      notifications.show({
        title: 'Conta criada!',
        message: 'Faça login para continuar.',
        color: 'green',
      })
      navigate('/login', { replace: true })
    },
    onError: (error: AxiosError<ApiError>) => {
      const msg = extractMessage(error, 'Não foi possível criar a conta')
      notifications.show({ title: 'Erro ao cadastrar', message: msg, color: 'red' })
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) =>
      api.post('/api/auth/forgot-password', data).then((r) => r.data),
    onError: (error: AxiosError<ApiError>) => {
      const msg = extractMessage(error, 'Não foi possível enviar o e-mail')
      notifications.show({ title: 'Erro', message: msg, color: 'red' })
    },
  })
}

export function useResetPassword() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: ResetPasswordRequest) =>
      api.post('/api/auth/reset-password', data).then((r) => r.data),
    onSuccess: () => {
      notifications.show({
        title: 'Senha redefinida!',
        message: 'Faça login com sua nova senha.',
        color: 'green',
      })
      navigate('/login', { replace: true })
    },
    onError: (error: AxiosError<ApiError>) => {
      const msg = extractMessage(error, 'Token inválido ou expirado')
      notifications.show({ title: 'Erro', message: msg, color: 'red' })
    },
  })
}
