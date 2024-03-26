import { useSessionPermission, useValidator } from "@/waas";
import { Button } from "@mantine/core";
import { createKernelAccount } from "@zerodev/sdk";
import { useEffect, useState } from "react";
import { useConnect, usePublicClient } from "wagmi";
import { ConnectStep } from "./ConnectModal";
import ECDSASigner from "./Signers/ECDSASigner";
import PasskeySigner from "./Signers/PasskeySigner";

export enum SignerType {
  None = "NONE",
  ECDSA = "ECDSA",
  Passkey = "PASSKEY",
}

export default function ConnectSigner({
  setConnectStep,
}: {
  setConnectStep: (step: ConnectStep) => void;
}) {
  const { connectors, connect, error } = useConnect();
  const [signerStep, setSignerStep] = useState<SignerType>(SignerType.None);
  const { validator, setKernelAccount } = useValidator();
  const { isExpired } = useSessionPermission();
  const client = usePublicClient();

  useEffect(() => {
    if (error) setSignerStep(SignerType.None);
  }, [error]);

  useEffect(() => {
    const handleSession = async () => {
      if (isExpired) setConnectStep(ConnectStep.Permission);
      else if (isExpired === false && client && validator) {
        const account = await createKernelAccount(client, {
          plugins: {
            sudo: validator,
          },
        });
        setKernelAccount(account);
      }
    };
    handleSession();
  }, [isExpired, client, validator]);

  return (
    <div className="flex flex-col items-center gap-2">
      {signerStep === SignerType.None &&
        connectors.map((connector) => (
          <div key={connector.uid} className="w-full">
            <Button
              onClick={() => {
                connect({ connector });
                setSignerStep(SignerType.ECDSA);
              }}
              fullWidth
              variant="outline"
              style={{ justifyContent: "center" }}
            >
              {connector.name}
            </Button>
          </div>
        ))}
      {signerStep === SignerType.ECDSA && <ECDSASigner />}
      {signerStep === SignerType.Passkey && <PasskeySigner />}
    </div>
  );
}
