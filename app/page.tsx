import { Strategies } from '@/components/yield-vault/Strategies'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="bg-[#111] min-h-screen flex justify-center items-center text-[#b0b0b0] font-mono text-[11px] overflow-x-hidden m-0 p-4 select-none antialiased">
      <div className="bg-[#030303] border border-[#1a1a1a] w-full max-w-[720px] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.8)]">

        {/* HEADER */}
        <div className="flex border-b border-[#1a1a1a] h-[30px] items-center px-[16px] justify-between uppercase tracking-[1px] shrink-0">
          <div className="flex gap-[24px]">
            <div className="flex items-center">
              <span className="text-[#444] mr-[8px]">SYS</span>
              <b className="text-white font-[400]">YIELD_VAULT</b>
            </div>
          </div>
          <div className="flex gap-[24px]">
            <div className="flex items-center">
              <span className="text-[#444] mr-[8px] animate-pulse">►</span>
              <b className="text-white font-[400]">ONLINE</b>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex flex-col min-h-[380px]">
          <div className="py-[16px] px-[24px] border-b border-[#1a1a1a] text-center">
            <h1 className="text-white text-[16px] uppercase tracking-[2px] mb-2">Auto-compounding RWA Yield</h1>
            <p className="text-[#444]">DEPOSIT USDC : AUTO ALLOCATE TO GOLD, T-BILLS, STOCKS : EARN YIELD</p>
          </div>

          <div className="py-[8px] px-[16px] text-white uppercase border-b border-[#1a1a1a] flex justify-between items-center">
            <span>PRESET_STRATEGIES</span>
          </div>
          <Strategies />

          {/* FOOTER */}
          <div className="border-t border-[#1a1a1a] py-[8px] px-[16px] flex justify-between text-[#444] uppercase shrink-0">
            <div>
              <span>SYSTEM READY</span>
            </div>
            <div className="flex gap-4">
              <Link href="/app"><span className="text-white hover:underline cursor-pointer">[ OPEN_APP ]</span></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
