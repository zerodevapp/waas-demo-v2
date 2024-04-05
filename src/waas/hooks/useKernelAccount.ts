import { useContext } from "react";
import { ZeroDevValidatorContext } from "../components/ZeroDevProvider/ZeroDevValidatorContext";

export function useKernelAccount() {
  const { validator, kernelAccount, kernelAccountClient, entryPoint } =
    useContext(ZeroDevValidatorContext);

  return {
    validator,
    kernelAccount,
    kernelAccountClient,
    entryPoint,
    isConnected: !!kernelAccount || !!kernelAccountClient,
  };
}
