import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useAppKitProvider, useAppKitAccount } from "@reown/appkit/react";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
    addMockStrategyDeposit,
    emptyMockStrategyVaults,
    readMockStrategyVaults,
    reconcileMockStrategyVaults,
} from "@/lib/mockStrategyHoldings";

const USDC_DECIMALS = 1_000_000;
import IDL from "../idl/mock_portfolio.json";

const PROGRAM_ID = new PublicKey("GbALJtQCRmZbxkn5mhWjPeka75ZQg9tYQD5vCV7hdiSo");
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const PORTFOLIO_SEED = Buffer.from("portfolio");
const VAULT_SEED = Buffer.from("vault");

export type StrategyId = "stableYield" | "conservative" | "growthFocus";

export interface StrategyAllocation {
    label: string;
    pct: number;
    color: string;
}

export interface StrategyConfig {
    id: StrategyId;
    name: string;
    description: string;
    allocations: StrategyAllocation[];
    apyBps: number;
}

export const STRATEGIES: StrategyConfig[] = [
    {
        id: "stableYield",
        name: "Stable Yield",
        description: "Balanced exposure across yield, gold, and equities",
        apyBps: 820,
        allocations: [
            { label: "USDY", pct: 50, color: "#4ade80" },
            { label: "XAUT LP", pct: 30, color: "#facc15" },
            { label: "xSPY LEND", pct: 20, color: "#60a5fa" },
        ],
    },
    {
        id: "conservative",
        name: "Conservative",
        description: "Heavy stablecoin yield with minimal risk",
        apyBps: 560,
        allocations: [
            { label: "USDY", pct: 80, color: "#4ade80" },
            { label: "USDC LEND", pct: 20, color: "#a78bfa" },
        ],
    },
    {
        id: "growthFocus",
        name: "Growth Focus",
        description: "Gold and equity exposure for higher upside",
        apyBps: 1140,
        allocations: [
            { label: "XAUT LP", pct: 60, color: "#facc15" },
            { label: "xSPY LEND", pct: 40, color: "#60a5fa" },
        ],
    },
];

function strategyToAnchor(id: StrategyId): object {
    switch (id) {
        case "stableYield":
            return { stableYield: {} };
        case "conservative":
            return { conservative: {} };
        case "growthFocus":
            return { growthFocus: {} };
    }
}

function anchorToStrategyId(raw: object): StrategyId {
    const r = raw as Record<string, unknown>;
    if ("stableYield" in r || "stable_yield" in r || "StableYield" in r) return "stableYield";
    if ("conservative" in r || "Conservative" in r) return "conservative";
    if ("growthFocus" in r || "growth_focus" in r || "GrowthFocus" in r) return "growthFocus";
    return "stableYield";
}

export interface PortfolioState {
    owner: string;
    strategy: StrategyId;
    amountRaw: number;
    amountUsdc: number;
    lastDepositAt: Date;
    depositCount: number;
}

export interface UsePortfolioReturn {
    portfolio: PortfolioState | null;
    walletUsdc: number | null;
    mockStrategyVaults: Record<StrategyId, number>;
    loading: boolean;
    error: string | null;
    exists: boolean;
    deposit: (strategyId: StrategyId, amountUsdc: number) => Promise<string>;
    withdraw: (amountUsdc: number) => Promise<string>;
    switchStrategy: (strategyId: StrategyId) => Promise<string>;
    refresh: () => Promise<void>;
}

const PortfolioContext = createContext<UsePortfolioReturn | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
    const value = usePortfolioStore();
    return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio(): UsePortfolioReturn {
    const ctx = useContext(PortfolioContext);
    if (!ctx) {
        throw new Error("usePortfolio must be used within PortfolioProvider");
    }
    return ctx;
}

function usePortfolioStore(): UsePortfolioReturn {
    const { connection } = useConnection();
    const { walletProvider } = useAppKitProvider<any>("solana");
    const walletProviderRef = useRef(walletProvider);
    walletProviderRef.current = walletProvider;
    const { address } = useAppKitAccount();
    const publicKey = address ? new PublicKey(address) : null;

    const [portfolio, setPortfolio] = useState<PortfolioState | null>(null);
    const [walletUsdc, setWalletUsdc] = useState<number | null>(null);
    const [mockStrategyVaults, setMockStrategyVaults] = useState<Record<StrategyId, number>>(
        () => emptyMockStrategyVaults()
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [exists, setExists] = useState(false);
    const refreshGenRef = useRef(0);

    useEffect(() => {
        if (!address) {
            setMockStrategyVaults(emptyMockStrategyVaults());
            return;
        }
        setMockStrategyVaults(readMockStrategyVaults(address));
    }, [address]);

    const getPortfolioPda = useCallback((owner: PublicKey): PublicKey => {
        const [pda] = PublicKey.findProgramAddressSync(
            [PORTFOLIO_SEED, owner.toBuffer()],
            PROGRAM_ID
        );
        return pda;
    }, []);

    const getVaultPda = useCallback((owner: PublicKey): PublicKey => {
        const [pda] = PublicKey.findProgramAddressSync([VAULT_SEED, owner.toBuffer()], PROGRAM_ID);
        return pda;
    }, []);

    const getProgram = useCallback(() => {
        const wp = walletProviderRef.current;
        if (!wp || !publicKey) throw new Error("Wallet not connected");
        const provider = new AnchorProvider(connection, wp as any, { commitment: "confirmed" });
        return new Program(IDL as any, provider);
    }, [connection, publicKey]);

    const refresh = useCallback(async () => {
        const gen = ++refreshGenRef.current;
        const isLatest = () => gen === refreshGenRef.current;

        if (!publicKey || !walletProviderRef.current) {
            if (!isLatest()) return;
            setPortfolio(null);
            setExists(false);
            setWalletUsdc(null);
            setMockStrategyVaults(emptyMockStrategyVaults());
            setError(null);
            setLoading(false);
            return;
        }

        const walletAddr = publicKey.toBase58();

        setLoading(true);
        setError(null);

        try {
            const program = getProgram();
            const pda = getPortfolioPda(publicKey);
            const userAta = getAssociatedTokenAddressSync(USDC_MINT, publicKey);
            const accounts = program.account as any;

            const [accResult, userTokResult] = await Promise.allSettled([
                accounts.portfolio.fetchNullable(pda),
                connection.getTokenAccountBalance(userAta),
            ]);

            if (!isLatest()) return;

            if (userTokResult.status === "fulfilled") {
                setWalletUsdc(Number(userTokResult.value.value.amount) / USDC_DECIMALS);
            } else {
                setWalletUsdc(0);
            }

            if (accResult.status === "fulfilled" && accResult.value) {
                const account = accResult.value as any;
                const amt = account.amountUsdc ?? account.amount_usdc;
                const amountRaw =
                    typeof amt?.toNumber === "function" ? amt.toNumber() : Number(amt ?? 0);
                const lastTs = account.lastDepositAt ?? account.last_deposit_at;
                const lastDepositAt =
                    typeof lastTs?.toNumber === "function" ? lastTs.toNumber() : Number(lastTs ?? 0);
                const depCt = account.depositCount ?? account.deposit_count ?? 0;

                if (!isLatest()) return;
                setExists(true);
                const strat = anchorToStrategyId(account.strategy as object);
                setPortfolio({
                    owner: account.owner?.toBase58?.() ?? "",
                    strategy: strat,
                    amountRaw,
                    amountUsdc: amountRaw / USDC_DECIMALS,
                    lastDepositAt: new Date(lastDepositAt * 1000),
                    depositCount: depCt,
                });
                if (!isLatest()) return;
                const splits = reconcileMockStrategyVaults(
                    walletAddr,
                    amountRaw / USDC_DECIMALS,
                    strat
                );
                setMockStrategyVaults(splits);
            } else {
                if (!isLatest()) return;
                setExists(false);
                setPortfolio(null);
                const cleared = reconcileMockStrategyVaults(walletAddr, 0, "stableYield");
                setMockStrategyVaults(cleared);
            }
        } catch (e: any) {
            if (!isLatest()) return;
            setError(e.message ?? "Failed to fetch portfolio");
            setExists(false);
            setPortfolio(null);
        } finally {
            if (isLatest()) setLoading(false);
        }
    }, [publicKey, getProgram, getPortfolioPda, connection]);

    const refreshRef = useRef(refresh);
    refreshRef.current = refresh;

    const providerReady = !!walletProvider;
    useEffect(() => {
        if (!publicKey?.toBase58()) {
            refreshGenRef.current += 1;
            setPortfolio(null);
            setExists(false);
            setWalletUsdc(null);
            setMockStrategyVaults(emptyMockStrategyVaults());
            setError(null);
            setLoading(false);
            return;
        }
        if (!providerReady) return;
        void refreshRef.current();
    }, [publicKey?.toBase58(), providerReady]);

    const deposit = useCallback(
        async (strategyId: StrategyId, amountUsdc: number): Promise<string> => {
            if (!publicKey) throw new Error("Wallet not connected");

            const program = getProgram();
            const pda = getPortfolioPda(publicKey);
            const vaultPda = getVaultPda(publicKey);
            const userAta = getAssociatedTokenAddressSync(USDC_MINT, publicKey);
            const usdcUnits = new BN(Math.floor(amountUsdc * USDC_DECIMALS));
            const strategy = strategyToAnchor(strategyId);
            const accountsNs = program.account as any;
            const onChainPortfolio = await accountsNs.portfolio.fetchNullable(pda);
            const useInit = !onChainPortfolio;

            let tx: string;

            if (useInit) {
                tx = await program.methods
                    .initializeAndDeposit(strategy, usdcUnits)
                    .accounts({
                        owner: publicKey,
                        portfolio: pda,
                        usdcMint: USDC_MINT,
                        userUsdc: userAta,
                        vault: vaultPda,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        systemProgram: SystemProgram.programId,
                        rent: SYSVAR_RENT_PUBKEY,
                    })
                    .rpc({ commitment: "confirmed" });
            } else {
                tx = await program.methods
                    .deposit(strategy, usdcUnits)
                    .accounts({
                        owner: publicKey,
                        portfolio: pda,
                        usdcMint: USDC_MINT,
                        userUsdc: userAta,
                        vault: vaultPda,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        systemProgram: SystemProgram.programId,
                    })
                    .rpc({ commitment: "confirmed" });
            }

            if (address) {
                const floored =
                    Math.floor(amountUsdc * USDC_DECIMALS) / USDC_DECIMALS;
                addMockStrategyDeposit(address, strategyId, floored);
            }
            await refresh();
            return tx;
        },
        [publicKey, getProgram, getPortfolioPda, getVaultPda, refresh]
    );

    const withdraw = useCallback(
        async (amountUsdc: number): Promise<string> => {
            if (!publicKey) throw new Error("Wallet not connected");

            const program = getProgram();
            const pda = getPortfolioPda(publicKey);
            const vaultPda = getVaultPda(publicKey);
            const userAta = getAssociatedTokenAddressSync(USDC_MINT, publicKey);
            const usdcUnits = new BN(Math.floor(amountUsdc * USDC_DECIMALS));

            const tx = await program.methods
                .withdraw(usdcUnits)
                .accounts({
                    owner: publicKey,
                    portfolio: pda,
                    usdcMint: USDC_MINT,
                    userUsdc: userAta,
                    vault: vaultPda,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                })
                .rpc({ commitment: "confirmed" });

            await refresh();
            return tx;
        },
        [publicKey, getProgram, getPortfolioPda, getVaultPda, refresh]
    );

    const switchStrategy = useCallback(
        async (strategyId: StrategyId): Promise<string> => {
            if (!publicKey) throw new Error("Wallet not connected");

            const program = getProgram();
            const pda = getPortfolioPda(publicKey);
            const strategy = strategyToAnchor(strategyId);

            const tx = await program.methods
                .switchStrategy(strategy)
                .accounts({
                    owner: publicKey,
                    portfolio: pda,
                })
                .rpc({ commitment: "confirmed" });

            await refresh();
            return tx;
        },
        [publicKey, getProgram, getPortfolioPda, refresh]
    );

    return {
        portfolio,
        walletUsdc,
        mockStrategyVaults,
        loading,
        error,
        exists,
        deposit,
        withdraw,
        switchStrategy,
        refresh,
    };
}
