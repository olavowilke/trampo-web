import { type ReactNode } from 'react'
import { render, type RenderResult } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route, type MemoryRouterProps } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'

interface RenderOptions {
  routerProps?: MemoryRouterProps
  /** Extra routes to mount alongside the component (for testing navigation) */
  extraRoutes?: Array<{ path: string; element: ReactNode }>
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

export function renderWithProviders(
  ui: ReactNode,
  { routerProps, extraRoutes }: RenderOptions = {},
): RenderResult {
  const queryClient = makeQueryClient()

  const content = extraRoutes ? (
    <Routes>
      <Route path={routerProps?.initialEntries?.[0]?.toString() ?? '/'} element={ui} />
      {extraRoutes.map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}
    </Routes>
  ) : (
    ui
  )

  return render(
    <MantineProvider>
      <Notifications />
      <QueryClientProvider client={queryClient}>
        <MemoryRouter {...routerProps}>
          <AuthProvider>{content}</AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </MantineProvider>,
  )
}
