'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { usePortfolio } from '@/hooks/usePortfolio'

export default function Withdraw() {
  const [amount, setAmount] = useState('')
  const { portfolio, withdraw, loading } = usePortfolio()

  const maxAmount = portfolio?.amountUsdc || 0

  const handleWithdraw = async () => {
    if (!amount || isNaN(Number(amount))) return
    const id = toast.loading('Confirm withdrawal in wallet…')
    try {
      const sig = await withdraw(Number(amount))
      toast.dismiss(id)
      const short = sig.length > 16 ? `${sig.slice(0, 6)}…${sig.slice(-6)}` : sig
      toast.success('Withdrawal confirmed', {
        description: short,
      })
      setAmount('')
    } catch (err: unknown) {
      toast.dismiss(id)
      const msg = err instanceof Error ? err.message : 'Transaction failed'
      toast.error('Withdrawal failed', { description: msg })
      console.error(err)
    }
  }

  return (
    <div className="flex flex-col h-full grow bg-[#030303] w-full overflow-x-hidden">
      <div className="py-[8px] px-[16px] text-white uppercase border-b border-[#1a1a1a] flex justify-between items-center shrink-0 bg-[#050505]">
        <span className="tracking-[1px] font-bold">WITHDRAW_FUNDS</span>
      </div>
      
      <div className="p-[16px] border-b border-[#1a1a1a] flex flex-col sm:flex-row justify-between bg-[#050505] shrink-0 gap-4 sm:gap-0">
        <div className="flex flex-col gap-[4px]">
          <span className="text-[#444] uppercase">AVAILABLE</span>
          <span className="text-white text-[12px]">{maxAmount.toFixed(2)} vUSDC-BAL</span>
        </div>
        <div className="flex flex-col gap-[4px] sm:text-right">
          <span className="text-[#444] uppercase">OUTPUT_EST(USDC)</span>
          <span className="text-white text-[12px]">{amount || '0.00'}</span>
        </div>
      </div>

      <div className="p-[16px] shrink-0 flex flex-col gap-[8px]">
        <div className="text-[#444] uppercase flex justify-between w-full">
          <span>BURN_AMOUNT</span>
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
          <div className="flex items-center border-l border-[#1a1a1a] shrink-0 h-full">
             <button 
                onClick={() => setAmount(maxAmount.toString())}
                className="px-[12px] h-full hover:text-white uppercase text-[#444] cursor-pointer transition-colors active:text-[#b0b0b0]">
               MAX
             </button>
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-[#1a1a1a]">
        <button 
          onClick={handleWithdraw}
          disabled={loading || maxAmount === 0}
          className={`w-full border-b-0 py-[12px] hover:bg-[#1a1a1a] hover:text-white uppercase tracking-[2px] transition-colors cursor-pointer ${loading ? 'bg-[#333] text-[#888]' : 'bg-[#050505] text-white border-[#1a1a1a]'}`}>
          {loading ? 'EXECUTING...' : 'EXECUTE_WITHDRAW'}
        </button>
      </div>
    </div>
  )
}
