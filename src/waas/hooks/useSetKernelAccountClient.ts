import { useContext } from "react";
import { ZeroDevValidatorContext } from "../components/ZeroDevProvider/ZeroDevValidatorContext";

export function useSetKernelAccountClient() {
  const {
    setKernelAccountClient,
    setEntryPoint,
    setKernelAccount,
    setValidator,
  } = useContext(ZeroDevValidatorContext);

  return {
    setEntryPoint,
    setKernelAccount,
    setValidator,
    setKernelAccountClient,
  };
}
