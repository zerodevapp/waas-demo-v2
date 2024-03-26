import { useConnectModal, useValidator } from "@/waas";
import { Button } from "@mantine/core";

export function ConnectButton() {
  const { validator, setValidator, setKernelAccount } = useValidator();
  const { openConnectModal } = useConnectModal();

  return (
    <Button
      variant="outline"
      onClick={() => {
        if (validator) {
          setValidator(null);
          setKernelAccount(null);
          localStorage.removeItem("kernel_validator");
          localStorage.removeItem("kernel_account");
        } else {
          openConnectModal?.();
        }
      }}
    >
      {validator ? "Disconnect" : "Connect"}
    </Button>
  );
}
