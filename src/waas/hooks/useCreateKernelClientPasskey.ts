import { useMutation } from "@tanstack/react-query";
import {
  createPasskeyValidator,
  getPasskeyValidator,
} from "@zerodev/passkey-validator";
import { createKernelAccount, type KernelValidator } from "@zerodev/sdk";
import type { EntryPoint } from "permissionless/types";
import { useEffect, useMemo } from "react";
import { type PublicClient } from "viem";
import { usePublicClient } from "wagmi";
import { type KernelVersionType } from "../types";
import { getEntryPointFromVersion } from "../utils/entryPoint";
import { getWeb3AuthNValidatorFromVersion } from "../utils/webauthn";
import { useAppId } from "./useAppId";
import { useKernelAccount } from "./useKernelAccount";

type PasskeConnectType = "register" | "login";

export type UseCreateKernelClientPasskeyArg = {
  version: KernelVersionType;
};
export type CreateKernelClientPasskeyArgs = {
  username: string | undefined;
};

export type UseCreateKernelClientPasskeyKey = {
  username: string | undefined;
  publicClient: PublicClient | undefined | null;
  appId: string | undefined | null;
  type: PasskeConnectType | undefined | null;
  version: KernelVersionType;
};

function mutationKey({ ...config }: UseCreateKernelClientPasskeyKey) {
  const { username, publicClient, appId, type } = config;

  return [
    {
      entity: "CreateKernelClient",
      username,
      publicClient,
      appId,
      type,
    },
  ] as const;
}

async function mutationFn(config: UseCreateKernelClientPasskeyKey) {
  const { username, publicClient, appId, type, version } = config;

  if (!publicClient || !appId) {
    throw new Error("missing publicClient or appId");
  }
  let passkeyValidator: KernelValidator<EntryPoint>;
  const entryPoint = getEntryPointFromVersion(version);
  const webauthnValidator = getWeb3AuthNValidatorFromVersion(version);

  if (type === "register") {
    if (!username) {
      throw new Error("missing username");
    }
    passkeyValidator = await createPasskeyValidator(publicClient, {
      passkeyName: username,
      passkeyServerUrl: `https://passkeys.zerodev.app/api/v3/${appId}`,
      entryPoint: entryPoint,
      validatorAddress: webauthnValidator,
    });
  } else {
    passkeyValidator = await getPasskeyValidator(publicClient!, {
      passkeyServerUrl: `https://passkeys.zerodev.app/api/v3/${appId!}`,
      entryPoint: entryPoint,
      validatorAddress: webauthnValidator,
    });
  }

  const kernelAccount = await createKernelAccount(publicClient, {
    entryPoint: entryPoint,
    plugins: {
      sudo: passkeyValidator,
      entryPoint: entryPoint,
    },
  });

  return { validator: passkeyValidator, kernelAccount, entryPoint };
}

export function useCreateKernelClientPasskey({
  version,
}: UseCreateKernelClientPasskeyArg) {
  const { setValidator, setKernelAccount, setEntryPoint } = useKernelAccount();
  const { appId } = useAppId();
  const client = usePublicClient();

  const { data, mutate, ...result } = useMutation({
    mutationKey: mutationKey({
      appId: appId,
      publicClient: client,
      username: undefined,
      type: undefined,
      version,
    }),
    mutationFn,
  });

  const connectRegister = useMemo(() => {
    return ({ username }: CreateKernelClientPasskeyArgs) =>
      mutate({
        appId,
        publicClient: client,
        username,
        version,
        type: "register",
      });
  }, [appId, mutate, client, version]);

  const connectLogin = useMemo(() => {
    return () =>
      mutate({
        appId,
        publicClient: client,
        username: undefined,
        type: "login",
        version,
      });
  }, [appId, mutate, client, version]);

  useEffect(() => {
    if (data) {
      setValidator(data.validator);
      setKernelAccount(data.kernelAccount);
      setEntryPoint(data.entryPoint);
    }
  }, [data, setValidator, setKernelAccount, setEntryPoint]);

  return {
    ...result,
    data,
    mutate,
    connectRegister,
    connectLogin,
  };
}
