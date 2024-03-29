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
import { getEntryPoint } from "../utils/entryPoint";
import { getPermissionId } from "../utils/mock/getPermissionId";
import { useAppId } from "./useAppId";
import { getSessionKey } from "./useSessionPermission";
import { useValidator } from "./useValidator";

export type UseSessionKernelClientArgs = {
  policies: Policy[] | undefined;
};

export type SessionKernelClientKey = [
  key: string,
  params: {
    appId: string | undefined | null;
    validator: KernelValidator<EntryPoint> | undefined | null;
    publicClient: PublicClient | undefined | null;
    policies: Policy[] | undefined | null;
    enableSignature: `0x${string}` | undefined;
  }
];

async function getSessionKernelClient({
  queryKey,
}: QueryFunctionContext<SessionKernelClientKey>) {
  const [_key, { appId, publicClient, policies, validator, enableSignature }] =
    queryKey;

  if (!policies || !appId) {
    throw new Error("policies and appId are required");
  }
  const permissionId = getPermissionId(policies);
  const sessionKey = getSessionKey(permissionId);

  if (!sessionKey) {
    throw new Error("sessionKey not found");
  }

  const sessionSigner = privateKeyToAccount(sessionKey);
  const ecdsaModularSigner = toECDSASigner({ signer: sessionSigner });
  const permissionValidator = await toPermissionValidator(publicClient!, {
    entryPoint: getEntryPoint(),
    signer: ecdsaModularSigner,
    policies: policies,
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
  policies,
}: UseSessionKernelClientArgs) {
  const { appId } = useAppId();
  const client = usePublicClient();
  const { validator, enableSignature: signature } = useValidator();
  const policiesKey = JSON.stringify(policies?.map((p) => p.getPolicyData()));

  const enableSignature = signature[getPermissionId(policies)];

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "session_kernel_client",
      {
        publicClient: client,
        policies,
        validator,
        policiesKey,
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
