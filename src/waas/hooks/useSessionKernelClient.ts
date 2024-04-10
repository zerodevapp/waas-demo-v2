import {
  QueryFunction,
  QueryFunctionContext,
  UseQueryResult,
  useQuery,
} from "@tanstack/react-query";
import {
  KernelAccountClient,
  KernelSmartAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
  type KernelValidator,
} from "@zerodev/sdk";
import { bundlerActions } from "permissionless";
import { pimlicoBundlerActions } from "permissionless/actions/pimlico";
import { type EntryPoint } from "permissionless/types";
import { createClient, http, type Chain, type PublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { usePublicClient } from "wagmi";
import { useZeroDevConfig } from "../components/ZeroDevProvider/ZeroDevAppContext";
import { useKernelAccount } from "../components/ZeroDevProvider/ZeroDevValidatorContext";
import { type SessionType } from "../types";
import { getSessionKernelAccount } from "../utils/sessions/getSessionKernelAccount";
import { useSessions } from "./useSessions";

export type UseSessionKernelClientParameters = {
  sessionId?: `0x${string}` | null | undefined;
};

export type SessionKernelClientKey = [
  key: string,
  params: {
    appId: string | undefined | null;
    chain: Chain | null;
    validator: KernelValidator<EntryPoint> | undefined | null;
    kernelAddress: string | undefined | null;
    publicClient: PublicClient | undefined | null;
    sessionId: `0x${string}` | null | undefined;
    session: SessionType | undefined;
    entryPoint: EntryPoint | null;
  }
];

export type GetSessionKernelClientReturnType = {
  kernelClient: KernelAccountClient<EntryPoint>;
  kernelAccount: KernelSmartAccount<EntryPoint>;
};

export type UseSessionKernelClientReturnType = {
  kernelClient: KernelAccountClient<EntryPoint>;
  kernelAccount: KernelSmartAccount<EntryPoint>;
  isLoading: boolean;
  error: unknown;
} & UseQueryResult<GetSessionKernelClientReturnType, unknown>;

async function getSessionKernelClient({
  queryKey,
}: QueryFunctionContext<SessionKernelClientKey>) {
  const [
    _key,
    {
      appId,
      chain,
      publicClient,
      sessionId,
      validator,
      session,
      kernelAddress,
      entryPoint,
    },
  ] = queryKey;

  if (!appId || !chain) {
    throw new Error("appId and chain are required");
  }
  if (!entryPoint) {
    throw new Error("entryPoint is required");
  }
  if (!publicClient) {
    throw new Error("publicClient is required");
  }

  // get session from sessionId
  if (!session) {
    throw new Error("session not found");
  }
  const accountSession = Object.values(session).filter(
    (s) => s.smartAccount === kernelAddress
  );
  if (accountSession.length === 0) {
    throw new Error("No available session for this account");
  }
  if (accountSession.length > 1 && !sessionId) {
    throw new Error("sessionId is required");
  }
  const selectedSession = sessionId ? session[sessionId] : accountSession[0];

  // create kernelAccountClient
  const sessionSigner = privateKeyToAccount(selectedSession.sessionKey);
  const { kernelAccount } = await getSessionKernelAccount({
    sessionSigner,
    publicClient,
    sudoValidator: validator!,
    entryPoint: entryPoint,
    policies: selectedSession.policies,
    permissions: selectedSession.permissions,
    enableSignature: selectedSession.enableSignature,
  });
  const kernelClient = createKernelAccountClient({
    account: kernelAccount,
    chain: chain,
    bundlerTransport: http(
      `https://meta-aa-provider.onrender.com/api/v3/bundler/${appId}?paymasterProvider=PIMLICO`
    ),
    entryPoint: entryPoint,
    middleware: {
      gasPrice: async () => {
        const client = createClient({
          chain: chain,
          transport: http(
            `https://meta-aa-provider.onrender.com/api/v3/bundler/${appId}?paymasterProvider=PIMLICO`
          ),
        })
          .extend(bundlerActions(entryPoint))
          .extend(pimlicoBundlerActions(entryPoint));
        return (await client.getUserOperationGasPrice()).fast;
      },
      sponsorUserOperation: async ({ userOperation }) => {
        const kernelPaymaster = createZeroDevPaymasterClient({
          entryPoint: entryPoint,
          chain: chain,
          transport: http(
            `https://meta-aa-provider.onrender.com/api/v2/paymaster/${appId}?paymasterProvider=PIMLICO`
          ),
        });
        return kernelPaymaster.sponsorUserOperation({
          userOperation,
          entryPoint: entryPoint,
        });
      },
    },
  });

  return { kernelClient, kernelAccount };
}

export function useSessionKernelClient({
  sessionId,
}: UseSessionKernelClientParameters = {}): UseSessionKernelClientReturnType {
  const { appId, chain } = useZeroDevConfig();
  const client = usePublicClient();
  const { validator, kernelAccount, entryPoint } = useKernelAccount();
  const session = useSessions();
  const kernelAddress = kernelAccount?.address;

  const { data, ...result } = useQuery({
    queryKey: [
      "session_kernel_client",
      {
        publicClient: client,
        kernelAddress,
        sessionId: sessionId,
        validator,
        session,
        appId,
        chain,
        entryPoint,
      },
    ],
    queryFn: getSessionKernelClient as unknown as QueryFunction<any>,
    enabled:
      !!client &&
      !!validator &&
      !!appId &&
      !!kernelAddress &&
      !!entryPoint &&
      !!chain,
  });

  return {
    ...data,
    ...result,
  };
}
