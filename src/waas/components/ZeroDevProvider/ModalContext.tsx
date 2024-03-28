import { useValidator } from "@/waas";
import {
  ReactNode,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ConnectModal } from "../ConnectModal/ConnectModal";
import { PermissionModal } from "../PermissionModal";

export function useModalStateValue() {
  const [isModalOpen, setModalOpen] = useState(false);
  const { validator, setValidator, kernelAccount } = useValidator();

  return {
    closeModal: useCallback(() => {
      setModalOpen(false);
      // if (validator && !kernelAccount) setValidator(null);
    }, [validator, setValidator, kernelAccount]),
    isModalOpen,
    openModal: useCallback(() => setModalOpen(true), []),
  };
}

interface ModalContextValue {
  connectModalOpen: boolean;
  openConnectModal?: () => void;
  permissionModalOpen: boolean;
  openPermissionModal?: () => void;
}

export const ModalContext = createContext<ModalContextValue>({
  connectModalOpen: false,
  permissionModalOpen: false,
});

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const { kernelAccount, validator, enableSignature } = useValidator();

  const {
    closeModal: closeConnectModal,
    isModalOpen: connectModalOpen,
    openModal: openConnectModal,
  } = useModalStateValue();
  const {
    closeModal: closePermissionModal,
    isModalOpen: permissionModalOpen,
    openModal: openPermissionModal,
  } = useModalStateValue();

  useEffect(() => {
    if (kernelAccount) {
      closeConnectModal();
    }
  }, [kernelAccount, validator]);

  useEffect(() => {
    if (enableSignature) closePermissionModal();
  }, [enableSignature]);

  return (
    <ModalContext.Provider
      value={useMemo(
        () => ({
          connectModalOpen,
          openConnectModal,
          permissionModalOpen,
          openPermissionModal,
        }),
        [connectModalOpen, openConnectModal]
      )}
    >
      {children}
      <ConnectModal onClose={closeConnectModal} open={connectModalOpen} />
      <PermissionModal
        onClose={closePermissionModal}
        open={permissionModalOpen}
      />
    </ModalContext.Provider>
  );
}
