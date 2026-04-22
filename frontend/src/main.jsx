import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './styles/globals.css'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#F5EDE8',
            color: '#2C1810',
            border: '1px solid rgba(123, 31, 46, 0.18)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
)
