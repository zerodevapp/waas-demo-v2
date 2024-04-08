import { useZeroDevConfig } from "@/waas/components/ZeroDevProvider/ZeroDevAppContext";
import { useSetKernelClient } from "@/waas/hooks/useSetKernelClient";
import { Button } from "@mantine/core";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import {
  KernelV3ExecuteAbi,
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
  type KernelAccountClient,
} from "@zerodev/sdk";
import { ENTRYPOINT_ADDRESS_V07, bundlerActions } from "permissionless";
import { pimlicoBundlerActions } from "permissionless/actions/pimlico";
import { EntryPoint } from "permissionless/types";
import { useState } from "react";
import {
  createClient,
  getAbiItem,
  http,
  toFunctionSelector,
  zeroAddress,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { usePublicClient } from "wagmi";

export default function CreateCustomizedKernelButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { chain, appId } = useZeroDevConfig();
  const publicClient = usePublicClient();
  const { setKernelClient } = useSetKernelClient();

  const createKernelClient = async () => {
    if (!publicClient || !chain || !appId) return;
    setIsLoading(true);

    try {
      const entryPoint = ENTRYPOINT_ADDRESS_V07;
      const generatedAccount = privateKeyToAccount(generatePrivateKey());
      const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
        entryPoint: entryPoint,
        signer: generatedAccount,
      });

      const kernelAccount = await createKernelAccount(publicClient, {
        entryPoint: entryPoint,
        plugins: {
          sudo: ecdsaValidator,
          entryPoint: entryPoint,
          action: {
            address: zeroAddress,
            selector: toFunctionSelector(
              getAbiItem({ abi: KernelV3ExecuteAbi, name: "execute" })
            ),
          },
        },
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

      setKernelClient(kernelClient as KernelAccountClient<EntryPoint>);
    } catch (err) {}

    setIsLoading(false);
  };

  return (
    <Button
      disabled={isLoading || !publicClient || !appId}
      loading={isLoading}
      variant="outline"
      onClick={createKernelClient}
    >
      Generate Private key
    </Button>
  );
}
