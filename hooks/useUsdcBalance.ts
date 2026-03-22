import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";

const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

export function useUsdcBalance() {
  const { connection }  = useConnection();
  const { address } = useAppKitAccount();
  const publicKey = address ? new PublicKey(address) : null;
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setBalance(null);
      return;
    }
    
    let isMounted = true;
    (async () => {
      try {
        const accounts = await connection.getParsedTokenAccountsByOwner(publicKey, { mint: USDC_MINT });
        if (isMounted) {
          if (accounts.value.length > 0) {
            // Web3.js parsed JSON returns the exact decimal-shifted amount as a string/number
            const amount = accounts.value[0].account.data.parsed.info.tokenAmount.uiAmountString;
            setBalance(Number(amount));
          } else {
            setBalance(0);
          }
        }
      } catch (e) {
        if (isMounted) {
          setBalance(0);
        }
      }
    })();
    
    return () => {
      isMounted = false;
    };
  }, [publicKey?.toBase58(), connection]);

  return balance;
}
