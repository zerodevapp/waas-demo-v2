import { useContext } from "react";
import { ModalContext } from "../components/ZeroDevProvider/ModalContext";

export function useConnectModal() {
  const { connectModalOpen, openConnectModal } = useContext(ModalContext);

  return {
    connectModalOpen,
    openConnectModal,
  };
}
