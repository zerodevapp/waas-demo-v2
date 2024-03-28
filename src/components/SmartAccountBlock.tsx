"use client";
import { ConnectButton, useSendUserOperation, useValidator } from "@/waas";
import { Button, Title } from "@mantine/core";
import { useEffect, useState } from "react";

export default function SmartAccountBlock() {
  const { kernelAccount } = useValidator();
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

  return (
    <>
      <Title order={3}>Smart Account</Title>
      <div className="mb-4">Address: {kernelAccount!.address}</div>
      <div className="flex flex-row justify-center items-center space-x-4 mt-4">
        <ConnectButton />
        <Button
          variant="outline"
          disabled={!mintCalldata}
          onClick={() =>
            write({ to: nftAddress, value: 0n, data: mintCalldata! })
          }
        >
          Mint
        </Button>
      </div>
      {data && <div className="mt-4">UserOp Hash: {data}</div>}
    </>
  );
}
