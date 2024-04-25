import { useSwapBalance } from "@/hooks";
import {
  chainIdToName,
  tokenAddress,
  type TokenChainType,
} from "@/utils/tokenAddress";
import { Box, NumberInput, Select, SimpleGrid, Text } from "@mantine/core";
import { parseUnits } from "viem";

export type OnboardingParams = {
  srcChain: TokenChainType | null;
  dstChain: TokenChainType;
  srcToken: string | null;
  dstToken: string | null;
  amount: string | undefined;
};

export function OnboardingInput({
  params,
  setParams,
}: {
  params: OnboardingParams;
  setParams: (f: (prev: OnboardingParams) => OnboardingParams) => void;
}) {
  const { data } = useSwapBalance({
    chainId: params.srcChain,
    tokenAddress: params.srcToken,
  });
  const insufficientError = () => {
    if (!data || !params.amount) return undefined;
    const amountBN = parseUnits(params.amount, data.decimals);
    if (amountBN <= 0n) return "Must be greater than 0";
    return data.value < amountBN ? "Insufficient Balance" : undefined;
  };

  return (
    <SimpleGrid cols={2} spacing="lg" className="divide-x divide-gray-700">
      <Box className="p-4 space-y-4">
        <Text w={500} className="mb-2">
          Source Chain
        </Text>
        <Select
          value={params.srcChain?.toString()}
          onChange={(value) => {
            setParams((prev: OnboardingParams) => ({
              ...prev,
              srcChain: value as unknown as TokenChainType,
              srcToken: null,
            }));
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
            value={params.srcToken}
            onChange={(value) =>
              setParams((prev) => ({ ...prev, srcToken: value }))
            }
            data={
              params.srcChain
                ? Object.entries(tokenAddress[params.srcChain]).map(
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
          value={params.amount}
          onChange={(value) =>
            setParams((prev) => ({ ...prev, amount: value.toString() }))
          }
          error={insufficientError()}
        />
      </Box>

      <Box className="p-4 space-y-4">
        <Text w={500} className="mb-2">
          Destination Chain
        </Text>
        <Text>{chainIdToName(params.dstChain)}</Text>
        <Text w={500} className="mb-2">
          Destination Token
        </Text>
        <Select
          value={params.dstToken}
          onChange={(value) =>
            setParams((prev) => ({ ...prev, dstToken: value }))
          }
          data={
            params.dstChain
              ? Object.entries(tokenAddress[params.dstChain]).map(
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
  );
}
