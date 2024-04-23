import {
  chainIdToName,
  getTokenByChainIdAndAddress,
  type TokenChainType,
} from "@/utils/tokenAddress";
import { Box, SimpleGrid, Text } from "@mantine/core";

export type OnboardingParams = {
  srcChain: TokenChainType | null;
  dstChain: TokenChainType | null;
  srcToken: string | null;
  dstToken: string | null;
  amount: string | undefined;
};

export function OnboardingPreview({
  params,
  amountOut,
}: {
  params: OnboardingParams;
  amountOut: string;
}) {
  const { srcChain, dstChain, srcToken, dstToken, amount } = params;
  if (!srcChain || !dstChain || !srcToken || !dstToken || !amount) return null;

  return (
    <SimpleGrid cols={2} spacing="lg" className="divide-x divide-gray-700">
      <Box className="p-4 space-y-4">
        <Text w={500} className="mb-2">
          Source Chain
        </Text>
        <Text>{chainIdToName(srcChain)}</Text>
        <Text w={500} className="mb-2">
          Source Token
        </Text>
        <Text>{getTokenByChainIdAndAddress(srcChain, srcToken)}</Text>
        <Text w={500} className="mb-2">
          Input Amount
        </Text>
        <Text>{params.amount}</Text>
      </Box>

      <Box className="p-4 space-y-4">
        <Text w={500} className="mb-2">
          Destination Chain
        </Text>
        <Text>{chainIdToName(dstChain)}</Text>
        <Text w={500} className="mb-2">
          Destination Token
        </Text>
        <Text>{getTokenByChainIdAndAddress(dstChain, dstToken)}</Text>
        <Text w={500} className="mb-2">
          Output Amount
        </Text>
        <Text>{amountOut}</Text>
      </Box>
    </SimpleGrid>
  );
}
