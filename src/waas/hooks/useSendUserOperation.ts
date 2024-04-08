import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import type { Config } from "@wagmi/core";
import { type WriteContractParameters } from "@wagmi/core";
import { KernelAccountClient, KernelSmartAccount } from "@zerodev/sdk";
import { EntryPoint } from "permissionless/types";
import { useMemo } from "react";
import { encodeFunctionData, type Hash } from "viem";
import { ResolvedRegister } from "wagmi";
import { useKernelClient } from "./useKernelClient";

export type SendUserOperationWriteArgs = WriteContractParameters[];

export type UseSendUserOperationArgs = {
  parameters: SendUserOperationWriteArgs;
  kernelClient: KernelAccountClient<EntryPoint> | null;
  kernelAccount: KernelSmartAccount<EntryPoint> | null;
};

export type SendUserOperationReturnType = Hash;

export type UseSendUserOperationReturnType = {
  write: ((parameters: SendUserOperationWriteArgs) => void) | undefined;
} & Omit<
  UseMutationResult<
    SendUserOperationReturnType,
    unknown,
    UseSendUserOperationArgs,
    unknown
  >,
  "mutate"
>;

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

async function mutationFn(
  config: UseSendUserOperationArgs
): Promise<SendUserOperationReturnType> {
  const { kernelAccount, kernelClient, parameters } = config;

  if (!kernelClient || !kernelAccount) {
    throw new Error("Kernel Client is required");
  }

  return kernelClient.sendUserOperation({
    userOperation: {
      callData: await kernelAccount.encodeCallData(
        parameters.map((p) => ({
          to: p.address,
          value: p.value ?? 0n,
          data: encodeFunctionData(p),
        }))
      ),
    },
  });
}

export function useSendUserOperation<
  config extends Config = ResolvedRegister["config"],
  context = unknown
>(): UseSendUserOperationReturnType {
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
