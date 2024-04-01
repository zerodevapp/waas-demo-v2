"use client";
import { ConnectButton, useKernelAccount, useSendUserOperation } from "@/waas";
import { Button, Loader, Title } from "@mantine/core";
import { useEffect, useState } from "react";

export default function SmartAccountBlock() {
  const [isLoading, setIsLoading] = useState(false);
  const { kernelAccount } = useKernelAccount();
  const { data, write, error } = useSendUserOperation();
  const [mintCalldata, setMintCalldata] = useState<`0x${string}` | null>(null);
  const nftAddress = "0x34bE7f35132E97915633BC1fc020364EA5134863";

  useEffect(() => {
    if (kernelAccount) {
      setMintCalldata(
        `0x6a627842000000000000000000000000${kernelAccount.address.slice(2)}`
      );
    }
  }, [kernelAccount]);
  useEffect(() => setIsLoading(false), [data, error]);

  return (
    <>
      <Title order={3}>Smart Account</Title>
      <div className="mb-4">Address: {kernelAccount!.address}</div>
      <div className="flex flex-row justify-center items-center space-x-4 mt-4">
        <ConnectButton />
        <Button
          variant="outline"
          disabled={!mintCalldata || isLoading || !write}
          onClick={() => {
            setIsLoading(true);
            write?.({ to: nftAddress, value: 0n, data: mintCalldata! });
          }}
        >
          {isLoading ? <Loader /> : "Mint"}
        </Button>
      </div>
      {data && <div className="mt-4">UserOp Hash: {data}</div>}
    </>
  );
}
