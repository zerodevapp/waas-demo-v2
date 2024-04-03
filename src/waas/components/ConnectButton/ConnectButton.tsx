import { useConnectModal, useKernelAccount } from "@/waas";
import { type KernelVersionType } from "@/waas/types";
import { Button } from "@mantine/core";

export function ConnectButton({ version }: { version: KernelVersionType }) {
  const { kernelAccount, setValidator, setKernelAccount } = useKernelAccount();
  const { openConnectModal } = useConnectModal();

  return (
    <Button
      variant="outline"
      onClick={() => {
        if (kernelAccount) {
          setValidator(null);
          setKernelAccount(null);
          localStorage.removeItem("kernel_validator");
          localStorage.removeItem("kernel_account");
        } else {
          openConnectModal?.({ version });
        }
      }}
    >
      {kernelAccount ? "Disconnect" : "Connect"}
    </Button>
  );
}
