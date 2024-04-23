import { Hex } from "viem";
import { arbitrum, base, optimism, polygon } from "viem/chains";

export type TokenSymbolsMap = {
  10: "ETH" | "USDC" | "USDCe" | "USDT" | "DAI";
  137: "MATIC" | "USDC" | "USDCe" | "USDT" | "DAI";
  8453: "ETH" | "USDC" | "DAI";
  42161: "ETH" | "USDC" | "USDCe" | "USDT" | "DAI";
};

export type TokenChainType = keyof TokenSymbolsMap;

export type TokenSymbolType<TChain extends TokenChainType | undefined> =
  TChain extends TokenChainType ? TokenSymbolsMap[TChain] : undefined;

export const supportedChain = [polygon, optimism, base, arbitrum];

export const tokenAddress: {
  [chainId in TokenChainType]: {
    [token in TokenSymbolsMap[chainId]]: Hex;
  };
} = {
  10: {
    ETH: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    USDC: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    USDCe: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
    USDT: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
  },
  137: {
    MATIC: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    USDC: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    USDCe: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    DAI: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
  },
  8453: {
    ETH: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    USDC: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    DAI: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
  },
  42161: {
    ETH: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    USDCe: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
    USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
  },
};

export const chainIdToName = (chainId: TokenChainType | undefined): string => {
  if (chainId == 10) return "Optimism";
  else if (chainId == 137) return "Polygon";
  else if (chainId == 8453) return "Base";
  else if (chainId == 42161) return "Arbitrum";
  else return "Unknown";
};

export function getTokenByChainIdAndAddress(
  chainId: TokenChainType,
  erc20Address: string
): string | undefined {
  const tokens = tokenAddress[chainId];

  if (!tokens) return undefined;
  for (const [token, address] of Object.entries(tokens)) {
    if (address.toLowerCase() === erc20Address.toLowerCase()) {
      return token;
    }
  }
  return undefined;
}
