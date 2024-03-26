import { useConnectModal, useValidator } from "@/waas";
import { Button } from "@mantine/core";

export function ConnectButton() {
  const { kernelAccount, setValidator, setKernelAccount } = useValidator();
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
