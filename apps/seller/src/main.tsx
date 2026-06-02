import { AuthProvider } from '@broker/api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { sellerAuthStorage } from './auth-storage'
import './index.css'
import App from './router'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider
        storage={sellerAuthStorage}
        baseUrl={import.meta.env.VITE_API_URL}
      >
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
