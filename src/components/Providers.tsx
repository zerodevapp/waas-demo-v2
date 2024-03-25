"use client";
import { ZeroDevWaasProvider } from "@/waas";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { polygonMumbai } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export default function Providers({ children }: { children: ReactNode }) {
  const config = createConfig({
    chains: [polygonMumbai],
    connectors: [injected()],
    transports: {
      [polygonMumbai.id]: http(),
    },
  });
  const queryClient = new QueryClient();
  const zdAppId = process.env.NEXT_PUBLIC_ZERODEV_APP_ID || "";

  return (
    <MantineProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <ZeroDevWaasProvider appId={zdAppId}>{children}</ZeroDevWaasProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </MantineProvider>
  );
}
