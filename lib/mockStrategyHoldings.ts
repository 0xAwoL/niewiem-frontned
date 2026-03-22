export type MockStrategyId = "stableYield" | "conservative" | "growthFocus";

const STORAGE_NS = "reap_mock_strategy_vault_v1";

const IDS: MockStrategyId[] = ["stableYield", "conservative", "growthFocus"];

export function emptyMockStrategyVaults(): Record<MockStrategyId, number> {
    return { stableYield: 0, conservative: 0, growthFocus: 0 };
}

function storageKey(walletAddress: string) {
    return `${STORAGE_NS}:${walletAddress}`;
}

export function readMockStrategyVaults(walletAddress: string): Record<MockStrategyId, number> {
    if (typeof window === "undefined") return emptyMockStrategyVaults();
    try {
        const raw = localStorage.getItem(storageKey(walletAddress));
        if (!raw) return emptyMockStrategyVaults();
        const o = JSON.parse(raw) as Partial<Record<MockStrategyId, number>>;
        const out = emptyMockStrategyVaults();
        for (const id of IDS) {
            const v = Number(o[id]);
            out[id] = Number.isFinite(v) && v >= 0 ? v : 0;
        }
        return out;
    } catch {
        return emptyMockStrategyVaults();
    }
}

function writeMockStrategyVaults(walletAddress: string, b: Record<MockStrategyId, number>) {
    if (typeof window === "undefined") return;
    localStorage.setItem(storageKey(walletAddress), JSON.stringify(b));
}

export function addMockStrategyDeposit(
    walletAddress: string,
    strategyId: MockStrategyId,
    amountUsdc: number
) {
    const b = readMockStrategyVaults(walletAddress);
    b[strategyId] += Math.max(0, amountUsdc);
    writeMockStrategyVaults(walletAddress, b);
}

export function reconcileMockStrategyVaults(
    walletAddress: string,
    chainVaultUsdc: number,
    seedStrategyId: MockStrategyId
): Record<MockStrategyId, number> {
    const b = readMockStrategyVaults(walletAddress);
    const sum = IDS.reduce((s, id) => s + b[id], 0);

    if (chainVaultUsdc < 1e-9) {
        const z = emptyMockStrategyVaults();
        writeMockStrategyVaults(walletAddress, z);
        return z;
    }

    if (sum < 1e-9) {
        const out = emptyMockStrategyVaults();
        out[seedStrategyId] = chainVaultUsdc;
        writeMockStrategyVaults(walletAddress, out);
        return out;
    }

    const scale = chainVaultUsdc / sum;
    const out = emptyMockStrategyVaults();
    for (const id of IDS) {
        out[id] = b[id] * scale;
    }

    const total = IDS.reduce((s, id) => s + out[id], 0);
    const drift = chainVaultUsdc - total;
    const biggest = IDS.reduce((a, id) => (out[id] > out[a] ? id : a), IDS[0]);
    out[biggest] += drift;

    writeMockStrategyVaults(walletAddress, out);
    return out;
}
