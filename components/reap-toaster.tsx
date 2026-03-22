'use client'

import { Toaster } from 'sonner'

export function ReapToaster() {
  return (
    <Toaster
      position="bottom-center"
      theme="dark"
      offset={20}
      gap={8}
      closeButton
      duration={4500}
      toastOptions={{
        classNames: {
          toast:
            'rounded-none border border-[#2a2a2a] bg-[#080808] font-mono text-[11px] text-[#e5e5e5] shadow-[0_16px_48px_rgba(0,0,0,0.65)] p-4 w-[min(100vw-2rem,400px)]',
          title: 'text-white font-bold uppercase tracking-[0.08em] text-[10px]',
          description: 'text-[#888] mt-1.5 text-[10px] leading-relaxed normal-case tracking-normal',
          success: 'border-[#1f3d2e]',
          error: 'border-[#3d2020]',
          closeButton:
            'left-auto right-2 top-2 border border-[#333] bg-[#111] text-[#888] hover:bg-[#1a1a1a] hover:text-white rounded-none',
        },
      }}
    />
  )
}
