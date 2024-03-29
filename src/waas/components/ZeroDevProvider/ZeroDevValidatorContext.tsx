import { KernelSmartAccount, KernelValidator } from "@zerodev/sdk";
import type { EntryPoint } from "permissionless/types";
import { ReactNode, createContext, useEffect, useMemo, useState } from "react";
import { useDisconnect } from "wagmi";

type EnableSignaturesType = {
  [permissionId: `0x${string}`]: `0x${string}`;
};

interface ZeroDevValidatorValue {
  validator: KernelValidator<EntryPoint> | null;
  setValidator: (validator: KernelValidator<EntryPoint> | null) => void;
  kernelAccount: KernelSmartAccount<EntryPoint> | null;
  setKernelAccount: (
    kernelAccount: KernelSmartAccount<EntryPoint> | null
  ) => void;
  enableSignature: EnableSignaturesType;
  setEnableSignature: (
    permissionId: `0x${string}`,
    enableSignature: `0x${string}`
  ) => void;
}

export const ZeroDevValidatorContext = createContext<ZeroDevValidatorValue>({
  validator: null,
  setValidator: () => {},
  kernelAccount: null,
  setKernelAccount: () => {},
  enableSignature: {},
  setEnableSignature: () => {},
});

interface ZeroDevValidatorProviderProps {
  children: ReactNode;
}

export function ZeroDevValidatorProvider({
  children,
}: ZeroDevValidatorProviderProps) {
  const { disconnect } = useDisconnect();
  const [validator, setValidator] =
    useState<KernelValidator<EntryPoint> | null>(null);
  const [kernelAccount, setKernelAccount] =
    useState<KernelSmartAccount<EntryPoint> | null>(null);
  const [enableSignature, setEnableSignature] = useState<EnableSignaturesType>(
    {}
  );

  const updateEnableSignature = (
    permissionId: `0x${string}`,
    enableSignature: `0x${string}`
  ) => {
    setEnableSignature((prev) => {
      return {
        ...prev,
        [permissionId]: enableSignature,
      };
    });
  };

  const updateValidator = (validator: KernelValidator<EntryPoint> | null) => {
    setValidator(validator);
    // if (validator) {
    //   localStorage.setItem("kernel_validator", JSON.stringify(validator));
    // } else {
    //   localStorage.removeItem("kernel_validator");
    // }
  };

  const updateKernelAccount = (
    kernelAccount: KernelSmartAccount<EntryPoint> | null
  ) => {
    setKernelAccount(kernelAccount);
    // if (kernelAccount) {
    //   localStorage.setItem("kernel_account", JSON.stringify(kernelAccount));
    // } else {
    //   localStorage.removeItem("kernel_account");
    // }
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
          enableSignature,
          setEnableSignature: updateEnableSignature,
        }),
        [validator, kernelAccount, enableSignature]
      )}
    >
      {children}
    </ZeroDevValidatorContext.Provider>
  );
}
