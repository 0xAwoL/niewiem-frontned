'use client'
import { useState } from 'react'
import VaultHeader from '@/components/yield-vault/VaultHeader'
import VaultFooter from '@/components/yield-vault/VaultFooter'
import Dashboard from '@/components/yield-vault/Dashboard'
import Deposit from '@/components/yield-vault/Deposit'
import Withdraw from '@/components/yield-vault/Withdraw'
import { Points } from '@/components/yield-vault/Points'
import { PortfolioProvider } from '@/hooks/usePortfolio'

export default function AppClientPage() {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'DEPOSIT' | 'WITHDRAW' | 'POINTS'>('DEPOSIT')
  return (
    <div className="bg-[#111] min-h-screen flex justify-center items-center text-[#b0b0b0] font-mono text-[11px] overflow-hidden m-0 p-4 select-none antialiased">
      {/* Rigid 720x600 size prevents any resizing when swapping tabs */}
      <div className="bg-[#030303] border border-[#1a1a1a] w-full max-w-[720px] h-[640px] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        <PortfolioProvider>
        <VaultHeader />

        {/* CSS TABS */}
        <div className="py-[8px] px-[16px] text-white uppercase border-b border-[#1a1a1a] flex gap-[24px] items-center shrink-0 h-[32px] bg-[#050505]">
          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`cursor-pointer transition-colors ${activeTab === 'DASHBOARD' ? "text-white font-bold" : "text-[#444] hover:text-[#b0b0b0]"}`}
          >
            {activeTab === 'DASHBOARD' ? '> DASHBOARD' : 'DASHBOARD'}
          </button>
          <button
            onClick={() => setActiveTab('DEPOSIT')}
            className={`cursor-pointer transition-colors ${activeTab === 'DEPOSIT' ? "text-white font-bold" : "text-[#444] hover:text-[#b0b0b0]"}`}
          >
            {activeTab === 'DEPOSIT' ? '> DEPOSIT' : 'DEPOSIT'}
          </button>
          <button
            onClick={() => setActiveTab('WITHDRAW')}
            className={`cursor-pointer transition-colors ${activeTab === 'WITHDRAW' ? "text-white font-bold" : "text-[#444] hover:text-[#b0b0b0]"}`}
          >
            {activeTab === 'WITHDRAW' ? '> WITHDRAW' : 'WITHDRAW'}
          </button>
          <button
            onClick={() => setActiveTab('POINTS')}
            className={`cursor-pointer transition-colors ${activeTab === 'POINTS' ? "text-white font-bold" : "text-[#444] hover:text-[#b0b0b0]"}`}
          >
            {activeTab === 'POINTS' ? '> POINTS' : 'POINTS'}
          </button>
        </div>

        {/* CONTENT AREA: flex-grow with strict overflow so it never resizes parent */}
        <div className="flex flex-col grow overflow-y-auto min-h-0 bg-[#030303]">
          {activeTab === 'DASHBOARD' && <Dashboard />}
          {activeTab === 'DEPOSIT' && <Deposit />}
          {activeTab === 'WITHDRAW' && <Withdraw />}
          {activeTab === 'POINTS' && <Points />}
        </div>

        <VaultFooter />
        </PortfolioProvider>
      </div>
    </div>
  )
}
