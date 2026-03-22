'use client'

import React, { ReactNode } from 'react'
import { createAppKit } from '@reown/appkit/react'
import { solanaAdapter, projectId, networks, metadata } from '@/config/appkit'

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Create modal
createAppKit({
  adapters: [solanaAdapter],
  projectId,
  networks,
  metadata,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-font-family': 'var(--font-sans, "Inter", sans-serif)',
    '--w3m-accent': 'var(--primary, oklch(0.437 0.078 188.216))',
    '--w3m-color-mix': 'var(--background, oklch(0.145 0 0))',
    '--w3m-color-mix-strength': 15,
    '--w3m-border-radius-master': '0px'
  },
  features: {
    analytics: true
  }
})

export default function AppKitProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}
