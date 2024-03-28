import { Modal } from "@mantine/core";
import ConnectSigner from "./ConnectSigner";

export interface ConnectModalProps {
  open: boolean;
  onClose: () => void;
}

export enum ConnectStep {
  Connect = "CONNECT",
  Permission = "PERMISSION",
}

export function ConnectModal({ onClose, open }: ConnectModalProps) {
  const titleId = "Connect";

  return (
    <Modal
      opened={open}
      onClose={() => {
        onClose();
      }}
      title={titleId}
    >
      <ConnectSigner />
    </Modal>
  );
}
