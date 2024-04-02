import { useMutation } from "@tanstack/react-query";
import { type WriteContractParameters } from "@wagmi/core";
import {
  type KernelAccountClient,
  type KernelSmartAccount,
} from "@zerodev/sdk";
import { type EntryPoint } from "permissionless/types";
import { useMemo } from "react";
import { encodeFunctionData } from "viem";
import { useSessionKernelClient } from "./useSessionKernelClient";

export type UseSendUserOperationWithSessionArgs = {
  sessionId?: `0x${string}` | undefined;
};

export type SendUserOperationWithSessionWriteArgs = WriteContractParameters;

export type UseSendUserOperationWithSessionKey = {
  parameters: SendUserOperationWithSessionWriteArgs;
  kernelClient: KernelAccountClient<EntryPoint> | undefined;
  kernelAccount: KernelSmartAccount<EntryPoint> | undefined;
};

function mutationKey({ ...config }: UseSendUserOperationWithSessionKey) {
  const { parameters, kernelClient, kernelAccount } = config;

  return [
    {
      entity: "sendUserOperationWithSession",
      parameters,
      kernelClient,
      kernelAccount,
    },
  ] as const;
}

async function mutationFn(config: UseSendUserOperationWithSessionKey) {
  const { parameters, kernelClient, kernelAccount } = config;

  if (!kernelClient || !kernelAccount) {
    throw new Error("Kernel Client is required");
  }

  const userOpHash = await kernelClient.sendUserOperation({
    userOperation: {
      callData: await kernelAccount.encodeCallData({
        to: parameters.address,
        value: parameters.value ?? 0n,
        data: encodeFunctionData(parameters),
      }),
    },
  });

  return userOpHash;
}

export function useSendUserOperationWithSession({
  sessionId,
}: UseSendUserOperationWithSessionArgs) {
  const {
    kernelClient,
    kernelAccount,
    error: clientError,
  } = useSessionKernelClient({
    sessionId: sessionId,
  });

  const { mutate, error, ...result } = useMutation({
    mutationKey: mutationKey({
      parameters: {} as SendUserOperationWithSessionWriteArgs,
      kernelClient,
      kernelAccount,
    }),
    mutationFn,
  });

  const write = useMemo(() => {
    if (!kernelAccount || !kernelClient) return undefined;
    return (parameters: SendUserOperationWithSessionWriteArgs) => {
      mutate({
        parameters,
        kernelClient,
        kernelAccount,
      });
    };
  }, [mutate, kernelClient, kernelAccount]);

  return {
    ...result,
    error: error || clientError,
    write,
  };
}
