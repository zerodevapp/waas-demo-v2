import {
  QueryFunction,
  QueryFunctionContext,
  useQuery,
} from "@tanstack/react-query";
import { toPermissionValidator } from "@zerodev/permission-validator";
import { toECDSASigner } from "@zerodev/permission-validator/signers";
import {
  KernelV3ExecuteAbi,
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
  type KernelValidator,
} from "@zerodev/sdk";
import { bundlerActions } from "permissionless";
import { pimlicoBundlerActions } from "permissionless/actions/pimlico";
import { type EntryPoint } from "permissionless/types";
import {
  createClient,
  getAbiItem,
  http,
  toFunctionSelector,
  zeroAddress,
  type PublicClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { usePublicClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import { type SessionType } from "../sessions/manageSession";
import { getEntryPoint } from "../utils/entryPoint";
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
  }
];

async function getSessionKernelClient({
  queryKey,
}: QueryFunctionContext<SessionKernelClientKey>) {
  const [
    _key,
    { appId, publicClient, sessionId, validator, session, kernelAddress },
  ] = queryKey;

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
  const ecdsaModularSigner = toECDSASigner({ signer: sessionSigner });
  const permissionValidator = await toPermissionValidator(publicClient!, {
    entryPoint: getEntryPoint(),
    signer: ecdsaModularSigner,
    policies: selectedSession.policies,
  });
  const permissionAccount = await createKernelAccount(publicClient!, {
    entryPoint: getEntryPoint(),
    plugins: {
      sudo: validator!,
      regular: permissionValidator,
      entryPoint: getEntryPoint(),
      executorData: {
        executor: zeroAddress,
        selector: toFunctionSelector(
          getAbiItem({ abi: KernelV3ExecuteAbi, name: "execute" })
        ),
      },
      pluginEnableSignature: selectedSession.enableSignature,
    },
  });
  const kernelClient = createKernelAccountClient({
    account: permissionAccount,
    chain: sepolia,
    bundlerTransport: http(
      `https://meta-aa-provider.onrender.com/api/v3/bundler/${appId!}?paymasterProvider=PIMLICO`
    ),
    entryPoint: getEntryPoint(),
    middleware: {
      gasPrice: async () => {
        const client = createClient({
          chain: sepolia,
          transport: http(
            `https://meta-aa-provider.onrender.com/api/v3/bundler/${appId!}?paymasterProvider=PIMLICO`
          ),
        })
          .extend(bundlerActions(getEntryPoint()))
          .extend(pimlicoBundlerActions(getEntryPoint()));
        return (await client.getUserOperationGasPrice()).fast;
      },
      sponsorUserOperation: async ({ userOperation }) => {
        const kernelPaymaster = createZeroDevPaymasterClient({
          entryPoint: getEntryPoint(),
          chain: sepolia,
          transport: http(
            `https://meta-aa-provider.onrender.com/api/v2/paymaster/${appId!}?paymasterProvider=PIMLICO`
          ),
        });
        return kernelPaymaster.sponsorUserOperation({
          userOperation,
          entryPoint: getEntryPoint(),
        });
      },
    },
  });
  return { kernelClient, kernelAccount: permissionAccount };
}

export function useSessionKernelClient({
  sessionId,
}: UseSessionKernelClientArgs) {
  const { appId } = useAppId();
  const client = usePublicClient();
  const { validator, kernelAccount } = useKernelAccount();
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
      },
    ],
    queryFn: getSessionKernelClient as unknown as QueryFunction<any>,
    enabled: !!client && !!validator && !!appId && !!kernelAddress,
  });

  return {
    ...data,
    isLoading,
    error,
  };
}
