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

  useEffect(() => {
    if (!validator && disconnect) disconnect();
  }, [validator, disconnect]);

  return (
    <ZeroDevValidatorContext.Provider
      value={useMemo(
        () => ({
          validator,
          setValidator,
          kernelAccount,
          setKernelAccount,
        }),
        [validator, kernelAccount]
      )}
    >
      {children}
    </ZeroDevValidatorContext.Provider>
  );
}
