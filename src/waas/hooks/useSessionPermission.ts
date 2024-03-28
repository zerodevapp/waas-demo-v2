import {
  QueryFunction,
  QueryFunctionContext,
  useQuery,
} from "@tanstack/react-query";
import {
  toPermissionValidator,
  type PermissionPlugin,
  type Policy,
  type PolicyFlags,
} from "@zerodev/permission-validator";
import { toECDSASigner } from "@zerodev/permission-validator/signers";
import { createKernelAccount } from "@zerodev/sdk";
import { type EntryPoint } from "permissionless/types";
import { useEffect, useState } from "react";
import { PublicClient, type Address } from "viem";
import {
  generatePrivateKey,
  privateKeyToAccount,
  privateKeyToAddress,
} from "viem/accounts";
import { usePublicClient } from "wagmi";
import { useValidator } from "..";
import { getEntryPoint } from "../utils/entryPoint";
import { useAppId } from "./useAppId";

export type SessionPermissionKey = [
  key: string,
  params: {
    address: Address | undefined | null;
    appId: string | undefined | null;
    client: PublicClient | undefined | null;
    policies: Policy[] | undefined | null;
  }
];

export type SessionPermission = {
  signer: Address;
  policies: Policy[];
  entryPoint: EntryPoint;
  flag?: PolicyFlags;
};

export type fetchPermissionRes = {
  permissions?: Policy[];
  isExpired: boolean;
  validator?: PermissionPlugin<EntryPoint>;
};

export type useSessionPermissionRes = {
  permissions?: Policy[];
  validator?: PermissionPlugin<EntryPoint>;
  isExpired?: boolean;
  isLoading: boolean;
  error: any;
};

export type useSessionPermissionArgs = {
  policies: Policy[] | undefined;
};

export function getSessionKey(): `0x${string}` | null {
  const sessionKey = localStorage.getItem("kernel_session_key");
  if (sessionKey && sessionKey.startsWith("0x")) {
    return sessionKey as `0x${string}`;
  } else {
    return null;
  }
}

export function setSessionKey(sessionKey: `0x${string}` | null) {
  if (!sessionKey) localStorage.removeItem("kernel_session_key");
  else localStorage.setItem("kernel_session_key", sessionKey);
}

export function createSessionKey() {
  const sessionKey = generatePrivateKey();
  setSessionKey(sessionKey);
  return sessionKey;
}

async function getSessionValidator({
  smartAccountAddress,
  permissions,
  sessionKey,
  client,
}: {
  smartAccountAddress: Address;
  permissions: SessionPermission;
  sessionKey: `0x${string}` | null;
  client: PublicClient;
}) {
  const isKeyExpired =
    !sessionKey || privateKeyToAddress(sessionKey) !== permissions?.signer;

  if (isKeyExpired)
    return {
      permissions: permissions.policies,
      isExpired: isKeyExpired,
    };
  const sessionSigner = toECDSASigner({
    signer: privateKeyToAccount(sessionKey),
  });

  const permissionValidator = await toPermissionValidator(client, {
    entryPoint: getEntryPoint(),
    signer: sessionSigner,
    policies: permissions.policies,
  });

  const isEnabled = await permissionValidator.isEnabled(
    smartAccountAddress,
    sessionSigner.account.address
  );

  return {
    permissions: permissions.policies,
    isExpired: !isEnabled,
    validator: permissionValidator,
  };
}

async function fetchPermission({
  queryKey,
}: QueryFunctionContext<SessionPermissionKey>): Promise<fetchPermissionRes> {
  const [_key, { appId, address, client, policies }] = queryKey;

  const sessionKey = getSessionKey();

  if (!client || !address) {
    throw new Error("client & address are required");
  }

  // mock permission
  const signerAddress = sessionKey
    ? privateKeyToAddress(sessionKey)
    : createSessionKey();

  const permissions = {
    entryPoint: getEntryPoint(),
    signer: signerAddress,
    policies: policies!,
  };

  if (!permissions) {
    return {
      permissions: permissions,
      isExpired: false,
    };
  }
  return getSessionValidator({
    smartAccountAddress: address,
    permissions: permissions,
    sessionKey: sessionKey,
    client: client,
  });
}

export function useSessionPermission({
  policies,
}: useSessionPermissionArgs): useSessionPermissionRes {
  const { appId } = useAppId();
  const { validator } = useValidator();
  const [address, setAddress] = useState<string | undefined>();
  const client = usePublicClient();

  useEffect(() => {
    const getAddress = async () => {
      if (!validator || !client) return;
      const account = await createKernelAccount(client, {
        entryPoint: getEntryPoint(),
        plugins: {
          sudo: validator,
          entryPoint: getEntryPoint(),
        },
      });
      const smartAccountAddress = account.address;
      setAddress(smartAccountAddress);
    };
    getAddress();
  }, [validator, client]);

  const {
    data: sessionPermission,
    isLoading,
    error,
  } = useQuery<SessionPermissionKey>({
    queryKey: ["session_permission", { appId, address, client, policies }],
    queryFn: fetchPermission as unknown as QueryFunction<
      SessionPermissionKey,
      any,
      any
    >,
    enabled: !!appId && !!address && !!client && !!policies,
  });

  return {
    ...sessionPermission,
    isLoading,
    error,
  };
}
