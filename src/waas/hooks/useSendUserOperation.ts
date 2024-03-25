import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import type { Config } from "@wagmi/core";
import { type Evaluate, type UnionOmit } from "@wagmi/core/internal";
import {
  createKernelAccountClient,
  createZeroDevPaymasterClient,
  KernelSmartAccount,
} from "@zerodev/sdk";
import { type SendUserOperationParameters } from "permissionless";
import { useCallback, useContext } from "react";
import { http, type Hash } from "viem";
import { ResolvedRegister } from "wagmi";
import { polygonMumbai } from "wagmi/chains";
import { ZeroDevValidatorContext } from "../components/ZeroDevProvider/ZeroDevValidatorContext";
import { useAppId } from "./useAppId";

export type ConfigParameter<config extends Config = Config> = {
  config?: Config | config | undefined;
};

export type UseMutationReturnType<
  data = unknown,
  error = Error,
  variables = void,
  context = unknown
> = Evaluate<
  UnionOmit<
    UseMutationResult<data, error, variables, context>,
    "mutate" | "mutateAsync"
  >
>;

export type UseSendUserOperationParameters<
  config extends Config = Config,
  context = unknown
> = SendUserOperationParameters;

export type UseSendUserOperationReturnType<
  config extends Config = Config,
  context = unknown
> = Hash;

export type UseSendUserOperationArgs = {
  parameters: SendUserOperationWriteArgs;
  appId: string | null;
  account: KernelSmartAccount | null;
};

function mutationKey({ ...config }: UseSendUserOperationArgs) {
  const { account, appId, parameters } = config;

  return [
    {
      entity: "sendUserOperation",
      account,
      appId,
      parameters,
    },
  ] as const;
}

function mutationFn(config: UseSendUserOperationArgs) {
  const { account, appId, parameters } = config;
  const { to, value, data } = parameters;

  if (!account) {
    throw new Error("KernelSmartAccount is required");
  }
  if (to === undefined || value === undefined || data === undefined) {
    throw new Error("UserOperation is required");
  }
  if (!appId) {
    throw new Error("API key is required");
  }

  const kernelClient = createKernelAccountClient({
    account: account,
    chain: polygonMumbai,
    transport: http(`https://rpc.zerodev.app/api/v2/bundler/${appId}`),
    sponsorUserOperation: async ({ userOperation }) => {
      const zerodevPaymaster = createZeroDevPaymasterClient({
        chain: polygonMumbai,
        transport: http(`https://rpc.zerodev.app/api/v2/paymaster/${appId}`),
      });
      return zerodevPaymaster.sponsorUserOperation({
        userOperation,
      });
    },
  });

  return kernelClient.sendUserOperation({
    // userOperation: {
    //   callData: kernelClient.account.encodeCallData({
    //     to: "0x6136b647C9971f1EDc7641e14a9E0Ca7b2626080",
    //     value: 0n,
    //     data: "0x",
    //   }),
    // },
    userOperation: {
      callData: kernelClient.account.encodeCallData({
        to,
        value,
        data,
      }),
    },
  });
}

export type SendUserOperationWriteArgs = Partial<{
  to: `0x${string}`;
  value: bigint;
  data: `0x${string}`;
}>;

export function useSendUserOperation<
  config extends Config = ResolvedRegister["config"],
  context = unknown
>() {
  const { kernelAccount } = useContext(ZeroDevValidatorContext);
  const { appId } = useAppId();

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
      appId,
      account: kernelAccount,
      parameters: {},
    }),
    mutationFn,
  });

  const write = useCallback(
    (parameters: SendUserOperationWriteArgs) => {
      if (!parameters || !appId || !kernelAccount) return undefined;

      mutate({
        parameters,
        account: kernelAccount,
        appId,
      });
    },
    [mutate, appId, kernelAccount]
  );

  return {
    data,
    error,
    isError,
    isIdle,
    isSuccess,
    reset,
    status,
    variables,
    write,
  };
}
