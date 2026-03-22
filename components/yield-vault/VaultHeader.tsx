export default function VaultHeader() {
  return (
    <div className="flex border-b border-[#1a1a1a] h-[36px] items-center px-[16px] justify-between uppercase tracking-[1px]">
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
      <div className="flex items-center">
        <appkit-button size="sm" />
      </div>
    </div>
  )
}
