import { useKernelClient } from "@/waas";
import { Flex } from "@mantine/core";
import { ConnectButton } from "../waas/components/Button";
import { PaymasterButton } from "./Paymaster";

export default function Navbar() {
  const { isConnected } = useKernelClient();

  return (
    <Flex
      w="100vw"
      justify={"space-between"}
      px="lg"
      py={15}
      wrap="wrap"
      align="center"
    >
      <Flex justify="flex-end" miw={20} gap="sm" w="100%">
        {isConnected && (
          <>
            <PaymasterButton />
            <ConnectButton version="v3" />
          </>
        )}
      </Flex>
    </Flex>
  );
}
