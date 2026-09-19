import { detectCurrentChat, watchCurrentChat } from './detect-chat'
import { applySidebarLayout } from './layout'
import { mountSidebar } from './sidebar/mount'

let booted = false

function waitForApp(timeoutMs = 120_000): Promise<Element> {
  const existing = document.querySelector('#app')
  if (existing) return Promise.resolve(existing)

  return new Promise((resolve, reject) => {
    const started = Date.now()

    const tryFind = () => document.querySelector('#app')

    const observer = new MutationObserver(() => {
      const el = tryFind()
      if (el) {
        cleanup()
        resolve(el)
      } else if (Date.now() - started > timeoutMs) {
        cleanup()
        reject(new Error('Timed out waiting for #app'))
      }
    })

    const poll = window.setInterval(() => {
      const el = tryFind()
      if (el) {
        cleanup()
        resolve(el)
      } else if (Date.now() - started > timeoutMs) {
        cleanup()
        reject(new Error('Timed out waiting for #app'))
      }
    }, 500)

    const cleanup = () => {
      observer.disconnect()
      window.clearInterval(poll)
    }

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    })
  })
}

async function boot(): Promise<void> {
  if (booted) return
  booted = true

  try {
    await waitForApp()
  } catch (err) {
    console.warn('[Broker WA POC]', err)
    return
  }

  applySidebarLayout()
  const sidebar = mountSidebar(detectCurrentChat())
  watchCurrentChat((chat) => sidebar.update(chat))
  console.info('[Broker WA POC] ready', detectCurrentChat())
}

void boot()
