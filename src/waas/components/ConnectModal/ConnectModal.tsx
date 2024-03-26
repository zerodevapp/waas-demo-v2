import { Modal } from "@mantine/core";
import SignerOptions from "./SignerOptions";

export interface ConnectModalProps {
  open: boolean;
  onClose: () => void;
}

export function ConnectModal({ onClose, open }: ConnectModalProps) {
  const titleId = "Connect";

  return (
    <Modal opened={open} onClose={onClose} title={titleId}>
      <SignerOptions />
    </Modal>
  );
}
