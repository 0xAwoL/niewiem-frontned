export default function VaultHeader() {
  return (
    <div className="flex border-b border-[#1a1a1a] h-[30px] items-center px-[16px] justify-between uppercase tracking-[1px]">
      <div className="flex gap-[24px]">
        <div className="flex items-center">
          <span className="text-[#444] mr-[8px]">SYS</span> 
          <b className="text-white font-[400]">YIELD_VAULT</b>
        </div>
        <div className="hidden sm:flex items-center">
          <span className="text-[#444] mr-[8px] animate-pulse">►</span> 
          <b className="text-white font-[400]">ACTIVE_SESSION</b>
        </div>
      </div>
      <div className="flex gap-[24px]">
        <div className="flex items-center cursor-pointer hover:text-white transition-colors">
          <span className="text-[#444] mr-[8px]">WALLET</span> 
          <b className="font-[400]">CONNECT</b>
        </div>
      </div>
    </div>
  )
}
