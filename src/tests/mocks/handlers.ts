import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:8080'

export const handlers = [
  // ── Auth ──────────────────────────────────────────────────────────────────

  http.post(`${BASE}/api/auth/register`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    if (body.email === 'exists@example.com') {
      return HttpResponse.json({ message: 'E-mail já cadastrado' }, { status: 409 })
    }
    return HttpResponse.json({}, { status: 201 })
  }),

  http.post(`${BASE}/api/auth/login`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    if (body.email === 'user@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        accessToken: 'fake-access-token',
        refreshToken: 'fake-refresh-token',
        tenantId: 'tenant-1',
        name: 'João Silva',
        businessName: 'Silva Elétrica',
      })
    }
    return HttpResponse.json({ message: 'E-mail ou senha inválidos' }, { status: 401 })
  }),

  http.post(`${BASE}/api/auth/forgot-password`, () => {
    return HttpResponse.json({}, { status: 200 })
  }),

  // ── Clients ───────────────────────────────────────────────────────────────

  http.get(`${BASE}/api/clients`, ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search') ?? ''

    if (search === 'vazio') {
      return HttpResponse.json({
        content: [],
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        last: true,
      })
    }

    return HttpResponse.json({
      content: [
        {
          id: 'client-1',
          name: 'Maria Souza',
          phone: '11999998888',
          createdAt: '2024-01-01T00:00:00Z',
          activeServicesCount: 2,
        },
        {
          id: 'client-2',
          name: 'Carlos Lima',
          phone: '11988887777',
          createdAt: '2024-01-02T00:00:00Z',
          activeServicesCount: 0,
        },
      ],
      page: 0,
      size: 20,
      totalElements: 2,
      totalPages: 1,
      last: true,
    })
  }),

  http.post(`${BASE}/api/clients`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json(
      {
        id: 'new-client-id',
        ...body,
        createdAt: new Date().toISOString(),
        activeServicesCount: 0,
      },
      { status: 201 },
    )
  }),

  http.put(`${BASE}/api/clients/:id`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: 'client-1', ...body, createdAt: '2024-01-01T00:00:00Z', activeServicesCount: 0 })
  }),

  http.delete(`${BASE}/api/clients/:id`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // ── Services ──────────────────────────────────────────────────────────────

  http.get(`${BASE}/api/clients/:clientId/services`, () => {
    return HttpResponse.json({
      content: [],
      page: 0,
      size: 20,
      totalElements: 0,
      totalPages: 0,
      last: true,
    })
  }),

  http.post(`${BASE}/api/clients/:clientId/services`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json(
      {
        id: 'service-1',
        clientId: params.clientId,
        clientName: 'Maria Souza',
        nfIssued: false,
        createdAt: new Date().toISOString(),
        status: 'TECHNICAL_VISIT',
        ...body,
      },
      { status: 201 },
    )
  }),

  http.patch(`${BASE}/api/clients/:clientId/services/:serviceId/status`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({
      id: params.serviceId,
      clientId: params.clientId,
      clientName: 'Maria Souza',
      description: 'Troca de disjuntor',
      nfIssued: false,
      createdAt: '2024-01-01T00:00:00',
      ...body,
      status: body.targetStatus,
    })
  }),

  http.delete(`${BASE}/api/clients/:clientId/services/:serviceId`, () => {
    return new HttpResponse(null, { status: 204 })
  }),
]
