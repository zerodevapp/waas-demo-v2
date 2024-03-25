"use client";
import { ConnectButton, useSendUserOperation, useValidator } from "@/waas";
import { Button } from "@mantine/core";
import { useEffect, useState } from "react";

export default function Home() {
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
    <div className="flex flex-col justify-center items-center h-screen">
      {kernelAccount && (
        <>
          <div className="mb-4">
            Smart Account Address: {kernelAccount.address}
          </div>
          <Button
            variant="outline"
            disabled={!mintCalldata}
            onClick={() =>
              write({
                to: nftAddress,
                value: 0n,
                data: mintCalldata!,
              })
            }
          >
            Mint
          </Button>
          {data && <div className="mt-4">UserOp Hash: {data}</div>}
        </>
      )}
      <ConnectButton />
    </div>
  );
}
