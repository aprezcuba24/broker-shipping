import { configureApi } from '@broker/api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { API_URL, SELLER_ORGANIZATION_ID } from '@/config/env'
import App from '@/router'
import './index.css'

configureApi({
  baseUrl: API_URL,
  getOrganizationId: () => SELLER_ORGANIZATION_ID || null,
})

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
