import { useConnectModal, useKernelAccount } from "@/waas";
import { Button } from "@mantine/core";

export function ConnectButton() {
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
          openConnectModal?.();
        }
      }}
    >
      {kernelAccount ? "Disconnect" : "Connect"}
    </Button>
  );
}
