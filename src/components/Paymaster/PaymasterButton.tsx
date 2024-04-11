import { Button } from "@mantine/core";
import { usePaymasterModal } from "../Paymaster/PaymasterProvider";

export function PaymasterButton() {
  const { openPaymasterModal } = usePaymasterModal();

  return (
    <Button
      variant="outline"
      onClick={() => {
        openPaymasterModal?.();
      }}
    >
      Set Paymaster
    </Button>
  );
}
