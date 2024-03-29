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
import { KernelValidator, createKernelAccount } from "@zerodev/sdk";
import { type EntryPoint } from "permissionless/types";
import { PublicClient, type Address } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { usePublicClient } from "wagmi";
import { useValidator } from "..";
import { getEntryPoint } from "../utils/entryPoint";
import { getPermissionId } from "../utils/mock/getPermissionId";

type SessionKeys = {
  [permissionId: string]: `0x${string}`;
};

export type SessionPermissionKey = [
  key: string,
  params: {
    validator: KernelValidator<EntryPoint> | undefined | null;
    publicClient: PublicClient | undefined | null;
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

export function getSessionKey(
  permissionId: `0x${string}`
): `0x${string}` | null {
  const sessionKey = localStorage.getItem(`kernel_session_key`);
  if (!sessionKey) return null;

  try {
    const parsedKey = JSON.parse(sessionKey);
    const key = parsedKey[permissionId];
    return key ? (key as `0x${string}`) : null;
  } catch (error) {
    return null;
  }
}

export function setSessionKey(
  permissionId: `0x${string}`,
  sessionKey: `0x${string}`
) {
  let sessionKeys: SessionKeys = {};
  try {
    sessionKeys = JSON.parse(
      localStorage.getItem(`kernel_session_key`) || "{}"
    );
  } catch (err) {}

  sessionKeys[permissionId] = sessionKey;
  localStorage.setItem(`kernel_session_key`, JSON.stringify(sessionKeys));
}

export function createSessionKey() {
  const sessionKey = generatePrivateKey();
  return sessionKey;
}

async function fetchPermission({
  queryKey,
}: QueryFunctionContext<SessionPermissionKey>): Promise<fetchPermissionRes> {
  const [_key, { publicClient, policies, validator }] = queryKey;

  if (!policies) {
    throw new Error("policies are required");
  }

  const permissionId = getPermissionId(policies);
  const sessionKey = getSessionKey(permissionId);

  if (!sessionKey) {
    return {
      permissions: policies,
      isExpired: true,
    };
  }

  const account = await createKernelAccount(publicClient!, {
    entryPoint: getEntryPoint(),
    plugins: {
      sudo: validator!,
      entryPoint: getEntryPoint(),
    },
  });
  const smartAccountAddress = account.address;

  const sessionSigner = toECDSASigner({
    signer: privateKeyToAccount(sessionKey),
  });

  const permissionValidator = await toPermissionValidator(publicClient!, {
    entryPoint: getEntryPoint(),
    signer: sessionSigner,
    policies: policies,
  });

  const isEnabled = await permissionValidator.isEnabled(
    smartAccountAddress,
    sessionSigner.account.address
  );

  return {
    permissions: policies,
    isExpired: !isEnabled,
    validator: permissionValidator,
  };
}

export function useSessionPermission({
  policies,
}: useSessionPermissionArgs): useSessionPermissionRes {
  const { validator } = useValidator();
  const client = usePublicClient();
  const policiesKey = JSON.stringify(policies?.map((p) => p.getPolicyData()));

  const {
    data: sessionPermission,
    isLoading,
    error,
  } = useQuery<SessionPermissionKey>({
    queryKey: [
      "session_permission",
      { publicClient: client, policies, validator, policiesKey },
    ],
    queryFn: fetchPermission as unknown as QueryFunction<
      SessionPermissionKey,
      any,
      any
    >,
    enabled: !!client && !!validator,
  });

  return {
    ...sessionPermission,
    isLoading,
    error,
  };
}
