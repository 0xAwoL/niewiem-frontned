import { SolanaAdapter } from '@reown/appkit-adapter-solana/react'
import { solana, solanaTestnet, solanaDevnet } from '@reown/appkit/networks'

export const solanaAdapter = new SolanaAdapter()

export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID

if (!projectId) {
  throw new Error('NEXT_PUBLIC_REOWN_PROJECT_ID is not set in environment variables')
}

export const networks = [solana, solanaTestnet, solanaDevnet] as [
  typeof solana,
  typeof solanaTestnet,
  typeof solanaDevnet,
]

export const metadata = {
  name: 'RWA Yield Vault',
  description: 'Auto-compounding RWA Yield on Solana',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
}
