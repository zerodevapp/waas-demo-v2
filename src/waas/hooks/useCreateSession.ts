import { useKernelAccount } from "@/waas";
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
import { useUpdateSession } from "../components/ZeroDevProvider/SessionContext";
import { createSessionKey } from "../sessions/manageSession";
import { getEntryPoint } from "../utils/entryPoint";

export type CreateSessionWriteArgs = Policy[] | undefined;

export type UseCreateSessionKey = {
  validator: KernelValidator<EntryPoint> | null;
  policies: CreateSessionWriteArgs;
  client: PublicClient | undefined;
};

export type UseCreateSessionArgs = {
  onSuccess?: () => void;
};

function mutationKey({ ...config }: UseCreateSessionKey) {
  const { policies, client, validator } = config;

  return [
    {
      entity: "CreateSession",
      client,
      validator,
      policies,
    },
  ] as const;
}

async function mutationFn(config: UseCreateSessionKey) {
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
  const enableSignature =
    await permissionAccount.kernelPluginManager.getPluginEnableSignature(
      permissionAccount.address
    );

  const sessionId = permissionValidator.getPermissionId();

  return {
    sessionId,
    smartAccount,
    enableSignature,
    policies,
    sessionKey,
  };
}

export function useCreateSession(args?: UseCreateSessionArgs) {
  const { validator } = useKernelAccount();
  const client = usePublicClient();
  const { updateSession } = useUpdateSession();

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
      updateSession(data);
      args?.onSuccess?.();
    },
  });

  const write = useMemo(() => {
    if (!validator || !client) return undefined;
    return (policies: CreateSessionWriteArgs) =>
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
