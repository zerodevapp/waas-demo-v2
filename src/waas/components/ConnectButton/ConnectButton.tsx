import {
  useConnectModal,
  useDisconnectKernelClient,
  useKernelClient,
} from "@/waas";
import { type KernelVersionType } from "@/waas/types";
import { Button } from "@mantine/core";

export function ConnectButton({ version }: { version: KernelVersionType }) {
  const { isConnected } = useKernelClient();
  const { disconnect } = useDisconnectKernelClient();
  const { openConnectModal } = useConnectModal();

  return (
    <Button
      variant="outline"
      onClick={() => {
        if (isConnected) {
          disconnect();
        } else {
          openConnectModal?.({ version });
        }
      }}
    >
      {isConnected ? "Disconnect" : "Connect"}
    </Button>
  );
}
