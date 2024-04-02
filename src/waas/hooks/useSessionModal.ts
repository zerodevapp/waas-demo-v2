import { useContext } from "react";
import { ModalContext } from "../components/ZeroDevProvider/ModalContext";

export function useSessionModal() {
  const { openSessionModal } = useContext(ModalContext);

  return {
    openSessionModal,
  };
}
