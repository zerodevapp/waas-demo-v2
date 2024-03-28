import { useEnableSession, useSessionPermission, useValidator } from "@/waas";
import { Button, Loader, Modal } from "@mantine/core";
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
  const { setKernelAccount } = useValidator();
  const { permissions } = useSessionPermission();
  const { write, data, error } = useEnableSession();

  useEffect(() => {
    const setAccount = () => {
      if (data) {
        setKernelAccount(data);
      }
    };
    setAccount();
  }, [data]);

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
        <Button
          variant="outline"
          disabled={!permissions || isLoading}
          onClick={() => {
            setIsLoading(true);
            write(permissions);
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
