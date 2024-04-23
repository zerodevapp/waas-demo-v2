import { supportedChain } from "@/utils/tokenAddress";
import {
  QueryFunctionContext,
  useQuery,
  type QueryFunction,
} from "@tanstack/react-query";
import {
  createPublicClient,
  erc20Abi,
  formatUnits,
  http,
  type Address,
} from "viem";
import { useAccount } from "wagmi";

export type UseSwapBalanceParameters = {
  chainId: number | undefined | null;
  tokenAddress: string | undefined | null;
};

export type SwapBalanceKey = [
  key: string,
  params: {
    address: Address;
    chainId: number;
    tokenAddress: Address;
  }
];

const getTokenBalance = async ({
  queryKey,
}: QueryFunctionContext<SwapBalanceKey>) => {
  const [_key, { chainId, tokenAddress, address }] = queryKey;
  const chain = supportedChain.find((c) => c.id == chainId);

  if (!chain) {
    throw new Error("Invalid chain id");
  }
  const publicClient = createPublicClient({
    chain: chain,
    transport: http(),
  });
  if (tokenAddress === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
    const value = await publicClient.getBalance({
      address,
    });
    const decimals = 18;
    return {
      value,
      decimals,
      formatted: formatUnits(value, decimals),
    };
  }
  const [value, decimals] = await Promise.all([
    publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    }),
    await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "decimals",
    }),
  ]);
  return {
    value,
    decimals,
    formatted: formatUnits(value, decimals),
  };
};

export function useSwapBalance({
  chainId,
  tokenAddress,
}: UseSwapBalanceParameters) {
  const { address } = useAccount();

  return useQuery({
    queryKey: [
      "swapBalance",
      {
        chainId,
        tokenAddress,
        address,
      },
    ],
    queryFn: getTokenBalance as unknown as QueryFunction<any>,
    enabled: !!address && !!chainId && !!tokenAddress,
  });
}
