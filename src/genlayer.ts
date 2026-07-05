import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}` | undefined;
export const EXPLORER_URL = "https://explorer-bradbury.genlayer.com";
export const readClient = createClient({ chain: testnetBradbury });

export async function ensureBradburyNetwork() {
  if (!window.ethereum) throw new Error("Install MetaMask to continue.");
  const chainId = "0x107d";
  try {
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error
      ? Number((error as { code: unknown }).code) : 0;
    if (code !== 4902 && !/unrecognized|unknown chain/i.test(errorMessage(error))) throw error;
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId,
        chainName: "GenLayer Bradbury Testnet",
        nativeCurrency: { name: "GEN Token", symbol: "GEN", decimals: 18 },
        rpcUrls: ["https://rpc-bradbury.genlayer.com"],
        blockExplorerUrls: [EXPLORER_URL],
      }],
    });
  }
}

export function createWriteClient(account: `0x${string}`) {
  if (!window.ethereum) throw new Error("Install MetaMask to continue.");
  return createClient({ chain: testnetBradbury, account, provider: window.ethereum });
}

export const shortAddress = (value: string) => `${value.slice(0, 6)}…${value.slice(-4)}`;
export function errorMessage(error: unknown) {
  if (error instanceof Error) {
    if (/user rejected|denied/i.test(error.message)) return "The wallet request was cancelled.";
    return error.message.split("\n")[0];
  }
  return "Something went wrong. Please try again.";
}
