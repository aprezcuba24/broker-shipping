import type { ReactNode } from 'react'

export type BtnListProps = {
  children: ReactNode
}

export function BtnList({ children }: BtnListProps) {
  return <div className="flex w-full justify-end gap-2 sm:w-auto">{children}</div>
}
