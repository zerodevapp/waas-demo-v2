"use client";
import {
  useKernelAccount,
  useKernelClient,
  useSendUserOperationWithSession,
  useSessionModal,
  useSessions,
} from "@/waas";
import { useMockedPolicy } from "@/waas/hooks/mock/useMockPolicy";
import { Button, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { parseAbi } from "viem";

function SessionInfo({ sessionId }: { sessionId?: `0x${string}` }) {
  const [isLoading, setIsLoading] = useState(false);
  const { kernelAccount } = useKernelAccount();
  const nftAddress = "0x34bE7f35132E97915633BC1fc020364EA5134863";
  const abi = parseAbi(["function mint(address _to) public"]);
  const { data, write, error } = useSendUserOperationWithSession({
    sessionId,
  });
  useEffect(() => setIsLoading(false), [data, error]);

  return (
    <>
      <div className="flex flex-row justify-center items-center space-x-4 mt-4">
        {sessionId && <p>{`Permission ID: ${sessionId}`}</p>}
        <Button
          variant="outline"
          disabled={isLoading || !write}
          loading={isLoading}
          onClick={() => {
            setIsLoading(true);
            write?.({
              address: nftAddress,
              abi: abi,
              functionName: "mint",
              args: [kernelAccount!.address],
              value: 0n,
            });
          }}
        >
          Mint With Session
        </Button>
      </div>
      {data && <div className="mt-4">MintWithSession UserOp Hash: {data}</div>}
    </>
  );
}

export default function SessionBlock() {
  const { openSessionModal } = useSessionModal();
  const sessions = useSessions();
  const { kernelAccount } = useKernelClient();
  const accountAddress = kernelAccount?.address;
  const { policies: p } = useMockedPolicy();

  return (
    <>
      <Title order={3}>Session</Title>
      <Button
        variant="outline"
        disabled={!p}
        onClick={() =>
          openSessionModal?.({
            policies: p?.[0].policy,
          })
        }
      >
        Set Permission
      </Button>
      <Title order={5}>Send UserOp without providing a sessionId</Title>
      {sessions && <SessionInfo />}
      <Title order={5}>Send UserOp with sessionId</Title>
      {sessions &&
        Object.keys(sessions)
          .filter(
            (sId) =>
              sessions[sId as `0x${string}`].smartAccount === accountAddress
          )
          .map((sId, index) => (
            <SessionInfo key={index} sessionId={sId as `0x${string}`} />
          ))}
    </>
  );
}
