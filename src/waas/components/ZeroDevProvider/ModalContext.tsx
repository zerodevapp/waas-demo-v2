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

export function useModalStateValue() {
  const [isModalOpen, setModalOpen] = useState(false);
  const { validator, setValidator, kernelAccount } = useValidator();

  return {
    closeModal: useCallback(() => {
      setModalOpen(false);
      if (validator && !kernelAccount) setValidator(null);
    }, [validator, setValidator, kernelAccount]),
    isModalOpen,
    openModal: useCallback(() => setModalOpen(true), []),
  };
}

interface ModalContextValue {
  connectModalOpen: boolean;
  openConnectModal?: () => void;
}

export const ModalContext = createContext<ModalContextValue>({
  connectModalOpen: false,
});

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const { kernelAccount } = useValidator();
  const {
    closeModal: closeConnectModal,
    isModalOpen: connectModalOpen,
    openModal: openConnectModal,
  } = useModalStateValue();

  interface CloseModalOptions {
    keepConnectModalOpen?: boolean;
  }

  function closeModals({ keepConnectModalOpen = false }: CloseModalOptions) {
    if (!keepConnectModalOpen) {
      closeConnectModal();
    }
  }

  useEffect(() => {
    if (kernelAccount) {
      closeModals({ keepConnectModalOpen: false });
    }
  }, [kernelAccount]);

  return (
    <ModalContext.Provider
      value={useMemo(
        () => ({
          connectModalOpen,
          openConnectModal,
        }),
        [connectModalOpen, openConnectModal]
      )}
    >
      {children}
      <ConnectModal onClose={closeConnectModal} open={connectModalOpen} />
    </ModalContext.Provider>
  );
}
