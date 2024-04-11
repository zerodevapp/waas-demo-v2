import { useZeroDevConfig } from "@/waas/components/ZeroDevProvider/ZeroDevAppContext";
import { useSetKernelClient } from "@/waas/hooks/useSetKernelClient";
import { ZERODEV_BUNDLER_URL, ZERODEV_PAYMASTER_URL } from "@/waas/utils/constants";
import { Button } from "@mantine/core";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import {
  KernelSmartAccount,
  KernelV3ExecuteAbi,
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
  type KernelAccountClient,
} from "@zerodev/sdk";
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { EntryPoint } from "permissionless/types";
import { useState } from "react";
import {
  Transport,
  getAbiItem,
  http,
  toFunctionSelector,
  zeroAddress
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
      const entryPoint = ENTRYPOINT_ADDRESS_V07 as EntryPoint;
      const generatedAccount = privateKeyToAccount(generatePrivateKey());
      const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
        entryPoint: entryPoint,
        signer: generatedAccount,
      });

      const kernelAccount = await createKernelAccount(publicClient, {
        entryPoint: entryPoint,
        plugins: {
          sudo: ecdsaValidator,
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
          `${ZERODEV_BUNDLER_URL}/${appId}`
        ),
        entryPoint: entryPoint,
        middleware: {
          sponsorUserOperation: async ({ userOperation }) => {
            const kernelPaymaster = createZeroDevPaymasterClient({
              entryPoint: entryPoint,
              chain: chain,
              transport: http(
                `${ZERODEV_PAYMASTER_URL}/${appId}`
              ),
            });
            return kernelPaymaster.sponsorUserOperation({
              userOperation,
              entryPoint: entryPoint,
            });
          },
        },
      });

      setKernelClient(
        kernelClient as KernelAccountClient<
          EntryPoint,
          Transport,
          typeof chain,
          KernelSmartAccount<EntryPoint>
        >
      );
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
