import { useConnectModal, useKernelAccount } from "@/waas";
import { useSetKernelAccountClient } from "@/waas/hooks/useSetKernelAccountClient";
import { type KernelVersionType } from "@/waas/types";
import { Button } from "@mantine/core";

export function ConnectButton({ version }: { version: KernelVersionType }) {
  const { isConnected } = useKernelAccount();
  const { setValidator, setKernelAccount } = useSetKernelAccountClient();
  const { openConnectModal } = useConnectModal();

  return (
    <Button
      variant="outline"
      onClick={() => {
        if (isConnected) {
          setValidator(null);
          setKernelAccount(null);
          localStorage.removeItem("kernel_validator");
          localStorage.removeItem("kernel_account");
        } else {
          openConnectModal?.({ version });
        }
      }}
    >
      {isConnected ? "Disconnect" : "Connect"}
    </Button>
  );
}
