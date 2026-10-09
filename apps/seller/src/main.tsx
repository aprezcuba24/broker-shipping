import { AuthProvider } from '@broker/api'
import { Toaster } from '@broker/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { sellerAuthStorage } from './auth-storage'
import { setupExtensionSessionBridge } from './lib/extension-session'
import './index.css'
import App from './router'

setupExtensionSessionBridge()

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider storage={sellerAuthStorage} baseUrl={import.meta.env.VITE_API_URL}>
        <App />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
