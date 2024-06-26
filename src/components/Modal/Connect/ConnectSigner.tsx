import { Button, Title } from "@mantine/core";
import {
  useCreateKernelClientEOA,
  type KernelVersionType,
} from "@zerodev/waas";
import { useEffect, useState } from "react";
import { useConnect } from "wagmi";
import ECDSASigner from "./Signers/ECDSASigner";
import PasskeySigner from "./Signers/PasskeySigner";

export enum SignerType {
  None = "NONE",
  ECDSA = "ECDSA",
  Passkey = "PASSKEY",
}

export default function ConnectSigner({
  version,
  loginWithSocial,
}: {
  version: KernelVersionType;
  loginWithSocial: (provider: "google" | "facebook") => void;
}) {
  const { connectors } = useConnect();
  const [signerStep, setSignerStep] = useState<SignerType>(SignerType.None);
  const { connect, error } = useCreateKernelClientEOA({ version });
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);

  useEffect(() => {
    if (error) setSignerStep(SignerType.None);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-2">
      {signerStep === SignerType.None && (
        <>
          <Title order={5} style={{ color: "black" }}>
            EOA
          </Title>
          {connectors.map((connector) => (
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
          <Title order={5} style={{ color: "black" }}>
            Social
          </Title>
          <Button
            fullWidth
            variant="outline"
            style={{ justifyContent: "center" }}
            loading={isGoogleLoading}
            onClick={() => {
              setIsGoogleLoading(true);
              loginWithSocial("google");
            }}
          >
            Google
          </Button>
          <Button
            fullWidth
            variant="outline"
            style={{ justifyContent: "center" }}
            onClick={() => {
              setIsFacebookLoading(true);
              loginWithSocial("facebook");
            }}
            loading={isFacebookLoading}
          >
            Facebook
          </Button>
          <Title order={5} style={{ color: "black" }}>
            Passkey
          </Title>
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
      {signerStep === SignerType.Passkey && <PasskeySigner version={version} />}
    </div>
  );
}
