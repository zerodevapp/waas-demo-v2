import { KernelSmartAccount, KernelValidator } from "@zerodev/sdk";
import { ReactNode, createContext, useEffect, useMemo, useState } from "react";
import { useDisconnect } from "wagmi";

interface ZeroDevValidatorValue {
  validator: KernelValidator | null;
  setValidator: (validator: KernelValidator | null) => void;
  kernelAccount: KernelSmartAccount | null;
  setKernelAccount: (kernelAccount: KernelSmartAccount | null) => void;
}

export const ZeroDevValidatorContext = createContext<ZeroDevValidatorValue>({
  validator: null,
  setValidator: () => {},
  kernelAccount: null,
  setKernelAccount: () => {},
});

interface ZeroDevValidatorProviderProps {
  children: ReactNode;
}

export function ZeroDevValidatorProvider({
  children,
}: ZeroDevValidatorProviderProps) {
  const { disconnect } = useDisconnect();
  const [validator, setValidator] = useState<KernelValidator | null>(null);
  const [kernelAccount, setKernelAccount] = useState<KernelSmartAccount | null>(
    null
  );

  const updateValidator = (validator: KernelValidator | null) => {
    setValidator(validator);
    if (validator) {
      localStorage.setItem("kernel_validator", JSON.stringify(validator));
    } else {
      localStorage.removeItem("kernel_validator");
    }
  };

  const updateKernelAccount = (kernelAccount: KernelSmartAccount | null) => {
    setKernelAccount(kernelAccount);
    if (kernelAccount) {
      localStorage.setItem("kernel_account", JSON.stringify(kernelAccount));
    } else {
      localStorage.removeItem("kernel_account");
    }
  };

  useEffect(() => {
    const storedValidator = localStorage.getItem("kernel_validator");
    const storedAccount = localStorage.getItem("kernel_account");
    if (storedValidator) setValidator(JSON.parse(storedValidator));
    if (storedAccount) setKernelAccount(JSON.parse(storedAccount));
  }, []);

  useEffect(() => {
    if (!validator && disconnect) disconnect();
  }, [validator, disconnect]);

  return (
    <ZeroDevValidatorContext.Provider
      value={useMemo(
        () => ({
          validator,
          setValidator: updateValidator,
          kernelAccount,
          setKernelAccount: updateKernelAccount,
        }),
        [validator, kernelAccount]
      )}
    >
      {children}
    </ZeroDevValidatorContext.Provider>
  );
}
