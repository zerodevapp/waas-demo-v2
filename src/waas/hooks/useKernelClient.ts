import { useAppId, useKernelAccount } from "@/waas";
import {
  QueryFunction,
  QueryFunctionContext,
  useQuery,
} from "@tanstack/react-query";
import {
  KernelSmartAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
} from "@zerodev/sdk";
import { bundlerActions } from "permissionless";
import { pimlicoBundlerActions } from "permissionless/actions/pimlico";
import { type EntryPoint } from "permissionless/types";
import { createClient, http, type PublicClient } from "viem";
import { usePublicClient } from "wagmi";
import { sepolia } from "wagmi/chains";

export type KernelClientKey = [
  key: string,
  params: {
    appId: string | undefined | null;
    kernelAccount: KernelSmartAccount<EntryPoint> | undefined | null;
    publicClient: PublicClient | undefined | null;
    entryPoint: EntryPoint | null;
  }
];

async function getKernelClient({
  queryKey,
}: QueryFunctionContext<KernelClientKey>) {
  const [_key, { appId, publicClient, kernelAccount, entryPoint }] = queryKey;

  if (!appId || !publicClient || !kernelAccount || !entryPoint) {
    throw new Error("missing appId or kernelAccount");
  }

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

export function useKernelClient() {
  const { appId } = useAppId();
  const { kernelAccount, entryPoint } = useKernelAccount();
  const client = usePublicClient();

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "session_kernel_client",
      {
        publicClient: client,
        kernelAccount,
        appId,
        entryPoint,
      },
    ],
    queryFn: getKernelClient as unknown as QueryFunction<any>,
    enabled: !!client && !!kernelAccount && !!appId && !!entryPoint,
  });

  return {
    ...data,
    isLoading,
    error,
  };
}
