import { useConnectModal, useKernelAccount } from "@/waas";
import { useSetKernelAccount } from "@/waas/components/ZeroDevProvider/ZeroDevValidatorContext";
import { type KernelVersionType } from "@/waas/types";
import { Button } from "@mantine/core";

export function ConnectButton({ version }: { version: KernelVersionType }) {
  const { isConnected } = useKernelAccount();
  const {
    setValidator,
    setKernelAccount,
    setKernelAccountClient,
    setEntryPoint,
  } = useSetKernelAccount();
  const { openConnectModal } = useConnectModal();

  return (
    <Button
      variant="outline"
      onClick={() => {
        if (isConnected) {
          setValidator(null);
          setKernelAccount(null);
          setKernelAccountClient(null);
          setEntryPoint(null);
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
