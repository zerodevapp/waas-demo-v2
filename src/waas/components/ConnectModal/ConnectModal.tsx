import { Modal } from "@mantine/core";
import { useEffect, useState } from "react";
import { useModalStateValue } from "../../components/ZeroDevProvider/ModalContext";
import ConnectSigner from "./ConnectSigner";
import PermissionApproval from "./PermissionApproval";

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
  const { isModalOpen } = useModalStateValue();
  const [connectStep, setConnectStep] = useState<ConnectStep>(
    ConnectStep.Connect
  );

  useEffect(() => {
    const resetStep = () => setConnectStep(ConnectStep.Connect);
    resetStep();
  }, [isModalOpen]);

  return (
    <Modal
      opened={open}
      onClose={() => {
        onClose();
        setConnectStep(ConnectStep.Connect);
      }}
      title={titleId}
    >
      {connectStep === ConnectStep.Connect && (
        <ConnectSigner setConnectStep={setConnectStep} />
      )}
      {connectStep === ConnectStep.Permission && <PermissionApproval />}
    </Modal>
  );
}
