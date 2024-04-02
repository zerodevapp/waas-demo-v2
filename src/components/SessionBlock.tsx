"use client";
import {
  useKernelAccount,
  useKernelClient,
  usePermissionModal,
  useSendUserOperationWithSession,
  useSessionPermission,
  useSessions,
} from "@/waas";
import { Button, Title } from "@mantine/core";
import { useEffect, useState } from "react";

const nftAddress = "0x34bE7f35132E97915633BC1fc020364EA5134863";

function SessionInfo({ sessionId }: { sessionId?: `0x${string}` }) {
  const [isLoading, setIsLoading] = useState(false);
  const { kernelAccount } = useKernelAccount();
  const { isExpired, enableSignature, permissions } = useSessionPermission({
    sessionId,
  });
  const { data, write, error } = useSendUserOperationWithSession({
    sessionId,
  });
  const [mintCalldata, setMintCalldata] = useState<`0x${string}` | null>(null);

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
      <div className="flex flex-row justify-center items-center space-x-4 mt-4">
        {sessionId && <p>{`Permission ID: ${sessionId}`}</p>}
        <Button
          variant="outline"
          disabled={isLoading || !write}
          loading={isLoading || (sessionId && isExpired === undefined)}
          onClick={() => {
            setIsLoading(true);
            write?.({ to: nftAddress, value: 0n, data: mintCalldata! });
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
  const { openPermissionModal } = usePermissionModal();
  const sessions = useSessions();
  const { kernelAccount } = useKernelClient();
  const accountAddress = kernelAccount?.address;

  return (
    <>
      <Title order={3}>Session</Title>
      <Button variant="outline" onClick={() => openPermissionModal?.()}>
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
