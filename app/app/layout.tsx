import { ReactNode } from 'react'

export default function AppLayout({ children }: { children: ReactNode }) {
  // All routing is now localized inside the client array on app/page.tsx
  return <>{children}</>
}
