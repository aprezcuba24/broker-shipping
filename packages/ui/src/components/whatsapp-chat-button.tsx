import { MessageCircle, Send, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

import { cn } from '../lib/utils'

export type WhatsAppChatButtonProps = {
  phone: string
  text: string
  className?: string
}

function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, '')
}

function buildWhatsAppHref(phone: string, message: string): string {
  const trimmed = message.trim()
  if (!trimmed) return `https://wa.me/${phone}`
  return `https://wa.me/${phone}?text=${encodeURIComponent(trimmed)}`
}

export function WhatsAppChatButton({
  phone,
  text,
  className,
}: WhatsAppChatButtonProps) {
  const digits = digitsOnly(phone)
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const dialogId = useId()
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target
      if (!(target instanceof Node)) return
      if (rootRef.current?.contains(target)) return
      setOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
  }, [open])

  if (!digits) return null

  function sendMessage() {
    const href = buildWhatsAppHref(digits, message)
    window.open(href, '_blank', 'noopener,noreferrer')
    setOpen(false)
    setMessage('')
  }

  return (
    <div
      ref={rootRef}
      className={cn(
        'fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 flex flex-col items-end gap-3',
        className,
      )}
    >
      {open ? (
        <div
          id={dialogId}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className="flex w-[min(20rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.22)]"
        >
          <div className="flex items-center gap-2 bg-[#075E54] px-3 py-2.5 text-white">
            <span className="grid size-8 place-items-center rounded-full bg-white/15">
              <MessageCircle aria-hidden className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p id={titleId} className="truncate text-sm font-semibold leading-tight">
                WhatsApp
              </p>
              <p className="truncate text-xs text-white/75">Administrador</p>
            </div>
            <button
              type="button"
              aria-label="Cerrar chat"
              className="grid size-8 place-items-center rounded-full text-white/90 transition hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>

          <div className="bg-[#ECE5DD] px-3 py-3">
            <div
              id={descriptionId}
              className="max-w-[90%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-sm leading-snug text-[#111B21] shadow-sm"
            >
              {text}
            </div>
          </div>

          <form
            className="flex items-end gap-2 border-t border-black/5 bg-white p-2"
            onSubmit={(event) => {
              event.preventDefault()
              sendMessage()
            }}
          >
            <label className="sr-only" htmlFor={`${titleId}-message`}>
              Mensaje
            </label>
            <textarea
              ref={inputRef}
              id={`${titleId}-message`}
              rows={2}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Escribe un mensaje…"
              className="max-h-28 min-h-[2.5rem] flex-1 resize-none rounded-xl border border-black/10 bg-[#F0F2F5] px-3 py-2 text-sm text-[#111B21] outline-none placeholder:text-[#667781] focus-visible:ring-2 focus-visible:ring-[#25D366]"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  sendMessage()
                }
              }}
            />
            <button
              type="submit"
              aria-label="Enviar por WhatsApp"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-[#25D366] text-white shadow-sm transition hover:bg-[#1ebe57]"
            >
              <Send aria-hidden className="size-4" />
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        aria-label="Contactar por WhatsApp"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        className="grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(37,211,102,0.45)] transition hover:scale-105 hover:bg-[#1ebe57] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
        onClick={() => setOpen((current) => !current)}
      >
        {open ? (
          <X aria-hidden className="size-6" />
        ) : (
          <MessageCircle aria-hidden className="size-7" />
        )}
      </button>
    </div>
  )
}
