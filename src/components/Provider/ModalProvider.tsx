import { type Policy } from "@zerodev/permissions";
import { useKernelClient, type KernelVersionType } from "@zerodev/waas";
import {
  ReactNode,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import ConnectModal from "../Modal/ConnectModal";
import OnboardingModal from "../Modal/OnboardingModal";
import PaymasterModal from "../Modal/PaymasterModal";
import SessionModal from "../Modal/SessionModal";

export function useModalStateValue() {
  const [isModalOpen, setModalOpen] = useState(false);

  return {
    closeModal: useCallback(() => {
      setModalOpen(false);
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
  paymasterModalOpen: boolean;
  openPaymasterModal?: () => void;
  onboardingModalOpen: boolean;
  openOnboardingModal?: () => void;
}

export const ModalContext = createContext<ModalContextValue>({
  connectModalOpen: false,
  sessionModalOpen: false,
  paymasterModalOpen: false,
  onboardingModalOpen: false,
});

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const { kernelAccount } = useKernelClient();
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
  const {
    closeModal: closePaymasterModal,
    isModalOpen: paymasterModalOpen,
    openModal: openPaymasterModal,
  } = useModalStateValue();
  const {
    closeModal: closeOnboardingModal,
    isModalOpen: onboardingModalOpen,
    openModal: openOnboardingModal,
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

  const openPaymasterModalAction = useCallback(() => {
    openPaymasterModal();
  }, [openPaymasterModal]);

  const openOnboardingModalAction = useCallback(() => {
    openOnboardingModal();
  }, [openOnboardingModal]);

  return (
    <ModalContext.Provider
      value={useMemo(
        () => ({
          connectModalOpen,
          openConnectModal: openConnectModalWithVersion,
          sessionModalOpen,
          openSessionModal: openSessionModalWithPolicy,
          paymasterModalOpen,
          openPaymasterModal: openPaymasterModalAction,
          onboardingModalOpen,
          openOnboardingModal: openOnboardingModalAction,
        }),
        [
          connectModalOpen,
          openConnectModalWithVersion,
          sessionModalOpen,
          openSessionModalWithPolicy,
          paymasterModalOpen,
          openPaymasterModalAction,
          onboardingModalOpen,
          openOnboardingModalAction,
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
      <PaymasterModal onClose={closePaymasterModal} open={paymasterModalOpen} />
      <OnboardingModal
        onClose={closeOnboardingModal}
        open={onboardingModalOpen}
      />
    </ModalContext.Provider>
  );
}
