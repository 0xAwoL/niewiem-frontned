'use client'
import { usePortfolio, STRATEGIES } from '@/hooks/usePortfolio'

export default function Dashboard() {
  const { portfolio } = usePortfolio()
  const strategy = portfolio?.strategy || 'stableYield'
  const config = STRATEGIES.find(s => s.id === strategy)

  const apy = config ? (config.apyBps / 100).toFixed(1) : '0.0'
  const strategyName = config ? config.name : 'Unknown'
  const targetBal = portfolio?.amountUsdc || 0

  return (
    <>
      <div className="py-[8px] px-[16px] text-white uppercase border-b border-[#1a1a1a] flex justify-between items-center">
        <span>POSITION_STATUS</span>
        <span className={portfolio ? "text-[#4ade80]" : "text-[#444]"}>
          {portfolio ? 'LIVE' : 'INACTIVE'}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border-b border-[#1a1a1a]">
        <div className="p-[12px_16px] border-b md:border-b-0 md:border-r border-[#1a1a1a] flex flex-col gap-[8px]">
          <div className="text-[#444] uppercase">TOTAL_VAL</div>
          <div className="text-white text-[14px]">{targetBal.toFixed(2)} USDC</div>
        </div>
        <div className="p-[12px_16px] border-b md:border-b-0 md:border-r border-[#1a1a1a] flex flex-col gap-[8px]">
          <div className="text-[#444] uppercase">DEPOSITS</div>
          <div className="text-[#fff] text-[14px]">{portfolio?.depositCount || 0}</div>
        </div>
        <div className="p-[12px_16px] flex flex-col gap-[8px]">
          <div className="text-[#444] uppercase">LIVE_APY</div>
          <div className="text-white text-[14px]">{apy}%</div>
        </div>
      </div>

      <div className="py-[8px] px-[16px] text-white uppercase border-b border-[#1a1a1a] flex justify-between items-center mt-[32px] border-t">
        <span>CURRENT_HOLDINGS</span>
        <span className="text-[#444] uppercase">{strategyName}</span>
      </div>
      
      <div className="grid grid-cols-[1fr_1fr_60px] border-b border-[#1a1a1a] h-[24px] items-center text-center text-[#444] uppercase text-[9px] shrink-0">
        <div className="text-left pl-[16px]">ASSET</div>
        <div className="text-left border-l border-[#1a1a1a] pl-[12px] h-full leading-[24px]">VALUE</div>
        <div className="border-l border-[#1a1a1a] h-full leading-[24px]">ALLOC</div>
      </div>
      
      <div className="flex flex-col grow">
        {portfolio && config?.allocations.map((alloc, i) => {
           const val = targetBal * (alloc.pct / 100);
           return (
             <div key={i} className="grid grid-cols-[1fr_1fr_60px] h-[24px] items-center border-b border-[#1a1a1a]">
               <div className="pl-[16px] overflow-hidden text-ellipsis whitespace-nowrap pr-2" style={{ color: alloc.color }}>
                 {alloc.label}
               </div>
               <div className="border-l border-[#1a1a1a] h-full leading-[24px] pl-[12px] text-[#b0b0b0]">
                 {val.toFixed(2)} USDC
               </div>
               <div className="text-[#444] text-center border-l border-[#1a1a1a] h-full leading-[24px]">{alloc.pct}%</div>
             </div>
           )
        })}
        {!portfolio && (
          <div className="text-[#444] text-center py-[16px]">
            NO_ACTIVE_POSITION
          </div>
        )}
      </div>
    </>
  )
}
