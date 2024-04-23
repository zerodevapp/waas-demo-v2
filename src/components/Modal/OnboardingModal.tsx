import { useSwapBalance, useSwapData } from "@/hooks";
import {
  chainIdToName,
  tokenAddress,
  type TokenChainType,
} from "@/utils/tokenAddress";
import {
  Box,
  Button,
  Modal,
  NumberInput,
  Select,
  SimpleGrid,
  Text,
} from "@mantine/core";
import { useState } from "react";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";

export interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

export default function OnboardingModal({
  onClose,
  open,
}: OnboardingModalProps) {
  const titleId = "Onboarding";

  const [step, setStep] = useState(0);
  const { address } = useAccount();
  const [srcChain, setSrcChain] = useState<TokenChainType | null>();
  const [dstChain, setDstChain] = useState<TokenChainType | null>();
  const [srcToken, setSrcToken] = useState<string | null>();
  const [dstToken, setDstToken] = useState<string | null>();
  const [amount, setAmount] = useState<string | undefined>();
  const { data, isLoading } = useSwapBalance({
    chainId: srcChain,
    tokenAddress: srcToken,
  });
  const { data: swapData, error, write, isPending } = useSwapData();

  const insufficientError = () => {
    if (!data || !amount) return undefined;
    const amountBN = parseUnits(amount, data.decimals);
    if (amountBN <= 0n) return "Must be greater than 0";
    return data.value < amountBN ? "Insufficient Balance" : undefined;
  };

  console.log("swapData", swapData);
  console.log("swapData error", error);

  const isButtonEnable =
    !!srcChain &&
    !!dstChain &&
    !!srcToken &&
    !!dstToken &&
    !!amount &&
    !!data &&
    !insufficientError();

  return (
    <Modal opened={open} onClose={onClose} title={titleId} centered size="lg">
      <SimpleGrid cols={2} spacing="lg" className="divide-x divide-gray-700">
        <Box className="p-4 space-y-4">
          <Text w={500} className="mb-2">
            Source Chain
          </Text>
          <Select
            value={srcChain?.toString()}
            onChange={(value) => {
              setSrcChain(value as unknown as TokenChainType);
              setSrcToken(null);
            }}
            data={Object.keys(tokenAddress).map((chainId) => ({
              value: chainId,
              label: chainIdToName(chainId as unknown as TokenChainType),
            }))}
            className="mb-4"
          />
          <Text w={500}>Source Token</Text>
          <div>
            {data && (
              <Text w={500} className="text-sm text-gray-500">
                Balance {data.formatted}
              </Text>
            )}
            <Select
              value={srcToken}
              onChange={(value) => setSrcToken(value)}
              data={
                srcChain
                  ? Object.entries(tokenAddress[srcChain]).map(
                      ([token, address]) => ({
                        value: address,
                        label: token,
                      })
                    )
                  : []
              }
            />
          </div>

          <NumberInput
            label="Input Amount"
            hideControls
            className="mt-1"
            value={amount}
            onChange={(val) => setAmount(val.toString())}
            error={insufficientError()}
          />
        </Box>

        <Box className="p-4 space-y-4">
          <Text w={500} className="mb-2">
            Destination Chain
          </Text>
          <Select
            value={dstChain?.toString()}
            onChange={(value) => {
              setDstChain(value as unknown as TokenChainType);
              setDstToken(null);
            }}
            data={Object.keys(tokenAddress).map((chainId) => ({
              value: chainId,
              label: chainIdToName(chainId as unknown as TokenChainType),
            }))}
            className="mb-4"
          />
          <Text w={500} className="mb-2">
            Destination Token
          </Text>
          <Select
            value={dstToken}
            onChange={(value) => setDstToken(value)}
            data={
              dstChain
                ? Object.entries(tokenAddress[dstChain]).map(
                    ([token, address]) => ({
                      value: address,
                      label: token,
                    })
                  )
                : []
            }
          />
        </Box>
      </SimpleGrid>

      <div className="flex justify-center mt-6">
        <Button
          disabled={!isButtonEnable}
          loading={isLoading || isPending}
          onClick={() =>
            write({
              from: address,
              to: address,
              tokenIn: srcToken,
              tokenOut: dstToken,
              srcChainId: Number(srcChain?.toString()),
              dstChainId: Number(dstChain?.toString()),
              amountIn: parseUnits(amount as string, data?.decimals).toString(),
            })
          }
        >
          Get Output Amount
        </Button>
      </div>
    </Modal>
  );
}
