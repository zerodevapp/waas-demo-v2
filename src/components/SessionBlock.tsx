"use client";
import {
  useKernelClient,
  usePermissionModal,
  useSendUserOperationWithSession,
  useSession,
  useSessionPermission,
  useValidator,
} from "@/waas";
import { Button, Title } from "@mantine/core";
import { useEffect, useState } from "react";

const nftAddress = "0x34bE7f35132E97915633BC1fc020364EA5134863";

function SessionInfo({ permissionId }: { permissionId?: `0x${string}` }) {
  const [isLoading, setIsLoading] = useState(false);
  const { kernelAccount } = useValidator();
  const { isExpired, enableSignature, permissions } = useSessionPermission({
    permissionId,
  });
  const { data, write, error } = useSendUserOperationWithSession({
    permissionId,
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
        {permissionId && <p>{`Permission ID: ${permissionId}`}</p>}
        <Button
          variant="outline"
          disabled={isLoading || !write}
          loading={isLoading || (permissionId && isExpired === undefined)}
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
  const { session } = useSession();
  const { kernelAccount } = useKernelClient();
  const accountAddress = kernelAccount?.address;

  return (
    <>
      <Title order={3}>Session</Title>
      <Button variant="outline" onClick={() => openPermissionModal?.()}>
        Set Permission
      </Button>
      <Title order={5}>Send UserOp without providing a permissionId</Title>
      {session && <SessionInfo />}
      <Title order={5}>Send UserOp with permissionId</Title>
      {session &&
        Object.keys(session)
          .filter(
            (pId) =>
              session[pId as `0x${string}`].smartAccount === accountAddress
          )
          .map((pId, index) => (
            <SessionInfo key={index} permissionId={pId as `0x${string}`} />
          ))}
    </>
  );
}
