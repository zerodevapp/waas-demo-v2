import {
  useCreatePermission,
  useSessionPermission,
  useValidator,
} from "@/waas";
import { useMockedPolicy } from "@/waas/hooks/mock/useMockPolicy";
import { Button, Loader, Modal, Select } from "@mantine/core";
import { useEffect, useState } from "react";

export interface PermissionModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PermissionModal({
  onClose,
  open,
}: PermissionModalProps) {
  const titleId = "Permission";
  const [isLoading, setIsLoading] = useState(false);
  const [select, setSelect] = useState<string | null>("");
  const [policyIdx, setPolicyIdx] = useState<number>(0);
  const { setEnableSignature } = useValidator();
  const { policies } = useMockedPolicy();
  const { permissions } = useSessionPermission({
    policies: policies?.[policyIdx].policy,
  });
  const { write, data, error } = useCreatePermission({
    onSuccess: (data) =>
      setEnableSignature(data.permissionId, data.enableSignature),
  });

  useEffect(() => {
    setIsLoading(false);
  }, [open, error]);

  return (
    <Modal
      opened={open}
      onClose={() => {
        onClose();
      }}
      title={titleId}
    >
      <div className="flex flex-col justify-center items-center">
        <h1>Permission Approval</h1>
        <p>Max Gas Allowed In GWei</p>
        <Select
          value={select}
          onChange={(value) => {
            setSelect(value);
            const idx = policies?.findIndex(
              (policy) => policy.maxGasAllowedInWei === value
            );
            if (idx !== undefined && idx >= 0) {
              setPolicyIdx(idx);
            } else {
              setPolicyIdx(0);
            }
          }}
          placeholder="Pick Policy"
          data={policies?.map((policy) => policy.maxGasAllowedInWei)}
        />
        <Button
          variant="outline"
          disabled={!permissions || isLoading || !write || !select}
          onClick={() => {
            setIsLoading(true);
            write?.(permissions);
          }}
        >
          Approve
        </Button>
        {!permissions && <p>Fetching permissions...</p>}
        {isLoading && <Loader />}
      </div>
    </Modal>
  );
}
