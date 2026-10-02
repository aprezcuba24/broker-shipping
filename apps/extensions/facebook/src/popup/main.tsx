import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PopupApp } from './PopupApp'
import './styles.css'

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <PopupApp />
    </StrictMode>,
  )
}
