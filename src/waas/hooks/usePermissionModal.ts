import { useContext } from "react";
import { ModalContext } from "../components/ZeroDevProvider/ModalContext";

export function usePermissionModal() {
  const { permissionModalOpen, openPermissionModal } = useContext(ModalContext);

  return {
    permissionModalOpen,
    openPermissionModal,
  };
}
