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
} from "@zerodev/sdk";
import { bundlerActions } from "permissionless";
import { pimlicoBundlerActions } from "permissionless/actions/pimlico";
import { type EntryPoint } from "permissionless/types";
import {
  createClient,
  http,
  type Address,
  type Chain,
  type PublicClient,
  type Transport,
} from "viem";
import { usePublicClient } from "wagmi";
import { useZeroDevConfig } from "../components/ZeroDevProvider/ZeroDevAppContext";
import { useKernelAccount } from "../components/ZeroDevProvider/ZeroDevValidatorContext";

export type KernelClientKey = [
  key: string,
  params: {
    appId: string | undefined | null;
    chain: Chain | null;
    kernelAccount: KernelSmartAccount<EntryPoint> | undefined | null;
    kernelAccountClient:
      | KernelAccountClient<
          EntryPoint,
          Transport,
          Chain,
          KernelSmartAccount<EntryPoint>
        >
      | undefined
      | null;
    publicClient: PublicClient | undefined | null;
    entryPoint: EntryPoint | null;
  }
];

export type GetKernelClientReturnType = {
  address: Address;
  kernelAccount: KernelSmartAccount<EntryPoint>;
  kernelClient: KernelAccountClient<
    EntryPoint,
    Transport,
    Chain,
    KernelSmartAccount<EntryPoint>
  >;
};

export type UseKernelClientReturnType = {
  address: Address | undefined;
  kernelAccount: KernelSmartAccount<EntryPoint> | undefined;
  kernelClient:
    | KernelAccountClient<
        EntryPoint,
        Transport,
        Chain,
        KernelSmartAccount<EntryPoint>
      >
    | undefined;
  isConnected: boolean;
  isLoading: boolean;
  error: unknown;
} & UseQueryResult<GetKernelClientReturnType, unknown>;

async function getKernelClient({
  queryKey,
}: QueryFunctionContext<KernelClientKey>): Promise<GetKernelClientReturnType> {
  const [
    _key,
    {
      appId,
      publicClient,
      kernelAccount,
      entryPoint,
      chain,
      kernelAccountClient,
    },
  ] = queryKey;

  if (kernelAccountClient) {
    return {
      kernelClient: kernelAccountClient,
      kernelAccount: kernelAccountClient.account,
      address: kernelAccountClient.account.address,
    };
  }

  if (!appId || !chain || !publicClient || !kernelAccount || !entryPoint) {
    throw new Error("missing appId or kernelAccount");
  }

  const kernelClient = createKernelAccountClient({
    account: kernelAccount,
    chain: chain,
    bundlerTransport: http(
      `https://meta-aa-provider.onrender.com/api/v3/bundler/${appId!}?paymasterProvider=PIMLICO`
    ),
    entryPoint: entryPoint,
    middleware: {
      gasPrice: async () => {
        const client = createClient({
          chain: chain,
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
          chain: chain,
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
  }) as KernelAccountClient<
    EntryPoint,
    Transport,
    Chain,
    KernelSmartAccount<EntryPoint>
  >;
  return { kernelClient, kernelAccount, address: kernelAccount.address };
}

export function useKernelClient(): UseKernelClientReturnType {
  const { appId, chain } = useZeroDevConfig();
  const { kernelAccount, entryPoint, kernelAccountClient } = useKernelAccount();
  const client = usePublicClient();

  const { data, ...result } = useQuery({
    queryKey: [
      "session_kernel_client",
      {
        publicClient: client,
        kernelAccount,
        appId,
        entryPoint,
        chain,
        kernelAccountClient,
      },
    ],
    queryFn: getKernelClient as unknown as QueryFunction<any>,
    enabled: !!client && !!appId && !!entryPoint && !!chain,
  });

  return {
    ...data,
    isConnected: !!data?.kernelClient,
    ...result,
  };
}
