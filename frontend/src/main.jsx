import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './styles/globals.css'

const queryClient = new QueryClient()

// Flush all Zustand-persisted store keys when the bundle version changes.
const STORAGE_VERSION = '5'
if (localStorage.getItem('cs-version') !== STORAGE_VERSION) {
  ;[
    'casa-scarlatta-clases',
    'casa-scarlatta-usuarios',
    'casa-scarlatta-paquetes-v2',
    'casa-scarlatta-reservas',
    'casa-scarlatta-notificaciones',
  ].forEach((k) => localStorage.removeItem(k))
  localStorage.setItem('cs-version', STORAGE_VERSION)
}

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
