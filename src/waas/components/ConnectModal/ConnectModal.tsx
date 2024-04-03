import { KernelVersionType } from "@/waas/types";
import { Modal } from "@mantine/core";
import ConnectSigner from "./ConnectSigner";

export interface ConnectModalProps {
  open: boolean;
  onClose: () => void;
  version: KernelVersionType;
}

export enum ConnectStep {
  Connect = "CONNECT",
  Permission = "PERMISSION",
}

export function ConnectModal({ onClose, open, version }: ConnectModalProps) {
  const titleId = "Connect";

  return (
    <Modal
      opened={open}
      onClose={() => {
        onClose();
      }}
      title={titleId}
    >
      <ConnectSigner version={version} />
    </Modal>
  );
}
