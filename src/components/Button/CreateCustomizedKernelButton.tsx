import { getBundler, getPaymaster } from "@/utils/constants";
import { Button } from "@mantine/core";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import {
  KernelV3ExecuteAbi,
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
} from "@zerodev/sdk";
import { useChainId, useChains, useSetKernelClient } from "@zerodev/waas";
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { EntryPoint } from "permissionless/types";
import { useState } from "react";
import {
  createPublicClient,
  getAbiItem,
  http,
  toFunctionSelector,
  zeroAddress,
  type Chain,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

export function CreateCustomizedKernelButton() {
  const [isLoading, setIsLoading] = useState(false);
  const chains = useChains();
  const chainId = useChainId();
  const { setKernelClient, error } = useSetKernelClient();

  const createKernelClient = async () => {
    const chain = chains.find((c: Chain) => c.id === chainId);
    if (!chain) return;
    setIsLoading(true);

    const publicClient = createPublicClient({
      chain: chain,
      transport: http(getBundler(chain.id)),
    });

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
        bundlerTransport: http(getBundler(chain.id)),
        entryPoint: entryPoint,
        middleware: {
          sponsorUserOperation: async ({ userOperation }) => {
            const kernelPaymaster = createZeroDevPaymasterClient({
              entryPoint: entryPoint,
              chain: chain,
              transport: http(getPaymaster(chain.id)),
            });
            return kernelPaymaster.sponsorUserOperation({
              userOperation,
              entryPoint: entryPoint,
            });
          },
        },
      });
      setKernelClient(kernelClient);
    } catch (err) {
      console.log(err);
    }

    setIsLoading(false);
  };

  return (
    <Button loading={isLoading} variant="outline" onClick={createKernelClient}>
      Generate Private key
    </Button>
  );
}
