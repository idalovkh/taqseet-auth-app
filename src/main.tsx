import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { App } from './App'

await import('@idalovkh/taqseet-ui-tokens')
await import('@idalovkh/taqseet-ui-styles/globals.css')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>
)
