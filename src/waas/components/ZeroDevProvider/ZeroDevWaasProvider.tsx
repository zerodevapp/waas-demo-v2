import { ReactNode } from "react";
import { type Chain } from "viem";
import { ModalProvider } from "./ModalContext";
import { SessionProvider } from "./SessionContext";
import { ZeroDevAppProvider } from "./ZeroDevAppContext";
import { ZeroDevValidatorProvider } from "./ZeroDevValidatorContext";

export interface ZeroDevWaasProviderProps {
  appId: string | null;
  chain: Chain | null;
  children: ReactNode;
}

export function ZeroDevWaasProvider({
  children,
  appId,
  chain,
}: ZeroDevWaasProviderProps) {
  return (
    <ZeroDevAppProvider appId={appId} chain={chain}>
      <ZeroDevValidatorProvider>
        <SessionProvider>
          <ModalProvider>{children}</ModalProvider>
        </SessionProvider>
      </ZeroDevValidatorProvider>
    </ZeroDevAppProvider>
  );
}
