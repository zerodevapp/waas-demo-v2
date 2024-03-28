"use client";
import {
  usePermissionModal,
  useSendUserOperation,
  useSessionPermission,
} from "@/waas";
import { useMockedPolicy } from "@/waas/hooks/mock/useMockPolicy";
import { Button, Title } from "@mantine/core";
import { useState } from "react";

export default function SessionBlock() {
  const { openPermissionModal } = usePermissionModal();
  const { policies } = useMockedPolicy();
  const { isExpired } = useSessionPermission({ policies });
  const { data, write, error } = useSendUserOperation();
  const [mintCalldata, setMintCalldata] = useState<`0x${string}` | null>(null);
  const nftAddress = "0x34bE7f35132E97915633BC1fc020364EA5134863";

  return (
    <>
      <Title order={3}>Session</Title>
      <div className="flex flex-row justify-center items-center space-x-4 mt-4">
        <Button variant="outline" onClick={() => openPermissionModal?.()}>
          Set Permission
        </Button>
        <Button
          variant="outline"
          disabled={isExpired !== false}
          loading={isExpired === undefined}
        >
          Mint With Session
        </Button>
      </div>
    </>
  );
}
