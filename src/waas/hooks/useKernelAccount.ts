import { useContext } from "react";
import { ZeroDevValidatorContext } from "../components/ZeroDevProvider/ZeroDevValidatorContext";

export function useKernelAccount() {
  const { validator, setValidator, kernelAccount, setKernelAccount } =
    useContext(ZeroDevValidatorContext);

  return {
    validator,
    setValidator,
    kernelAccount,
    setKernelAccount,
    isConnected: !!kernelAccount,
  };
}
