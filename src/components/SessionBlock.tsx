"use client";
import {
  useKernelClient,
  useSendUserOperationWithSession,
  useSessionModal,
  useSessions,
} from "@/waas";
import { useMockedPolicy } from "@/waas/hooks/mock/useMockPolicy";
import { Button, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect } from "react";
import { parseAbi } from "viem";
import { usePaymasterConfig } from "./Paymaster";

function SessionInfo({ sessionId }: { sessionId?: `0x${string}` }) {
  const { kernelClient } = useKernelClient();
  const nftAddress = "0x34bE7f35132E97915633BC1fc020364EA5134863";
  const abi = parseAbi(["function mint(address _to) public"]);
  const { paymasterConfig } = usePaymasterConfig({ sessionId });

  const { data, write, isDisabled, isPending, error } =
    useSendUserOperationWithSession({
      sessionId,
      paymaster: paymasterConfig,
    });

  useEffect(() => {
    if (error) {
      notifications.show({
        color: "red",
        message: "Fail to send userop",
      });
    }
  }, [error]);

  return (
    <>
      <div className="flex flex-row justify-center items-center space-x-4 mt-4">
        {sessionId && <p>{`Permission ID: ${sessionId}`}</p>}
        <Button
          variant="outline"
          disabled={isDisabled}
          loading={isPending}
          onClick={() => {
            write([
              {
                address: nftAddress,
                abi: abi,
                functionName: "mint",
                args: [kernelClient?.account?.address],
                value: 0n,
              },
              {
                address: nftAddress,
                abi: abi,
                functionName: "mint",
                args: [kernelClient?.account?.address],
                value: 0n,
              },
            ]);
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
  const { policies } = useMockedPolicy();

  return (
    <>
      <Title order={3}>Session</Title>
      <Button
        variant="outline"
        disabled={!policies}
        onClick={() =>
          openSessionModal?.({
            policies: policies?.[0].policy,
          })
        }
      >
        Create Session
      </Button>
      {sessions &&
        Object.keys(sessions).map((sId, index) => (
          <SessionInfo key={index} sessionId={sId as `0x${string}`} />
        ))}
    </>
  );
}
