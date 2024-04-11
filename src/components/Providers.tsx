"use client";
import { ZeroDevWaasProvider } from "@/waas";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { PaymasterProvider } from "./Paymaster/PaymasterProvider";

export default function Providers({ children }: { children: ReactNode }) {
  const config = createConfig({
    chains: [sepolia],
    connectors: [injected()],
    transports: {
      [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL || ""),
    },
  });
  const queryClient = new QueryClient();
  const zdAppId = process.env.NEXT_PUBLIC_ZERODEV_APP_ID || "";

  return (
    <MantineProvider>
      <Notifications />
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <ZeroDevWaasProvider appId={zdAppId} chain={sepolia}>
            <PaymasterProvider>{children}</PaymasterProvider>
          </ZeroDevWaasProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </MantineProvider>
  );
}
