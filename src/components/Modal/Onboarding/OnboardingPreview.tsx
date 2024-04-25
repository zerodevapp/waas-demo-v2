import {
  chainIdToName,
  getTokenByChainIdAndAddress,
  type TokenChainType,
} from "@/utils/tokenAddress";
import { Box, SimpleGrid, Text, Title } from "@mantine/core";

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
        <Title order={5} className="mb-2">
          Source Chain
        </Title>
        <Text>{chainIdToName(srcChain)}</Text>
        <Title order={5} className="mb-2">
          Source Token
        </Title>
        <Text>{getTokenByChainIdAndAddress(srcChain, srcToken)}</Text>
        <Title order={5} className="mb-2">
          Input Amount
        </Title>
        <Text>{params.amount}</Text>
      </Box>

      <Box className="p-4 space-y-4">
        <Title order={5} className="mb-2">
          Destination Chain
        </Title>
        <Text>{chainIdToName(dstChain)}</Text>
        <Title order={5} className="mb-2">
          Destination Token
        </Title>
        <Text>{getTokenByChainIdAndAddress(dstChain, dstToken)}</Text>
        <Title order={5} className="mb-2">
          Output Amount
        </Title>
        <Text>{amountOut}</Text>
      </Box>
    </SimpleGrid>
  );
}
