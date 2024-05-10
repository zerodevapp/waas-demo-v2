"use client";
import { getBundler } from "@/utils/constants";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ZeroDevProvider, createConfig as createZdConfig } from "@zerodev/waas";
import { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { arbitrum, sepolia } from "wagmi/chains";
import { ModalProvider } from "./ModalProvider";
import { PaymasterProvider } from "./PaymasterProvider";

export default function Providers({ children }: { children: ReactNode }) {
  const config = createConfig({
    chains: [sepolia, arbitrum],
    transports: {
      [sepolia.id]: http(getBundler(sepolia.id)),
      [arbitrum.id]: http(getBundler(arbitrum.id)),
    },
  });
  const queryClient = new QueryClient();
  const zdConfig = createZdConfig({
    chains: [arbitrum, sepolia],
    projectIds: {
      [arbitrum.id]: process.env.NEXT_PUBLIC_ZERODEV_APP_ARBITRUM_ID || "",
      [sepolia.id]: process.env.NEXT_PUBLIC_ZERODEV_APP_SEPOLIA_ID || "",
    },
    transports: {
      [arbitrum.id]: http(getBundler(arbitrum.id)),
      [sepolia.id]: http(getBundler(sepolia.id)),
    },
  });

  return (
    <MantineProvider>
      <Notifications />
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <ZeroDevProvider config={zdConfig}>
            <PaymasterProvider>
              <ModalProvider>{children}</ModalProvider>
            </PaymasterProvider>
          </ZeroDevProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </MantineProvider>
  );
}
