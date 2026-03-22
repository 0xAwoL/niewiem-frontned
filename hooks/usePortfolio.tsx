import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, BN, web3, Idl } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import IDL from "../idl/mock_portfolio.json";

const PROGRAM_ID = new PublicKey("MockPortfo1io111111111111111111111111111111");
const PORTFOLIO_SEED = Buffer.from("portfolio");

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
        case "stableYield": return { stableYield: {} };
        case "conservative": return { conservative: {} };
        case "growthFocus": return { growthFocus: {} };
    }
}

function anchorToStrategyId(raw: object): StrategyId {
    if ("stableYield" in raw) return "stableYield";
    if ("conservative" in raw) return "conservative";
    if ("growthFocus" in raw) return "growthFocus";
    return "stableYield";
}

export interface PortfolioState {
    owner: string;
    strategy: StrategyId;
    amountLamports: number;
    amountSol: number;
    lastDepositAt: Date;
    depositCount: number;
}

export interface UsePortfolioReturn {
    portfolio: PortfolioState | null;
    loading: boolean;
    error: string | null;
    exists: boolean;
    deposit: (strategyId: StrategyId, amountSol: number) => Promise<string>;
    withdraw: (amountSol: number) => Promise<string>;
    switchStrategy: (strategyId: StrategyId) => Promise<string>;
    refresh: () => Promise<void>;
}

export function usePortfolio(): UsePortfolioReturn {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const anchorWallet = useAnchorWallet();

    const [portfolio, setPortfolio] = useState<PortfolioState | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [exists, setExists] = useState(false);

    const getPortfolioPda = useCallback((owner: PublicKey): PublicKey => {
        const [pda] = PublicKey.findProgramAddressSync(
            [PORTFOLIO_SEED, owner.toBuffer()],
            PROGRAM_ID
        );
        return pda;
    }, []);

    const getProgram = useCallback(() => {
        if (!anchorWallet) throw new Error("Wallet not connected");
        const provider = new AnchorProvider(
            connection,
            anchorWallet,
            { commitment: "confirmed" }
        );
        return new Program(IDL as Idl, PROGRAM_ID, provider);
    }, [connection, anchorWallet]);

    const refresh = useCallback(async () => {
        if (!publicKey || !anchorWallet) return;
        setLoading(true);
        setError(null);

        try {
            const program = getProgram();
            const pda = getPortfolioPda(publicKey);
            const account = await program.account.portfolio.fetchNullable(pda);

            if (!account) {
                setExists(false);
                setPortfolio(null);
            } else {
                setExists(true);
                setPortfolio({
                    owner: account.owner.toBase58(),
                    strategy: anchorToStrategyId(account.strategy as object),
                    amountLamports: account.amountLamports.toNumber(),
                    amountSol: account.amountLamports.toNumber() / LAMPORTS_PER_SOL,
                    lastDepositAt: new Date(account.lastDepositAt.toNumber() * 1000),
                    depositCount: account.depositCount,
                });
            }
        } catch (e: any) {
            setError(e.message ?? "Failed to fetch portfolio");
        } finally {
            setLoading(false);
        }
    }, [publicKey, anchorWallet, getProgram, getPortfolioPda]);

    useEffect(() => {
        refresh();
    }, [publicKey, anchorWallet, refresh]);

    const deposit = useCallback(async (
        strategyId: StrategyId,
        amountSol: number
    ): Promise<string> => {
        if (!publicKey) throw new Error("Wallet not connected");

        const program = getProgram();
        const pda = getPortfolioPda(publicKey);
        const lamports = new BN(Math.floor(amountSol * LAMPORTS_PER_SOL));
        const strategy = strategyToAnchor(strategyId);

        let tx: string;

        if (!exists) {
            tx = await program.methods
                .initializeAndDeposit(strategy, lamports)
                .accounts({
                    owner: publicKey,
                    portfolio: pda,
                    systemProgram: SystemProgram.programId,
                })
                .rpc({ commitment: "confirmed" });
        } else {
            tx = await program.methods
                .deposit(strategy, lamports)
                .accounts({
                    owner: publicKey,
                    portfolio: pda,
                    systemProgram: SystemProgram.programId,
                })
                .rpc({ commitment: "confirmed" });
        }

        await refresh();
        return tx;
    }, [publicKey, exists, getProgram, getPortfolioPda, refresh]);

    const withdraw = useCallback(async (amountSol: number): Promise<string> => {
        if (!publicKey) throw new Error("Wallet not connected");

        const program = getProgram();
        const pda = getPortfolioPda(publicKey);
        const lamports = new BN(Math.floor(amountSol * LAMPORTS_PER_SOL));

        const tx = await program.methods
            .withdraw(lamports)
            .accounts({
                owner: publicKey,
                portfolio: pda,
                systemProgram: SystemProgram.programId,
            })
            .rpc({ commitment: "confirmed" });

        await refresh();
        return tx;
    }, [publicKey, getProgram, getPortfolioPda, refresh]);

    const switchStrategy = useCallback(async (strategyId: StrategyId): Promise<string> => {
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
    }, [publicKey, getProgram, getPortfolioPda, refresh]);

    return { portfolio, loading, error, exists, deposit, withdraw, switchStrategy, refresh };
}