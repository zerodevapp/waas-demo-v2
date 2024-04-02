import { useKernelClient } from "@/waas";
import { useMutation } from "@tanstack/react-query";
import type { Config } from "@wagmi/core";
import { type WriteContractParameters } from "@wagmi/core";
import { KernelAccountClient, KernelSmartAccount } from "@zerodev/sdk";
import { EntryPoint } from "permissionless/types";
import { useMemo } from "react";
import { encodeFunctionData } from "viem";
import { ResolvedRegister } from "wagmi";

export type SendUserOperationWriteArgs = WriteContractParameters;

export type UseSendUserOperationArgs = {
  parameters: SendUserOperationWriteArgs;
  kernelClient: KernelAccountClient<EntryPoint> | null;
  kernelAccount: KernelSmartAccount<EntryPoint> | null;
};

function mutationKey({ ...config }: UseSendUserOperationArgs) {
  const { kernelAccount, kernelClient, parameters } = config;

  return [
    {
      entity: "sendUserOperation",
      kernelAccount,
      kernelClient,
      parameters,
    },
  ] as const;
}

async function mutationFn(config: UseSendUserOperationArgs) {
  const { kernelAccount, kernelClient, parameters } = config;

  if (!kernelClient || !kernelAccount) {
    throw new Error("Kernel Client is required");
  }

  return kernelClient.sendUserOperation({
    userOperation: {
      callData: await kernelAccount.encodeCallData({
        to: parameters.address,
        value: parameters.value ?? 0n,
        data: encodeFunctionData(parameters),
      }),
    },
  });
}

export function useSendUserOperation<
  config extends Config = ResolvedRegister["config"],
  context = unknown
>() {
  const { kernelAccount, kernelClient } = useKernelClient();

  const { mutate, ...result } = useMutation({
    mutationKey: mutationKey({
      kernelClient,
      kernelAccount,
      parameters: {} as SendUserOperationWriteArgs,
    }),
    mutationFn,
  });

  const write = useMemo(() => {
    if (!kernelAccount || !kernelClient) return undefined;
    return (parameters: SendUserOperationWriteArgs) => {
      mutate({
        parameters,
        kernelAccount,
        kernelClient,
      });
    };
  }, [mutate, kernelClient, kernelAccount]);

  return {
    ...result,
    write,
  };
}
