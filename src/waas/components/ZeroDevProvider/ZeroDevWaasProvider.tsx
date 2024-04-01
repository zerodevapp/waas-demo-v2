import { ReactNode } from "react";
import { ModalProvider } from "./ModalContext";
import { SessionProvider } from "./SessionContext";
import { ZeroDevAppProvider } from "./ZeroDevAppContext";
import { ZeroDevValidatorProvider } from "./ZeroDevValidatorContext";

export interface ZeroDevWaasProviderProps {
  appId: string | null;
  children: ReactNode;
}

export function ZeroDevWaasProvider({
  children,
  appId,
}: ZeroDevWaasProviderProps) {
  return (
    <ZeroDevAppProvider appId={appId}>
      <ZeroDevValidatorProvider>
        <SessionProvider>
          <ModalProvider>{children}</ModalProvider>
        </SessionProvider>
      </ZeroDevValidatorProvider>
    </ZeroDevAppProvider>
  );
}
