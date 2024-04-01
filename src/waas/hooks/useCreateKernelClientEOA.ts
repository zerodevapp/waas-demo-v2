import { useMutation } from "@tanstack/react-query";
import { connect, getAccount, getWalletClient } from "@wagmi/core";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { createKernelAccount } from "@zerodev/sdk";
import { walletClientToSmartAccountSigner } from "permissionless";
import { useEffect, useMemo } from "react";
import { type PublicClient } from "viem";
import { useConfig, usePublicClient, type Config, type Connector } from "wagmi";
import { getEntryPoint } from "../utils/entryPoint";
import { useKernelAccount } from "./useKernelAccount";

export type CreateKernelClientEOAArgs = {
  connector: Connector | undefined;
};

export type UseCreateKernelClientEOAKey = {
  connector: Connector | null | undefined;
  wagmiConfig: Config | undefined | null;
  publicClient: PublicClient | undefined | null;
};

function mutationKey({ ...config }: UseCreateKernelClientEOAKey) {
  const { connector, wagmiConfig } = config;

  return [
    {
      entity: "CreateKernelClient",
      connector,
      wagmiConfig,
    },
  ] as const;
}

async function mutationFn(config: UseCreateKernelClientEOAKey) {
  const { wagmiConfig, connector, publicClient } = config;

  if (!wagmiConfig || !connector || !publicClient) {
    throw new Error("missing config and connector");
  }

  const { status } = getAccount(wagmiConfig);
  if (status === "disconnected") {
    await connect(wagmiConfig, { connector });
  }
  const walletClient = await getWalletClient(wagmiConfig);
  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    entryPoint: getEntryPoint(),
    signer: walletClientToSmartAccountSigner(walletClient),
  });
  const account = await createKernelAccount(publicClient, {
    entryPoint: getEntryPoint(),
    plugins: {
      sudo: ecdsaValidator,
      entryPoint: getEntryPoint(),
    },
  });

  return { validator: ecdsaValidator, kernelAccount: account };
}

export function useCreateKernelClientEOA() {
  const { setValidator, setKernelAccount } = useKernelAccount();
  const config = useConfig();
  const client = usePublicClient();

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
      wagmiConfig: config,
      connector: undefined,
      publicClient: client,
    }),
    mutationFn,
  });

  const connect = useMemo(() => {
    // if (!config) return undefined;
    return ({ connector }: CreateKernelClientEOAArgs) =>
      mutate({
        connector,
        wagmiConfig: config,
        publicClient: client,
      });
  }, [config, mutate, client]);

  useEffect(() => {
    if (data) {
      setValidator(data.validator);
      setKernelAccount(data.kernelAccount);
    }
  }, [data, setValidator, setKernelAccount]);

  return {
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
    connect,
  };
}
