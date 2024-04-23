import { useMutation } from "@tanstack/react-query";
import { createKernelDefiClient } from "@zerodev/defi";
import { type KernelAccountClient } from "@zerodev/sdk";
import { useKernelClient } from "@zerodev/waas";
import { EntryPoint } from "permissionless/types";
import { useMemo } from "react";
import { type Address } from "viem";
import { ZERODEV_APP_ID } from "../utils/constants";

export type UswSwapDataParameters = {
  onSuccess?: () => void;
};

export type SwapDataVariables = {
  from: Address | undefined;
  to: Address | undefined;
  tokenIn: string | null | undefined;
  amountIn: string | undefined;
  tokenOut: string | null | undefined;
  srcChainId: number | undefined;
  dstChainId: number | undefined;
};

export type SwapDataKey = [
  key: string,
  kernelClient: KernelAccountClient<EntryPoint> | undefined
];

export type UseSwapDataKey = {
  variables: SwapDataVariables;
  kernelClient: KernelAccountClient<EntryPoint> | undefined | null;
};

function mutationKey({ ...config }: UseSwapDataKey) {
  const { kernelClient, variables } = config;

  return [
    {
      entity: "swapData",
      kernelClient,
      variables,
    },
  ] as const;
}

export type SwapDataParameters = {
  kernelClient: KernelAccountClient<EntryPoint> | undefined;
  variables: SwapDataVariables;
};

const getSwapData = async (config: SwapDataParameters) => {
  const { kernelClient, variables } = config;

  if (!kernelClient) {
    throw new Error("Invalid kernel client");
  }
  const { from, to, tokenIn, amountIn, tokenOut, srcChainId, dstChainId } =
    variables;
  if (
    !from ||
    !to ||
    !tokenIn ||
    !amountIn ||
    !tokenOut ||
    !srcChainId ||
    !dstChainId
  ) {
    throw new Error("Invalid variables");
  }
  const defiClient = createKernelDefiClient(kernelClient, ZERODEV_APP_ID);

  return await defiClient.getSwapDataCrossChain({
    from,
    to,
    tokenIn,
    amountIn,
    tokenOut,
    fromChainId: srcChainId,
    toChainId: dstChainId,
  });
};

export function useSwapData({ onSuccess }: UswSwapDataParameters = {}) {
  const { kernelClient } = useKernelClient();

  const { mutate, ...result } = useMutation({
    mutationKey: mutationKey({
      kernelClient,
      variables: {} as SwapDataVariables,
    }),
    mutationFn: getSwapData,
    onSuccess,
  });

  const write = useMemo(() => {
    return (variables: SwapDataVariables) => {
      mutate({
        kernelClient,
        variables,
      });
    };
  }, [mutate, kernelClient]);

  return {
    ...result,
    write,
  };
}
