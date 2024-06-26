import { ModalContext } from "@/components/Provider/ModalProvider";
import { useContext } from "react";

export function useModal() {
  const {
    connectModalOpen,
    openConnectModal,
    sessionModalOpen,
    openSessionModal,
    paymasterModalOpen,
    openPaymasterModal,
    onboardingModalOpen,
    openOnboardingModal,
  } = useContext(ModalContext);

  return {
    connectModalOpen,
    openConnectModal,
    sessionModalOpen,
    openSessionModal,
    paymasterModalOpen,
    openPaymasterModal,
    onboardingModalOpen,
    openOnboardingModal,
  };
}
