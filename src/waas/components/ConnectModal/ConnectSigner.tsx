import { useValidator } from "@/waas";
import { Button, Title } from "@mantine/core";
import { createKernelAccount } from "@zerodev/sdk";
import { useEffect, useState } from "react";
import { useAccount, useConnect, usePublicClient } from "wagmi";
import { getEntryPoint } from "../../utils/entryPoint";
import ECDSASigner from "./Signers/ECDSASigner";
import PasskeySigner from "./Signers/PasskeySigner";

export enum SignerType {
  None = "NONE",
  ECDSA = "ECDSA",
  Passkey = "PASSKEY",
}

export default function ConnectSigner() {
  const { connectors, connect, error } = useConnect();
  const [signerStep, setSignerStep] = useState<SignerType>(SignerType.None);
  const { validator, setKernelAccount } = useValidator();
  const client = usePublicClient();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (error) setSignerStep(SignerType.None);
  }, [error]);

  useEffect(() => {
    const handleCreateAccount = async () => {
      if (client && validator) {
        const account = await createKernelAccount(client, {
          entryPoint: getEntryPoint(),
          plugins: {
            sudo: validator,
            entryPoint: getEntryPoint(),
          },
        });
        setKernelAccount(account);
      }
    };
    handleCreateAccount();
  }, [client, validator, setKernelAccount]);

  return (
    <div className="flex flex-col items-center gap-2">
      {signerStep === SignerType.None && (
        <>
          <Title order={5}>EOA</Title>
          {connectors.map((connector) => (
            <div key={connector.uid} className="w-full">
              <Button
                onClick={() => {
                  if (!isConnected) connect({ connector });
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
          <Title order={5}>Passkey</Title>
          <Button
            variant="outline"
            style={{ justifyContent: "center" }}
            onClick={() => setSignerStep(SignerType.Passkey)}
          >
            Use Passkey
          </Button>
        </>
      )}
      {signerStep === SignerType.ECDSA && <ECDSASigner />}
      {signerStep === SignerType.Passkey && <PasskeySigner />}
    </div>
  );
}
