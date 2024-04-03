import { useKernelAccount } from "@/waas";
import { useMutation } from "@tanstack/react-query";
import { type Policy } from "@zerodev/permission-validator";
import { KernelValidator } from "@zerodev/sdk";
import { type Permission } from "@zerodev/session-key";
import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { EntryPoint } from "permissionless/types";
import { useMemo } from "react";
import { type Abi, type PublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { usePublicClient } from "wagmi";
import { useUpdateSession } from "../components/ZeroDevProvider/SessionContext";
import { createSessionKernelAccount } from "../sessions/createSessionKernelAccount";
import { createSessionKey } from "../sessions/manageSession";

export type CreateSessionWriteArgs = {
  policies?: Policy[];
  permissions?: Permission<Abi>[];
};

export type UseCreateSessionKey = {
  validator: KernelValidator<EntryPoint> | null;
  policies: CreateSessionWriteArgs;
  client: PublicClient | undefined;
  entryPoint: EntryPoint | null;
};

function mutationKey({ ...config }: UseCreateSessionKey) {
  const { policies, client, validator, entryPoint } = config;

  return [
    {
      entity: "CreateSession",
      client,
      validator,
      policies,
      entryPoint,
    },
  ] as const;
}

async function mutationFn(config: UseCreateSessionKey) {
  const { policies, validator, client, entryPoint } = config;

  if (!validator || !client || !entryPoint) {
    throw new Error("No validator provided");
  }
  if (entryPoint === ENTRYPOINT_ADDRESS_V07 && !policies.policies) {
    throw new Error("No policies provided for kernel v3");
  } else if (entryPoint === ENTRYPOINT_ADDRESS_V06 && !policies.permissions) {
    throw new Error("No permissions provided for kernel v2");
  }

  const sessionKey = createSessionKey();
  const sessionSigner = privateKeyToAccount(sessionKey);

  const kernelAccount = await createSessionKernelAccount({
    sessionSigner,
    publicClient: client,
    sudoValidator: validator,
    entryPoint: entryPoint,
    policies: policies.policies,
    permissions: policies.permissions,
  });
  return {
    sessionKey,
    ...kernelAccount,
  };
}

export function useCreateSession() {
  const { validator, entryPoint } = useKernelAccount();
  const client = usePublicClient();
  const { updateSession } = useUpdateSession();

  const { mutate, ...result } = useMutation({
    mutationKey: mutationKey({
      client,
      validator,
      policies: { policies: undefined, permissions: undefined },
      entryPoint,
    }),
    mutationFn,
    onSuccess: (data) => {
      updateSession(data);
    },
  });

  const write = useMemo(() => {
    if (!validator || !client || !entryPoint) return undefined;
    return (policies: CreateSessionWriteArgs) =>
      mutate({
        policies,
        client,
        validator,
        entryPoint,
      });
  }, [mutate, validator, client, entryPoint]);

  return {
    ...result,
    write,
  };
}
