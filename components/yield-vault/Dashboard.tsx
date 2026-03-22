'use client'
import { usePortfolio, STRATEGIES } from '@/hooks/usePortfolio'

export default function Dashboard() {
  const { portfolio, walletUsdc, vaultUsdc } = usePortfolio()
  const hasOpenPosition = !!portfolio && portfolio.amountRaw > 0
  const strategy = portfolio?.strategy || 'stableYield'
  const config = STRATEGIES.find(s => s.id === strategy)

  const apy = config ? (config.apyBps / 100).toFixed(1) : '0.0'
  const strategyName = hasOpenPosition && config ? config.name : '—'

  const vaultPosition =
    hasOpenPosition && vaultUsdc !== null
      ? vaultUsdc
      : hasOpenPosition && portfolio
        ? portfolio.amountUsdc
        : 0

  const walletFree = walletUsdc ?? 0

  const holdingRows: { label: string; value: number; pct: string; color: string }[] = []

  if (walletUsdc !== null) {
    holdingRows.push({
      label: 'USDC (wallet)',
      value: walletFree,
      pct: '—',
      color: '#94a3b8',
    })
  }

  if (hasOpenPosition && config) {
    for (const alloc of config.allocations) {
      holdingRows.push({
        label: alloc.label,
        value: vaultPosition * (alloc.pct / 100),
        pct: `${alloc.pct}%`,
        color: alloc.color,
      })
    }
  }

  return (
    <>
      <div className="py-[8px] px-[16px] text-white uppercase border-b border-[#1a1a1a] flex justify-between items-center">
        <span>POSITION_STATUS</span>
        <span className={hasOpenPosition ? "text-[#4ade80]" : "text-[#444]"}>
          {hasOpenPosition ? 'LIVE' : 'INACTIVE'}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border-b border-[#1a1a1a]">
        <div className="p-[12px_16px] border-b md:border-b-0 md:border-r border-[#1a1a1a] flex flex-col gap-[8px]">
          <div className="text-[#444] uppercase">VAULT_USDC</div>
          <div className="text-white text-[14px]">{vaultPosition.toFixed(2)} USDC</div>
        </div>
        <div className="p-[12px_16px] border-b md:border-b-0 md:border-r border-[#1a1a1a] flex flex-col gap-[8px]">
          <div className="text-[#444] uppercase">DEPOSITS</div>
          <div className="text-[#fff] text-[14px]">{hasOpenPosition ? portfolio?.depositCount ?? 0 : 0}</div>
        </div>
        <div className="p-[12px_16px] flex flex-col gap-[8px]">
          <div className="text-[#444] uppercase">LIVE_APY</div>
          <div className="text-white text-[14px]">{hasOpenPosition ? `${apy}%` : '0.0%'}</div>
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
        {holdingRows.map((row, i) => (
          <div
            key={`${row.label}-${i}`}
            className="grid grid-cols-[1fr_1fr_60px] h-[24px] items-center border-b border-[#1a1a1a]"
          >
            <div
              className="pl-[16px] overflow-hidden text-ellipsis whitespace-nowrap pr-2"
              style={{ color: row.color }}
            >
              {row.label}
            </div>
            <div className="border-l border-[#1a1a1a] h-full leading-[24px] pl-[12px] text-[#b0b0b0]">
              {row.value.toFixed(2)} USDC
            </div>
            <div className="text-[#444] text-center border-l border-[#1a1a1a] h-full leading-[24px]">
              {row.pct}
            </div>
          </div>
        ))}
        {holdingRows.length === 0 && (
          <div className="text-[#444] text-center py-[16px]">NO_ACTIVE_POSITION</div>
        )}
      </div>
    </>
  )
}
