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
import { type EntryPoint } from "permissionless/types";
import {
  getAbiItem,
  http,
  toFunctionSelector,
  zeroAddress,
  type PublicClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { usePublicClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import { getSession } from "../sessions/manageSession";
import { getEntryPoint } from "../utils/entryPoint";
import { useAppId } from "./useAppId";
import { useValidator } from "./useValidator";

export type UseSessionKernelClientArgs = {
  permissionId: `0x${string}` | null | undefined;
};

export type SessionKernelClientKey = [
  key: string,
  params: {
    appId: string | undefined | null;
    validator: KernelValidator<EntryPoint> | undefined | null;
    publicClient: PublicClient | undefined | null;
    permissionId: `0x${string}` | null | undefined;
    enableSignature: `0x${string}` | undefined;
  }
];

async function getSessionKernelClient({
  queryKey,
}: QueryFunctionContext<SessionKernelClientKey>) {
  const [
    _key,
    { appId, publicClient, permissionId, validator, enableSignature },
  ] = queryKey;

  if (!appId) {
    throw new Error("policies and appId are required");
  }
  if (!permissionId) {
    throw new Error("permissionId is required");
  }
  const session = getSession(permissionId);

  if (!session) {
    throw new Error("sessionKey not found");
  }

  const sessionSigner = privateKeyToAccount(session.sessionKey);
  const ecdsaModularSigner = toECDSASigner({ signer: sessionSigner });
  const permissionValidator = await toPermissionValidator(publicClient!, {
    entryPoint: getEntryPoint(),
    signer: ecdsaModularSigner,
    policies: session.policies,
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
      pluginEnableSignature: enableSignature,
    },
  });
  const kernelClient = createKernelAccountClient({
    account: permissionAccount,
    chain: sepolia,
    bundlerTransport: http(
      `https://meta-aa-provider.onrender.com/api/v3/bundler/${appId}?paymasterProvider=PIMLICO`
    ),
    entryPoint: getEntryPoint(),
    middleware: {
      sponsorUserOperation: async ({ userOperation }) => {
        const kernelPaymaster = createZeroDevPaymasterClient({
          entryPoint: getEntryPoint(),
          chain: sepolia,
          transport: http(
            `https://meta-aa-provider.onrender.com/api/v2/paymaster/${appId}?paymasterProvider=PIMLICO`
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
  permissionId,
}: UseSessionKernelClientArgs) {
  const { appId } = useAppId();
  const client = usePublicClient();
  const { validator } = useValidator();
  const enableSignature = permissionId
    ? getSession(permissionId)?.enableSignature
    : null;

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "session_kernel_client",
      {
        publicClient: client,
        permissionId,
        validator,
        enableSignature,
        appId,
      },
    ],
    queryFn: getSessionKernelClient as unknown as QueryFunction<any>,
    enabled: !!client && !!validator && !!appId,
  });

  return {
    ...data,
    isLoading,
    error,
  };
}
