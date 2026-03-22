'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Strategies } from '@/components/yield-vault/Strategies'
import { usePortfolio, StrategyId } from '@/hooks/usePortfolio'

const getStrategyId = (s: string): StrategyId => {
  if (s === 'STABLE') return 'conservative'
  if (s === 'GROWTH') return 'growthFocus'
  return 'stableYield' // BALANCED
}

export default function Deposit() {
  const [strategy, setStrategy] = useState('BALANCED')
  const [amount, setAmount] = useState('')
  const { deposit, loading, walletUsdc } = usePortfolio()
  const usdcBalance = walletUsdc

  const handleDeposit = async () => {
    if (!amount || isNaN(Number(amount))) return
    const id = toast.loading('Confirm deposit in wallet…')
    try {
      const sig = await deposit(getStrategyId(strategy), Number(amount))
      toast.dismiss(id)
      const short = sig.length > 16 ? `${sig.slice(0, 6)}…${sig.slice(-6)}` : sig
      toast.success('Deposit confirmed', {
        description: short,
      })
      setAmount('')
    } catch (err: unknown) {
      toast.dismiss(id)
      const msg = err instanceof Error ? err.message : 'Transaction failed'
      toast.error('Deposit failed', { description: msg })
      console.error(err)
    }
  }

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
          <span>BAL: {usdcBalance !== null ? usdcBalance.toFixed(2) : '0.00'} USDC</span>
        </div>
        <div className="flex bg-[#050505] border border-[#1a1a1a] focus-within:border-[#b0b0b0] transition-colors h-[32px]">
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
            className="bg-transparent border-none text-white p-[8px] w-full outline-none placeholder-[#444] font-mono h-full [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <div className="flex items-center px-[12px] h-full text-[#444] border-l border-[#1a1a1a] shrink-0">
            USDC
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-[#1a1a1a]">
        <button 
          onClick={handleDeposit}
          disabled={loading}
          className={`w-full border-b-0 py-[12px] uppercase tracking-[2px] font-bold cursor-pointer transition-colors ${loading ? 'bg-[#333] text-[#888]' : 'bg-white text-black hover:bg-[#b0b0b0]'}`}>
          {loading ? 'EXECUTING...' : 'EXECUTE_DEPOSIT'}
        </button>
      </div>
    </div>
  )
}
