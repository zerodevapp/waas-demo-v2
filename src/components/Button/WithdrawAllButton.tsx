import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useBalance, useKernelClient } from "@zerodev/waas";
import { useState } from "react";
import { useAccount } from "wagmi";

export function WithdrawAllButton() {
  const { address } = useAccount();
  const { data, isLoading: isBalanceLoading } = useBalance();
  const { kernelClient, isLoading: isKernelClientLoading } = useKernelClient({
    paymaster: {
      type: "SPONSOR",
    },
  });
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    if (!address || !data?.value) return;
    try {
      setIsLoading(true);
      const hash = await kernelClient?.sendTransactions({
        transactions: [
          {
            to: address,
            value: data?.value,
            data: "0x",
          },
        ],
      });
      notifications.show({
        color: "green",
        message: `Withdraw tx hash: ${hash}`,
      });
    } catch (err: any) {
      notifications.show({
        color: "red",
        message: `Fail to withdraw ${err?.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      loading={isBalanceLoading || isKernelClientLoading || isLoading}
      onClick={() => {
        onClick();
      }}
    >
      Withdraw to EOA
    </Button>
  );
}
