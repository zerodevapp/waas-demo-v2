import {
  KernelAccountClient,
  KernelSmartAccount,
  KernelValidator,
} from "@zerodev/sdk";
import { EntryPoint } from "permissionless/types";
import { ReactNode, createContext, useEffect, useMemo, useState } from "react";
import { useDisconnect } from "wagmi";

interface ZeroDevValidatorValue {
  validator: KernelValidator<EntryPoint> | null;
  setValidator: (validator: KernelValidator<EntryPoint> | null) => void;
  kernelAccount: KernelSmartAccount<EntryPoint> | null;
  setKernelAccount: (
    kernelAccount: KernelSmartAccount<EntryPoint> | null
  ) => void;
  kernelAccountClient: KernelAccountClient<EntryPoint> | null;
  setKernelAccountClient: (
    kernelAccountClient: KernelAccountClient<EntryPoint> | null
  ) => void;
  entryPoint: EntryPoint | null;
  setEntryPoint: (entryPoint: EntryPoint | null) => void;
}

export const ZeroDevValidatorContext = createContext<ZeroDevValidatorValue>({
  validator: null,
  setValidator: () => {},
  kernelAccount: null,
  setKernelAccount: () => {},
  kernelAccountClient: null,
  setKernelAccountClient: () => {},
  entryPoint: null,
  setEntryPoint: () => {},
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
  const [kernelAccountClient, setKernelAccountClient] =
    useState<KernelAccountClient<EntryPoint> | null>(null);
  const [entryPoint, setEntryPoint] = useState<EntryPoint | null>(null);

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

  const updateKernelAccountClient = (
    kernelAccountClient: KernelAccountClient<EntryPoint> | null
  ) => {
    if (!kernelAccountClient) {
      setKernelAccountClient(null);
      return;
    }
    const account = kernelAccountClient.account;
    if (account) {
      setKernelAccountClient(kernelAccountClient);
      setEntryPoint(account.entryPoint);
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
          kernelAccountClient,
          setKernelAccountClient: updateKernelAccountClient,
          entryPoint,
          setEntryPoint,
        }),
        [validator, kernelAccount, kernelAccountClient, entryPoint]
      )}
    >
      {children}
    </ZeroDevValidatorContext.Provider>
  );
}
