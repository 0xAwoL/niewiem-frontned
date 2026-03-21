'use client'
import { useState } from 'react'
import { Strategies } from '@/components/yield-vault/Strategies'

export default function Deposit() {
  const [strategy, setStrategy] = useState('BALANCED')

  return (
    <div className="flex flex-col h-full bg-[#030303] w-full grow overflow-x-hidden">
      <div className="py-[8px] px-[16px] text-white uppercase border-b border-[#1a1a1a] flex justify-between items-center shrink-0 bg-[#050505]">
        <span className="tracking-[1px] font-bold">DEPOSIT_USDC</span>
      </div>

      <div className="border-b border-[#1a1a1a] shrink-0 w-full flex flex-col items-start bg-[#030303]">
        <div className="text-[#444] uppercase flex justify-between px-[16px] py-[8px] text-[10px] tracking-[1px] w-full border-b border-[#1a1a1a] bg-[#050505]">
          <span>1. SELECT_STRATEGY</span>
          <span className="text-white/30">{strategy}_MODE</span>
        </div>
        <Strategies interactive activeStrategy={strategy} onSelect={setStrategy} />
      </div>

      <div className="p-[16px] border-b border-[#1a1a1a] bg-[#030303] shrink-0 flex flex-col gap-[8px]">
        <div className="text-[#444] uppercase flex justify-between w-full">
          <span>2. INPUT_AMOUNT</span>
          <span>BAL: 0.00 USDC</span>
        </div>
        <div className="flex bg-[#050505] border border-[#1a1a1a] focus-within:border-[#b0b0b0] transition-colors h-[32px]">
          <input
            type="number"
            placeholder="0.00"
            className="bg-transparent border-none text-white p-[8px] w-full outline-none placeholder-[#444] font-mono h-full [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <div className="flex items-center px-[12px] h-full text-[#444] border-l border-[#1a1a1a] shrink-0">
            USDC
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-[#1a1a1a]">
        <button className="w-full border-b-0 border-[#b0b0b0] bg-white text-black py-[12px] hover:bg-[#b0b0b0] transition-colors uppercase tracking-[2px] font-bold cursor-pointer focus:bg-[#b0b0b0]">
          EXECUTE_DEPOSIT
        </button>
      </div>
    </div>
  )
}
