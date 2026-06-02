import { create } from 'zustand'

export const useAppStore = create<{ n: number }>(() => ({ n: 0 }))
