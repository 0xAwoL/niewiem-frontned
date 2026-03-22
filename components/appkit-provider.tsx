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
  features: {
    analytics: true
  }
})

export default function AppKitProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}
