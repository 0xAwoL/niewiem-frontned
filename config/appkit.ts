import { SolanaAdapter } from '@reown/appkit-adapter-solana/react'
import { solanaDevnet } from '@reown/appkit/networks'

export const solanaAdapter = new SolanaAdapter()

export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID

if (!projectId) {
  throw new Error('NEXT_PUBLIC_REOWN_PROJECT_ID is not set in environment variables')
}

const customDevnet = {
  ...solanaDevnet,
  currency: "USDC",
  explorerUrl: "https://explorer.solana.com/?cluster=devnet",
};

export const networks = [customDevnet] as [
  typeof customDevnet,
]

export const metadata = {
  name: 'RWA Yield Vault',
  description: 'Auto-compounding RWA Yield on Solana',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
}
