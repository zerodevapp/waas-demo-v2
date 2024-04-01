"use client";
import SessionBlock from "@/components/SessionBlock";
import SmartAccountBlock from "@/components/SmartAccountBlock";
import { ConnectButton, useKernelAccount } from "@/waas";

export default function Home() {
  const { kernelAccount } = useKernelAccount();

  return (
    <div className="flex flex-col justify-center items-center h-screen">
      {!kernelAccount ? (
        <ConnectButton />
      ) : (
        <>
          <SmartAccountBlock />
          <SessionBlock />
        </>
      )}
    </div>
  );
}
