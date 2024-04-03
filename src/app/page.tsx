"use client";
import SessionBlock from "@/components/SessionBlock";
import SmartAccountBlock from "@/components/SmartAccountBlock";
import { ConnectButton, useKernelAccount } from "@/waas";
import { Switch, Text } from "@mantine/core";
import { useState } from "react";

export default function Home() {
  const { kernelAccount } = useKernelAccount();
  const [checked, setChecked] = useState(true);

  return (
    <div className="flex flex-col h-screen justify-center items-center">
      <div className="flex flex-col justify-center items-center absolute top-20 w-full">
        <Switch
          size="lg"
          onLabel="v3"
          offLabel="v2"
          checked={checked}
          onChange={(event) => setChecked(event.currentTarget.checked)}
          className="mb-4"
        />
        <Text size="xs">Please reconnect after version switched</Text>
      </div>
      <>
        {!kernelAccount ? (
          <ConnectButton version={checked ? "v3" : "v2"} />
        ) : (
          <>
            <SmartAccountBlock />
            <SessionBlock />
          </>
        )}
      </>
    </div>
  );
}
