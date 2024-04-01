import { useMutation } from "@tanstack/react-query";
import { type Policy } from "@zerodev/permission-validator";
import {
  type KernelAccountClient,
  type KernelSmartAccount,
} from "@zerodev/sdk";
import { type EntryPoint } from "permissionless/types";
import { useMemo } from "react";
import { getSession } from "../sessions/manageSession";
import { useSessionKernelClient } from "./useSessionKernelClient";

export type UseSendUserOperationWithSessionArgs = {
  permissionId?: `0x${string}` | undefined;
};

export type SendUserOperationWithSessionWriteArgs = Partial<{
  to: `0x${string}`;
  value: bigint;
  data: `0x${string}`;
}>;

export type UseSendUserOperationWithSessionKey = {
  parameters: SendUserOperationWithSessionWriteArgs;
  policies: Policy[] | undefined;
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
  const { to, value, data } = parameters;

  if (!kernelClient || !kernelAccount) {
    throw new Error("Kernel Client is required");
  }
  if (to === undefined || value === undefined || data === undefined) {
    throw new Error("UserOperation is required");
  }

  const userOpHash = await kernelClient.sendUserOperation({
    userOperation: {
      callData: await kernelAccount.encodeCallData({
        to,
        value,
        data,
      }),
    },
  });

  return userOpHash;
}

export function useSendUserOperationWithSession({
  permissionId,
}: UseSendUserOperationWithSessionArgs) {
  const {
    kernelClient,
    kernelAccount,
    error: clientError,
  } = useSessionKernelClient({
    permissionId: permissionId,
  });
  const selectedSession = getSession(permissionId);
  const policies = selectedSession?.policies;

  const {
    data,
    error,
    isError,
    isIdle,
    isSuccess,
    mutate,
    mutateAsync,
    reset,
    status,
    variables,
  } = useMutation({
    mutationKey: mutationKey({
      parameters: {},
      policies: policies,
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
        policies: policies,
        kernelClient,
        kernelAccount,
      });
    };
  }, [mutate, kernelClient, kernelAccount, policies]);

  return {
    data,
    error: error || clientError,
    isError,
    isIdle,
    isSuccess,
    reset,
    status,
    variables,
    write,
  };
}
