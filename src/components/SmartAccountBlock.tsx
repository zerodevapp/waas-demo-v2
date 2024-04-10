"use client";
import {
  ConnectButton,
  useBalance,
  useKernelClient,
  useSendUserOperation,
} from "@/waas";
import { Button, Title } from "@mantine/core";
import { parseAbi } from "viem";

export default function SmartAccountBlock() {
  const { address } = useKernelClient();
  const { data: hash, write, isPending } = useSendUserOperation();
  const { data } = useBalance();
  const nftAddress = "0x34bE7f35132E97915633BC1fc020364EA5134863";
  const abi = parseAbi(["function mint(address _to) public"]);

  return (
    <>
      <Title order={3}>Smart Account</Title>
      <div className="mb-4">Address: {address}</div>
      {data && (
        <div className="mb-4">
          Balance: {`${data.formatted} ${data.symbol}`}
        </div>
      )}
      <div className="flex flex-row justify-center items-center space-x-4 mt-4">
        <ConnectButton version="v3" />
        <Button
          variant="outline"
          disabled={isPending}
          loading={isPending}
          onClick={() => {
            write([
              {
                address: nftAddress,
                abi: abi,
                functionName: "mint",
                args: [address],
                value: 0n,
              },
              {
                address: nftAddress,
                abi: abi,
                functionName: "mint",
                args: [address],
                value: 0n,
              },
            ]);
          }}
        >
          Mint
        </Button>
      </div>
      {hash && <div className="mt-4">UserOp Hash: {hash}</div>}
    </>
  );
}
