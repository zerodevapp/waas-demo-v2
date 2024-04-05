import { useKernelAccount } from "@/waas";
import { type Policy } from "@zerodev/permissions";
import {
  ReactNode,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { KernelVersionType } from "../../types";
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
  openConnectModal?: ({ version }: { version: KernelVersionType }) => void;
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
  const [kernelVersion, setKernelVersion] = useState<KernelVersionType>("v3");

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

  const openConnectModalWithVersion = useCallback(
    ({ version }: { version: KernelVersionType }) => {
      setKernelVersion(version);
      openConnectModal();
    },
    [openConnectModal]
  );

  return (
    <ModalContext.Provider
      value={useMemo(
        () => ({
          connectModalOpen,
          openConnectModal: openConnectModalWithVersion,
          sessionModalOpen,
          openSessionModal: openSessionModalWithPolicy,
        }),
        [
          connectModalOpen,
          openConnectModalWithVersion,
          sessionModalOpen,
          openSessionModalWithPolicy,
        ]
      )}
    >
      {children}
      <ConnectModal
        onClose={closeConnectModal}
        open={connectModalOpen}
        version={kernelVersion}
      />
      <SessionModal
        onClose={closeSessionModal}
        open={sessionModalOpen}
        policies={policies}
      />
    </ModalContext.Provider>
  );
}
