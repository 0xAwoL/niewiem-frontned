import { useCallback, useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useAppKitProvider, useAppKitAccount } from "@reown/appkit/react";
import { Program, AnchorProvider, BN, web3, Idl } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from "@solana/web3.js";
import { 
    TOKEN_PROGRAM_ID, 
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountInstruction,
    getAccount,
    TOKEN_2022_PROGRAM_ID
} from "@solana/spl-token";

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
    /** Raw on-chain units (6 decimals, USDC precision). Mirrors IDL field `amount_lamports`. */
    amountRaw: number;
    amountUsdc: number;
    lastDepositAt: Date;
    depositCount: number;
}

export interface UsePortfolioReturn {
    portfolio: PortfolioState | null;
    loading: boolean;
    error: string | null;
    exists: boolean;
    deposit: (strategyId: StrategyId, amountUsdc: number) => Promise<string>;
    withdraw: (amountUsdc: number) => Promise<string>;
    switchStrategy: (strategyId: StrategyId) => Promise<string>;
    refresh: () => Promise<void>;
}

export function usePortfolio(): UsePortfolioReturn {
    const { connection } = useConnection();
    const { walletProvider } = useAppKitProvider<any>("solana");
    const { address } = useAppKitAccount();
    const publicKey = address ? new PublicKey(address) : null;

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

    const getVaultPda = useCallback((owner: PublicKey): PublicKey => {
        const [pda] = PublicKey.findProgramAddressSync(
            [VAULT_SEED, owner.toBuffer()],
            PROGRAM_ID
        );
        return pda;
    }, []);

    const getProgram = useCallback(() => {
        if (!walletProvider || !publicKey) throw new Error("Wallet not connected");
        const provider = new AnchorProvider(
            connection,
            walletProvider as any,
            { commitment: "confirmed" }
        );
        return new Program(IDL as any, provider);
    }, [connection, walletProvider, publicKey]);

    const refresh = useCallback(async () => {
        if (!publicKey || !walletProvider) return;
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
                    amountRaw: account.amountLamports.toNumber(),
                    amountUsdc: account.amountLamports.toNumber() / USDC_DECIMALS,
                    lastDepositAt: new Date(account.lastDepositAt.toNumber() * 1000),
                    depositCount: account.depositCount,
                });
            }
        } catch (e: any) {
            setError(e.message ?? "Failed to fetch portfolio");
        } finally {
            setLoading(false);
        }
    }, [publicKey, walletProvider, getProgram, getPortfolioPda]);

    useEffect(() => {
        if (publicKey && walletProvider) {
            refresh();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [publicKey?.toBase58()]);

    const deposit = useCallback(async (
        strategyId: StrategyId,
        amountUsdc: number
    ): Promise<string> => {
        if (!publicKey) throw new Error("Wallet not connected");

        const program = getProgram();
        const pda = getPortfolioPda(publicKey);
        const vaultPda = getVaultPda(publicKey);
        const userAta = getAssociatedTokenAddressSync(USDC_MINT, publicKey);
        const usdcUnits = new BN(Math.floor(amountUsdc * USDC_DECIMALS));
        const strategy = strategyToAnchor(strategyId);

        console.log("=== DEPOSIT TRANSACTION DEBUG ===");
        console.log("PROGRAM_ID:", PROGRAM_ID.toBase58());
        console.log("PORTFOLIO_SEED:", PORTFOLIO_SEED.toString(), "bytes:", Array.from(PORTFOLIO_SEED));
        console.log("VAULT_SEED:", VAULT_SEED.toString(), "bytes:", Array.from(VAULT_SEED));
        console.log("---");
        console.log("owner:", publicKey.toBase58());
        console.log("portfolio PDA:", pda.toBase58());
        console.log("vault PDA:", vaultPda.toBase58());
        console.log("usdcMint:", USDC_MINT.toBase58());
        console.log("userUsdc (ATA):", userAta.toBase58());
        console.log("---");
        console.log("tokenProgram:", TOKEN_PROGRAM_ID.toBase58());
        console.log("systemProgram:", SystemProgram.programId.toBase58());
        console.log("rent:", SYSVAR_RENT_PUBKEY.toBase58());
        console.log("=================================");

        console.log("Checking for token accounts...");
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
            programId: TOKEN_PROGRAM_ID
        });
        console.log(`Found ${tokenAccounts.value.length} token accounts:`);
        tokenAccounts.value.forEach((acc, i) => {
            const parsed = acc.account.data.parsed.info;
            console.log(`  ${i + 1}. Mint: ${parsed.mint}, Balance: ${parsed.tokenAmount.uiAmount}`);
        });

        try {
            const accountInfo = await getAccount(connection, userAta);
            console.log("✓ User USDC ATA exists");
            console.log("  Balance:", accountInfo.amount.toString());
            console.log("  Mint:", accountInfo.mint.toBase58());
            console.log("  Owner:", accountInfo.owner.toBase58());
        } catch (e: any) {
            console.log("✗ User USDC ATA check failed:", e.message);
            console.log("Attempting transaction anyway - the program will create it if needed or fail with a better error");
        }

        let tx: string;

        if (!exists) {
            const accounts = {
                owner: publicKey,
                portfolio: pda,
                usdcMint: USDC_MINT,
                userUsdc: userAta,
                vault: vaultPda,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                rent: SYSVAR_RENT_PUBKEY,
            };
            console.log("Accounts object:");
            Object.entries(accounts).forEach(([key, val]) => {
                console.log(`  ${key}: ${val.toBase58()}`);
            });
            
            tx = await program.methods
                .initializeAndDeposit(strategy, usdcUnits)
                .accounts(accounts)
                .rpc({ commitment: "confirmed" });
        } else {
            const accounts = {
                owner: publicKey,
                portfolio: pda,
                usdcMint: USDC_MINT,
                userUsdc: userAta,
                vault: vaultPda,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            };
            console.log("Accounts object:");
            Object.entries(accounts).forEach(([key, val]) => {
                console.log(`  ${key}: ${val.toBase58()}`);
            });
            
            tx = await program.methods
                .deposit(strategy, usdcUnits)
                .accounts(accounts)
                .rpc({ commitment: "confirmed" });
        }

        await refresh();
        return tx;
    }, [publicKey, exists, getProgram, getPortfolioPda, getVaultPda, refresh, connection]);

    const withdraw = useCallback(async (amountUsdc: number): Promise<string> => {
        if (!publicKey) throw new Error("Wallet not connected");

        const program = getProgram();
        const pda = getPortfolioPda(publicKey);
        const vaultPda = getVaultPda(publicKey);
        const userAta = getAssociatedTokenAddressSync(USDC_MINT, publicKey);
        const usdcUnits = new BN(Math.floor(amountUsdc * USDC_DECIMALS));

        console.log("=== WITHDRAW TRANSACTION DEBUG ===");
        console.log("PROGRAM_ID:", PROGRAM_ID.toBase58());
        console.log("PORTFOLIO_SEED:", PORTFOLIO_SEED.toString(), "bytes:", Array.from(PORTFOLIO_SEED));
        console.log("VAULT_SEED:", VAULT_SEED.toString(), "bytes:", Array.from(VAULT_SEED));
        console.log("---");
        console.log("owner:", publicKey.toBase58());
        console.log("portfolio PDA:", pda.toBase58());
        console.log("vault PDA:", vaultPda.toBase58());
        console.log("usdcMint:", USDC_MINT.toBase58());
        console.log("userUsdc (ATA):", userAta.toBase58());
        console.log("---");
        console.log("tokenProgram:", TOKEN_PROGRAM_ID.toBase58());
        console.log("systemProgram:", SystemProgram.programId.toBase58());
        console.log("==================================");

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
    }, [publicKey, getProgram, getPortfolioPda, getVaultPda, refresh]);

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