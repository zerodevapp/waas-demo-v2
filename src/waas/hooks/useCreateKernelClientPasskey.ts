import { useMutation } from "@tanstack/react-query";
import {
  WEBAUTHN_VALIDATOR_ADDRESS_V07,
  createPasskeyValidator,
  getPasskeyValidator,
} from "@zerodev/passkey-validator";
import { createKernelAccount, type KernelValidator } from "@zerodev/sdk";
import type { EntryPoint } from "permissionless/types";
import { useEffect, useMemo } from "react";
import { type PublicClient } from "viem";
import { usePublicClient } from "wagmi";
import { getEntryPoint } from "../utils/entryPoint";
import { useAppId } from "./useAppId";
import { useKernelAccount } from "./useKernelAccount";

type PasskeConnectType = "register" | "login";

export type CreateKernelClientPasskeyArgs = {
  username: string | undefined;
};

export type UseCreateKernelClientPasskeyKey = {
  username: string | undefined;
  publicClient: PublicClient | undefined | null;
  appId: string | undefined | null;
  type: PasskeConnectType | undefined | null;
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
  const { username, publicClient, appId, type } = config;

  if (!publicClient || !appId) {
    throw new Error("missing publicClient or appId");
  }
  let passkeyValidator: KernelValidator<EntryPoint>;

  if (type === "register") {
    if (!username) {
      throw new Error("missing username");
    }
    passkeyValidator = await createPasskeyValidator(publicClient, {
      passkeyName: username,
      passkeyServerUrl: `https://passkeys.zerodev.app/api/v3/${appId}`,
      entryPoint: getEntryPoint(),
      validatorAddress: WEBAUTHN_VALIDATOR_ADDRESS_V07,
    });
  } else {
    passkeyValidator = await getPasskeyValidator(publicClient!, {
      passkeyServerUrl: `https://passkeys.zerodev.app/api/v3/${appId!}`,
      entryPoint: getEntryPoint(),
      validatorAddress: WEBAUTHN_VALIDATOR_ADDRESS_V07,
    });
  }

  const account = await createKernelAccount(publicClient, {
    entryPoint: getEntryPoint(),
    plugins: {
      sudo: passkeyValidator,
      entryPoint: getEntryPoint(),
    },
  });

  return { validator: passkeyValidator, kernelAccount: account };
}

export function useCreateKernelClientPasskey() {
  const { setValidator, setKernelAccount } = useKernelAccount();
  const { appId } = useAppId();
  const client = usePublicClient();

  const { data, mutate, ...result } = useMutation({
    mutationKey: mutationKey({
      appId: appId,
      publicClient: client,
      username: undefined,
      type: undefined,
    }),
    mutationFn,
  });

  const connectRegister = useMemo(() => {
    return ({ username }: CreateKernelClientPasskeyArgs) =>
      mutate({
        appId,
        publicClient: client,
        username,
        type: "register",
      });
  }, [appId, mutate, client]);

  const connectLogin = useMemo(() => {
    return () =>
      mutate({
        appId,
        publicClient: client,
        username: undefined,
        type: "login",
      });
  }, [appId, mutate, client]);

  useEffect(() => {
    if (data) {
      setValidator(data.validator);
      setKernelAccount(data.kernelAccount);
    }
  }, [data, setValidator, setKernelAccount]);

  return {
    ...result,
    data,
    mutate,
    connectRegister,
    connectLogin,
  };
}
