import { useContext } from "react";
import { ZeroDevValidatorContext } from "../components/ZeroDevProvider/ZeroDevValidatorContext";

export function useValidator() {
  const {
    validator,
    setValidator,
    kernelAccount,
    setKernelAccount,
    enableSignature,
    setEnableSignature,
  } = useContext(ZeroDevValidatorContext);

  return {
    validator,
    setValidator,
    kernelAccount,
    setKernelAccount,
    enableSignature,
    setEnableSignature,
  };
}
