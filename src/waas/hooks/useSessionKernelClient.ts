import {
  QueryFunction,
  QueryFunctionContext,
  useQuery,
} from "@tanstack/react-query";
import {
  createKernelAccountClient,
  createZeroDevPaymasterClient,
  type KernelValidator,
} from "@zerodev/sdk";
import { bundlerActions } from "permissionless";
import { pimlicoBundlerActions } from "permissionless/actions/pimlico";
import { type EntryPoint } from "permissionless/types";
import { createClient, http, type PublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { usePublicClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import { getSessionKernelAccount } from "../sessions/getSessionKernelAccount";
import { type SessionType } from "../sessions/manageSession";
import { useAppId } from "./useAppId";
import { useKernelAccount } from "./useKernelAccount";
import { useSessions } from "./useSessions";

export type UseSessionKernelClientArgs = {
  sessionId: `0x${string}` | null | undefined;
};

export type SessionKernelClientKey = [
  key: string,
  params: {
    appId: string | undefined | null;
    validator: KernelValidator<EntryPoint> | undefined | null;
    kernelAddress: string | undefined | null;
    publicClient: PublicClient | undefined | null;
    sessionId: `0x${string}` | null | undefined;
    session: SessionType | undefined;
    entryPoint: EntryPoint | null;
  }
];

async function getSessionKernelClient({
  queryKey,
}: QueryFunctionContext<SessionKernelClientKey>) {
  const [
    _key,
    {
      appId,
      publicClient,
      sessionId,
      validator,
      session,
      kernelAddress,
      entryPoint,
    },
  ] = queryKey;

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
    chain: sepolia,
    bundlerTransport: http(
      `https://meta-aa-provider.onrender.com/api/v3/bundler/${appId!}?paymasterProvider=PIMLICO`
    ),
    entryPoint: entryPoint,
    middleware: {
      gasPrice: async () => {
        const client = createClient({
          chain: sepolia,
          transport: http(
            `https://meta-aa-provider.onrender.com/api/v3/bundler/${appId!}?paymasterProvider=PIMLICO`
          ),
        })
          .extend(bundlerActions(entryPoint))
          .extend(pimlicoBundlerActions(entryPoint));
        return (await client.getUserOperationGasPrice()).fast;
      },
      sponsorUserOperation: async ({ userOperation }) => {
        const kernelPaymaster = createZeroDevPaymasterClient({
          entryPoint: entryPoint,
          chain: sepolia,
          transport: http(
            `https://meta-aa-provider.onrender.com/api/v2/paymaster/${appId!}?paymasterProvider=PIMLICO`
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
}: UseSessionKernelClientArgs) {
  const { appId } = useAppId();
  const client = usePublicClient();
  const { validator, kernelAccount, entryPoint } = useKernelAccount();
  const session = useSessions();
  const kernelAddress = kernelAccount?.address;

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "session_kernel_client",
      {
        publicClient: client,
        kernelAddress,
        sessionId,
        validator,
        session,
        appId,
        entryPoint,
      },
    ],
    queryFn: getSessionKernelClient as unknown as QueryFunction<any>,
    enabled:
      !!client && !!validator && !!appId && !!kernelAddress && !!entryPoint,
  });

  return {
    ...data,
    isLoading,
    error,
  };
}
