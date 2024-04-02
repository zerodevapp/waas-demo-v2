import { useKernelAccount } from "@/waas";
import { type Policy } from "@zerodev/permission-validator";
import {
  ReactNode,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ConnectModal } from "../ConnectModal/ConnectModal";
import { SessionModal } from "../SessionModal";

export function useModalStateValue() {
  const [isModalOpen, setModalOpen] = useState(false);

  return {
    closeModal: useCallback(() => {
      setModalOpen(false);
      // if (validator && !kernelAccount) setValidator(null);
    }, []),
    isModalOpen,
    openModal: useCallback(() => setModalOpen(true), []),
  };
}

interface ModalContextValue {
  connectModalOpen: boolean;
  openConnectModal?: () => void;
  sessionModalOpen: boolean;
  openSessionModal?: ({ policies }: { policies: Policy[] | undefined }) => void;
}

export const ModalContext = createContext<ModalContextValue>({
  connectModalOpen: false,
  sessionModalOpen: false,
});

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const { kernelAccount, validator } = useKernelAccount();
  const [policies, setPolicies] = useState<Policy[]>([]);

  const {
    closeModal: closeConnectModal,
    isModalOpen: connectModalOpen,
    openModal: openConnectModal,
  } = useModalStateValue();
  const {
    closeModal: closeSessionModal,
    isModalOpen: sessionModalOpen,
    openModal: openSessionModal,
  } = useModalStateValue();

  useEffect(() => {
    if (kernelAccount) {
      closeConnectModal();
    }
  }, [kernelAccount, closeConnectModal]);

  const openSessionModalWithPolicy = useCallback(
    ({ policies }: { policies: Policy[] | undefined }) => {
      setPolicies(policies || []);
      openSessionModal();
    },
    [openSessionModal]
  );

  return (
    <ModalContext.Provider
      value={useMemo(
        () => ({
          connectModalOpen,
          openConnectModal,
          sessionModalOpen,
          openSessionModal: openSessionModalWithPolicy,
        }),
        [
          connectModalOpen,
          openConnectModal,
          sessionModalOpen,
          openSessionModalWithPolicy,
        ]
      )}
    >
      {children}
      <ConnectModal onClose={closeConnectModal} open={connectModalOpen} />
      <SessionModal
        onClose={closeSessionModal}
        open={sessionModalOpen}
        policies={policies}
      />
    </ModalContext.Provider>
  );
}
