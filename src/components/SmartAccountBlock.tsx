"use client";
import { ConnectButton, useKernelClient, useSendUserOperation } from "@/waas";
import { Button, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { parseAbi } from "viem";

export default function SmartAccountBlock() {
  const [isLoading, setIsLoading] = useState(false);
  const { kernelClient } = useKernelClient();
  const { data, write, error } = useSendUserOperation();
  const nftAddress = "0x34bE7f35132E97915633BC1fc020364EA5134863";
  const abi = parseAbi(["function mint(address _to) public"]);

  useEffect(() => setIsLoading(false), [data, error]);

  return (
    <>
      <Title order={3}>Smart Account</Title>
      <div className="mb-4">Address: {kernelClient?.account.address}</div>
      <div className="flex flex-row justify-center items-center space-x-4 mt-4">
        <ConnectButton version="v3" />
        <Button
          variant="outline"
          disabled={isLoading || !write}
          loading={isLoading}
          onClick={() => {
            setIsLoading(true);
            write?.([
              {
                address: nftAddress,
                abi: abi,
                functionName: "mint",
                args: [kernelClient?.account.address],
                value: 0n,
              },
              {
                address: nftAddress,
                abi: abi,
                functionName: "mint",
                args: [kernelClient?.account.address],
                value: 0n,
              },
            ]);
          }}
        >
          Mint
        </Button>
      </div>
      {data && <div className="mt-4">UserOp Hash: {data}</div>}
    </>
  );
}
