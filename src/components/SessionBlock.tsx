"use client";
import {
  usePermissionModal,
  useSendUserOperationWithSession,
  useSessionPermission,
  useValidator,
} from "@/waas";
import {
  useMockedPolicy,
  type PolicyType,
} from "@/waas/hooks/mock/useMockPolicy";
import { getPermissionId } from "@/waas/utils/mock/getPermissionId";
import { Button, Title } from "@mantine/core";
import { useEffect, useState } from "react";

const nftAddress = "0x34bE7f35132E97915633BC1fc020364EA5134863";

function SessionInfo({ policyWithInfo }: { policyWithInfo: PolicyType }) {
  const [isLoading, setIsLoading] = useState(false);
  const { kernelAccount, enableSignature } = useValidator();
  const { isExpired } = useSessionPermission({
    policies: policyWithInfo.policy,
  });
  const { data, write, error } = useSendUserOperationWithSession({
    policies: policyWithInfo.policy,
  });
  const [mintCalldata, setMintCalldata] = useState<`0x${string}` | null>(null);
  const signature = enableSignature[getPermissionId(policyWithInfo.policy)];

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
        <p>{`Gas Policy maxGasAllowedInGwei: ${policyWithInfo.maxGasAllowedInWei}`}</p>
        <Button
          variant="outline"
          disabled={(isExpired && !signature) || isLoading || !write}
          loading={isExpired === undefined || isLoading}
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
  const { policies } = useMockedPolicy();

  return (
    <>
      <Title order={3}>Session</Title>
      {/* <div className="flex flex-row justify-center items-center space-x-4 mt-4"> */}
      <Button variant="outline" onClick={() => openPermissionModal?.()}>
        Set Permission
      </Button>
      {policies?.map((policy, index) => (
        <SessionInfo key={index} policyWithInfo={policy} />
      ))}
      {/* </div> */}
    </>
  );
}
