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

function useModalStateValue() {
  const [isModalOpen, setModalOpen] = useState(false);

  return {
    closeModal: useCallback(() => setModalOpen(false), []),
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
  const { validator } = useValidator();
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
    if (validator) {
      closeModals({ keepConnectModalOpen: false });
    }
  }, [validator]);

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
