"use client";
import SessionBlock from "@/components/SessionBlock";
import SmartAccountBlock from "@/components/SmartAccountBlock";
import { ConnectButton, useValidator } from "@/waas";

export default function Home() {
  const { kernelAccount } = useValidator();

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
