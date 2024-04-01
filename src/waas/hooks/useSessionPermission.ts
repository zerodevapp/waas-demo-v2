import {
  QueryFunction,
  QueryFunctionContext,
  useQuery,
} from "@tanstack/react-query";
import {
  toPermissionValidator,
  type Policy,
} from "@zerodev/permission-validator";
import { toECDSASigner } from "@zerodev/permission-validator/signers";
import { KernelValidator, createKernelAccount } from "@zerodev/sdk";
import { type EntryPoint } from "permissionless/types";
import { PublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { usePublicClient } from "wagmi";
import { useKernelAccount } from "..";
import { getSession } from "../sessions/manageSession";
import { getEntryPoint } from "../utils/entryPoint";

export type SessionPermissionKey = [
  key: string,
  params: {
    validator: KernelValidator<EntryPoint> | undefined | null;
    publicClient: PublicClient | undefined | null;
    permissionId: `0x${string}` | undefined | null;
  }
];

export type fetchPermissionRes = {
  permissions?: Policy[];
  isExpired: boolean;
  enableSignature?: `0x${string}`;
};

export type useSessionPermissionRes = {
  permissions?: Policy[];
  isExpired?: boolean;
  enableSignature?: `0x${string}`;
  isLoading: boolean;
  error: any;
};

export type useSessionPermissionArgs = {
  permissionId: `0x${string}` | undefined;
};

async function fetchPermission({
  queryKey,
}: QueryFunctionContext<SessionPermissionKey>): Promise<fetchPermissionRes> {
  const [_key, { publicClient, permissionId, validator }] = queryKey;

  if (!permissionId) {
    throw new Error("sessionId are required");
  }
  const session = getSession(permissionId);

  if (!session) {
    return {
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
    signer: privateKeyToAccount(session.sessionKey),
  });

  const permissionValidator = await toPermissionValidator(publicClient!, {
    entryPoint: getEntryPoint(),
    signer: sessionSigner,
    policies: session.policies,
  });

  const isEnabled = await permissionValidator.isEnabled(
    smartAccountAddress,
    sessionSigner.account.address
  );

  return {
    permissions: session.policies,
    isExpired: !isEnabled,
    enableSignature: session.enableSignature,
  };
}

export function useSessionPermission({
  permissionId,
}: useSessionPermissionArgs): useSessionPermissionRes {
  const { validator } = useKernelAccount();
  const client = usePublicClient();

  const {
    data: sessionPermission,
    isLoading,
    error,
  } = useQuery<SessionPermissionKey>({
    queryKey: [
      "session_permission",
      { publicClient: client, validator, permissionId },
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
