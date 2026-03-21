export default function Dashboard() {
  return (
    <>
      <div className="py-[8px] px-[16px] text-white uppercase border-b border-[#1a1a1a] flex justify-between items-center">
        <span>POSITION_STATUS</span>
        <span className="text-[#444]">LIVE</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border-b border-[#1a1a1a]">
        <div className="p-[12px_16px] border-b md:border-b-0 md:border-r border-[#1a1a1a] flex flex-col gap-[8px]">
          <div className="text-[#444] uppercase">TOTAL_VAL</div>
          <div className="text-white text-[14px]">$1,240.50</div>
        </div>
        <div className="p-[12px_16px] border-b md:border-b-0 md:border-r border-[#1a1a1a] flex flex-col gap-[8px]">
          <div className="text-[#444] uppercase">YIELD_EARNED</div>
          <div className="text-[#fff] text-[14px]">+$40.50</div>
        </div>
        <div className="p-[12px_16px] flex flex-col gap-[8px]">
          <div className="text-[#444] uppercase">LIVE_APY</div>
          <div className="text-white text-[14px]">8.2%</div>
        </div>
      </div>

      <div className="py-[8px] px-[16px] text-white uppercase border-b border-[#1a1a1a] flex justify-between items-center mt-[32px] border-t">
        <span>STRATEGY_ALLOCATION</span>
        <span className="text-[#444]">BALANCED</span>
      </div>
      
      <div className="grid grid-cols-[1fr_1fr_60px] border-b border-[#1a1a1a] h-[24px] items-center text-center text-[#444] uppercase text-[9px] shrink-0">
        <div className="text-left pl-[16px]">ASSET</div>
        <div className="text-left border-l border-[#1a1a1a] pl-[12px] h-full leading-[24px]">VALUE</div>
        <div className="border-l border-[#1a1a1a] h-full leading-[24px]">ALLOC</div>
      </div>
      
      <div className="flex flex-col grow">
        <div className="grid grid-cols-[1fr_1fr_60px] h-[24px] items-center border-b border-[#1a1a1a]">
          <div className="pl-[16px] text-white overflow-hidden text-ellipsis whitespace-nowrap pr-2">Ondo USDY</div>
          <div className="border-l border-[#1a1a1a] h-full leading-[24px] pl-[12px] text-[#b0b0b0]">~$620.25</div>
          <div className="text-[#444] text-center border-l border-[#1a1a1a] h-full leading-[24px]">50%</div>
        </div>
        <div className="grid grid-cols-[1fr_1fr_60px] h-[24px] items-center border-b border-[#1a1a1a]">
          <div className="pl-[16px] text-white overflow-hidden text-ellipsis whitespace-nowrap pr-2">Orca XAUT/USDC LP</div>
          <div className="border-l border-[#1a1a1a] h-full leading-[24px] pl-[12px] text-[#b0b0b0]">~$372.15</div>
          <div className="text-[#444] text-center border-l border-[#1a1a1a] h-full leading-[24px]">30%</div>
        </div>
        <div className="grid grid-cols-[1fr_1fr_60px] h-[24px] items-center border-b border-[#1a1a1a]">
          <div className="pl-[16px] text-white overflow-hidden text-ellipsis whitespace-nowrap pr-2">Kamino xSPY Lending</div>
          <div className="border-l border-[#1a1a1a] h-full leading-[24px] pl-[12px] text-[#b0b0b0]">~$248.10</div>
          <div className="text-[#444] text-center border-l border-[#1a1a1a] h-full leading-[24px]">20%</div>
        </div>
      </div>
    </>
  )
}
