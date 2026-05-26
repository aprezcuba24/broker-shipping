import type { ReactNode } from 'react'

export type BtnListProps = {
  children: ReactNode
}

export function BtnList({ children }: BtnListProps) {
  return <div className="flex justify-end gap-1">{children}</div>
}
