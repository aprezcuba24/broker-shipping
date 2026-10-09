import { create } from 'zustand'

export type FacebookPublishMessageSnapshot = {
  id: string
  title: string
  description: string
  code: string
  photo_url: string | null
}

type FacebookPublishState = {
  messages: Record<string, FacebookPublishMessageSnapshot>
  toggleMessage: (message: FacebookPublishMessageSnapshot) => void
  isSelected: (id: string) => boolean
  clearMessages: () => void
}

export const useFacebookPublishStore = create<FacebookPublishState>((set, get) => ({
  messages: {},

  toggleMessage: (message) => {
    set((state) => {
      if (state.messages[message.id]) {
        const { [message.id]: _removed, ...rest } = state.messages
        return { messages: rest }
      }
      return {
        messages: {
          ...state.messages,
          [message.id]: message,
        },
      }
    })
  },

  isSelected: (id) => get().messages[id] != null,

  clearMessages: () => set({ messages: {} }),
}))

export function getSelectedMessageCount(
  messages: Record<string, FacebookPublishMessageSnapshot>,
): number {
  return Object.keys(messages).length
}

export function getSelectedMessages(
  messages: Record<string, FacebookPublishMessageSnapshot>,
): FacebookPublishMessageSnapshot[] {
  return Object.values(messages)
}
