import { mountSidebar } from './sidebar/mount'

let booted = false

function boot(): void {
  if (booted) return
  booted = true
  mountSidebar()
  console.info('[Vendelo360 Facebook] ready')
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true })
} else {
  boot()
}
