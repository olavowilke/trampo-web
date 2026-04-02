import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '../components/ProtectedRoute'

// Auth pages (criadas na Etapa 10)
import { LoginPage } from '../pages/auth/LoginPage'
import { RegisterPage } from '../pages/auth/RegisterPage'
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage'

// App pages (criadas nas Etapas 11–14)
import { ClientsPage } from '../pages/clients/ClientsPage'
import { ServicesPage } from '../pages/services/ServicesPage'

export const router = createBrowserRouter([
  // Rotas públicas
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },

  // Rotas protegidas
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/clients', element: <ClientsPage /> },
      { path: '/clients/:clientId/services', element: <ServicesPage /> },
    ],
  },

  // Fallback
  { path: '/', element: <Navigate to="/clients" replace /> },
  { path: '*', element: <Navigate to="/clients" replace /> },
])
