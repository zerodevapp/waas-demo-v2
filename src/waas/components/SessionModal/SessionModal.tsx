import { useCreateSession } from "@/waas";
import { Button, Loader, Modal } from "@mantine/core";
import { type Policy } from "@zerodev/permission-validator";
import { useEffect, useState } from "react";

export interface SessionModalProps {
  open: boolean;
  onClose: () => void;
  policies: Policy[];
}

export default function SessionModal({
  onClose,
  open,
  policies,
}: SessionModalProps) {
  const titleId = "Session";
  const [isLoading, setIsLoading] = useState(false);
  const { write, data, error } = useCreateSession();

  useEffect(() => {
    if (data) onClose();
    setIsLoading(false);
  }, [data, error, onClose]);

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
          disabled={isLoading || !write}
          onClick={() => {
            setIsLoading(true);
            write?.(policies);
          }}
        >
          Approve
        </Button>
        {isLoading && <Loader />}
      </div>
    </Modal>
  );
}
