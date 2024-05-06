import { Modal } from "@mantine/core";
import {
  useCreateKernelClientSocial,
  type KernelVersionType,
} from "@zerodev/waas";
import LoadingOverlay from "../LoadingOverlay";
import ConnectSigner from "./Connect/ConnectSigner";

export interface ConnectModalProps {
  open: boolean;
  onClose: () => void;
  version: KernelVersionType;
}

export enum ConnectStep {
  Connect = "CONNECT",
  Permission = "PERMISSION",
}

export default function ConnectModal({
  onClose,
  open,
  version,
}: ConnectModalProps) {
  const { login, isPending } = useCreateKernelClientSocial({ version });
  const titleId = "Connect";

  return (
    <>
      <Modal
        opened={open}
        onClose={() => {
          onClose();
        }}
        title={titleId}
      >
        <ConnectSigner version={version} loginWithSocial={login} />
      </Modal>
      <LoadingOverlay isLoading={isPending} />
    </>
  );
}
