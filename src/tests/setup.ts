import '@testing-library/jest-dom'
import { notifications } from '@mantine/notifications'
import { server } from './mocks/server'

// jsdom does not implement window.matchMedia — required by @mantine/hooks
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// jsdom does not implement window.ResizeObserver
window.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  // Mantine notifications use a global store — clear it between tests
  notifications.clean()
})
afterAll(() => server.close())
