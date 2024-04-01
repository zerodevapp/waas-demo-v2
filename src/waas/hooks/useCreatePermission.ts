import { useSession, useValidator } from "@/waas";
import { useMutation } from "@tanstack/react-query";
import {
  toPermissionValidator,
  type Policy,
} from "@zerodev/permission-validator";
import { toECDSASigner } from "@zerodev/permission-validator/signers";
import {
  KernelV3ExecuteAbi,
  KernelValidator,
  createKernelAccount,
} from "@zerodev/sdk";
import { EntryPoint } from "permissionless/types";
import { useMemo } from "react";
import {
  getAbiItem,
  toFunctionSelector,
  zeroAddress,
  type PublicClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { usePublicClient } from "wagmi";
import { createSessionKey } from "../sessions/manageSession";
import { getEntryPoint } from "../utils/entryPoint";

export type CreatePermissionWriteArgs = Policy[] | undefined;

export type UseCreatePermissionKey = {
  validator: KernelValidator<EntryPoint> | null;
  policies: CreatePermissionWriteArgs;
  client: PublicClient | undefined;
};

export type UseCreatePermissionArgs = {
  onSuccess?: () => void;
};

function mutationKey({ ...config }: UseCreatePermissionKey) {
  const { policies, client, validator } = config;

  return [
    {
      entity: "CreatePermission",
      client,
      validator,
      policies,
    },
  ] as const;
}

async function createSessionClient(
  validator: KernelValidator<EntryPoint>,
  policies: Policy[],
  client: PublicClient
) {
  const sessionKey = createSessionKey();
  const sessionSigner = privateKeyToAccount(sessionKey);

  const ecdsaModularSigner = toECDSASigner({ signer: sessionSigner });
  const permissionValidator = await toPermissionValidator(client, {
    entryPoint: getEntryPoint(),
    signer: ecdsaModularSigner,
    policies: policies,
  });

  const permissionAccount = await createKernelAccount(client, {
    entryPoint: getEntryPoint(),
    plugins: {
      sudo: validator,
      regular: permissionValidator,
      entryPoint: getEntryPoint(),
      executorData: {
        executor: zeroAddress,
        selector: toFunctionSelector(
          getAbiItem({ abi: KernelV3ExecuteAbi, name: "execute" })
        ),
      },
    },
  });
  const smartAccount = permissionAccount.address;
  const pluginEnableSig =
    await permissionAccount.kernelPluginManager.getPluginEnableSignature(
      permissionAccount.address
    );

  const permissionId = permissionValidator.getPermissionId();

  return {
    permissionId,
    smartAccount,
    pluginEnableSig,
    policies,
    sessionKey,
  };
}

function mutationFn(config: UseCreatePermissionKey) {
  const { policies, validator, client } = config;

  if (!validator) {
    throw new Error("No validator provided");
  }
  if (!policies) {
    throw new Error("No parameters provided");
  }
  if (!client) {
    throw new Error("No client provided");
  }

  return createSessionClient(validator, policies, client);
}

export function useCreatePermission(args?: UseCreatePermissionArgs) {
  const { validator } = useValidator();
  const client = usePublicClient();
  const { setSession } = useSession();

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
      client,
      validator,
      policies: undefined,
    }),
    mutationFn,
    onSuccess: (data) => {
      setSession(
        data.permissionId,
        data.smartAccount,
        data.pluginEnableSig,
        data.policies,
        data.sessionKey
      );
      args?.onSuccess?.();
    },
  });

  const write = useMemo(() => {
    if (!validator || !client) return undefined;
    return (policies: CreatePermissionWriteArgs) =>
      mutate({
        policies,
        client,
        validator,
      });
  }, [mutate, validator, client]);

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
