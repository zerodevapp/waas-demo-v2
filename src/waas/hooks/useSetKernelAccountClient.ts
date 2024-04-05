import { useContext } from "react";
import { ZeroDevValidatorContext } from "../components/ZeroDevProvider/ZeroDevValidatorContext";

export function useSetKernelAccountClient() {
  const { setKernelAccountClient } = useContext(ZeroDevValidatorContext);

  return {
    setKernelAccountClient,
  };
}
