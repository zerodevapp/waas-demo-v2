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
import { type EntryPoint } from "permissionless/types";
import { http, type PublicClient } from "viem";
import { usePublicClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import { getEntryPoint } from "../utils/entryPoint";

export type KernelClientKey = [
  key: string,
  params: {
    appId: string | undefined | null;
    kernelAccount: KernelSmartAccount<EntryPoint> | undefined | null;
    publicClient: PublicClient | undefined | null;
  }
];

async function getKernelClient({
  queryKey,
}: QueryFunctionContext<KernelClientKey>) {
  const [_key, { appId, publicClient, kernelAccount }] = queryKey;

  if (!appId || !publicClient || !kernelAccount) {
    throw new Error("missing appId or kernelAccount");
  }

  const kernelClient = createKernelAccountClient({
    account: kernelAccount,
    chain: sepolia,
    bundlerTransport: http(
      `https://meta-aa-provider.onrender.com/api/v3/bundler/${appId!}?paymasterProvider=PIMLICO`
    ),
    entryPoint: getEntryPoint(),
    middleware: {
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
  return { kernelClient, kernelAccount };
}

export function useKernelClient() {
  const { appId } = useAppId();
  const { kernelAccount } = useKernelAccount();
  const client = usePublicClient();

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "session_kernel_client",
      {
        publicClient: client,
        kernelAccount,
        appId,
      },
    ],
    queryFn: getKernelClient as unknown as QueryFunction<any>,
    enabled: !!client && !!kernelAccount && !!appId,
  });

  return {
    ...data,
    isLoading,
    error,
  };
}
