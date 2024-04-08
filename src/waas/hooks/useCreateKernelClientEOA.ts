import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { connect, getAccount, getWalletClient } from "@wagmi/core";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import {
  createKernelAccount,
  KernelSmartAccount,
  KernelValidator,
} from "@zerodev/sdk";
import { walletClientToSmartAccountSigner } from "permissionless";
import { EntryPoint } from "permissionless/types";
import { useMemo } from "react";
import { type PublicClient } from "viem";
import { useConfig, usePublicClient, type Config, type Connector } from "wagmi";
import { useSetKernelAccount } from "../components/ZeroDevProvider/ZeroDevValidatorContext";
import { type KernelVersionType } from "../types";
import { getEntryPointFromVersion } from "../utils/entryPoint";

export type UseCreateKernelClientEOAArg = {
  version: KernelVersionType;
};

export type CreateKernelClientEOAArgs = {
  connector: Connector | undefined;
};

export type UseCreateKernelClientEOAKey = {
  connector: Connector | null | undefined;
  wagmiConfig: Config | undefined | null;
  publicClient: PublicClient | undefined | null;
  version: KernelVersionType;
};

export type CreateKernelClientEOAReturnType = {
  validator: KernelValidator<EntryPoint>;
  kernelAccount: KernelSmartAccount<EntryPoint>;
  entryPoint: EntryPoint;
};

export type UseCreateKernelClientEOAReturnType = {
  connect: ({ connector }: CreateKernelClientEOAArgs) => void;
} & Omit<
  UseMutationResult<
    CreateKernelClientEOAReturnType,
    unknown,
    UseCreateKernelClientEOAKey,
    unknown
  >,
  "mutate"
>;

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

async function mutationFn(
  config: UseCreateKernelClientEOAKey
): Promise<CreateKernelClientEOAReturnType> {
  const { wagmiConfig, connector, publicClient, version } = config;

  if (!wagmiConfig || !connector || !publicClient) {
    throw new Error("missing config and connector");
  }
  const entryPoint = getEntryPointFromVersion(version);

  const { status } = getAccount(wagmiConfig);
  if (status === "disconnected") {
    await connect(wagmiConfig, { connector });
  }
  const walletClient = await getWalletClient(wagmiConfig);
  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    entryPoint: entryPoint,
    signer: walletClientToSmartAccountSigner(walletClient),
  });
  const account = await createKernelAccount(publicClient, {
    entryPoint: entryPoint,
    plugins: {
      sudo: ecdsaValidator,
      entryPoint: entryPoint,
    },
  });

  return { validator: ecdsaValidator, kernelAccount: account, entryPoint };
}

/**
 * Hook for creating a Kernel client for an EOA.
 *
 * @param version - The version of the Kernel to use.
 * @returns An object containing the `connect` function and mutation results.
 */
export function useCreateKernelClientEOA({
  version,
}: UseCreateKernelClientEOAArg): UseCreateKernelClientEOAReturnType {
  const {
    setValidator,
    setKernelAccount,
    setEntryPoint,
    setKernelAccountClient,
  } = useSetKernelAccount();
  const config = useConfig();
  const client = usePublicClient();

  const { data, mutate, ...result } = useMutation({
    mutationKey: mutationKey({
      wagmiConfig: config,
      connector: undefined,
      publicClient: client,
      version,
    }),
    mutationFn,
    onSuccess: (data) => {
      setValidator(data.validator);
      setKernelAccount(data.kernelAccount);
      setEntryPoint(data.entryPoint);
      setKernelAccountClient(null);
    },
  });

  const connect = useMemo(() => {
    return ({ connector }: CreateKernelClientEOAArgs) =>
      mutate({
        connector,
        wagmiConfig: config,
        publicClient: client,
        version,
      });
  }, [config, mutate, client, version]);

  return {
    ...result,
    data,
    connect,
  };
}
