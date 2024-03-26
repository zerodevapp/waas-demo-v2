import { useValidator } from "@/waas";
import { Button, Modal } from "@mantine/core";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { createKernelAccount } from "@zerodev/sdk";
import { walletClientToSmartAccountSigner } from "permissionless";
import { useEffect } from "react";
import { useConnect, usePublicClient, useWalletClient } from "wagmi";

export interface ConnectModalProps {
  open: boolean;
  onClose: () => void;
}

export function ConnectModal({ onClose, open }: ConnectModalProps) {
  const { setValidator, setKernelAccount } = useValidator();
  const titleId = "Connect";
  const { connectors, connect } = useConnect();
  const { data } = useWalletClient();
  const client = usePublicClient();

  useEffect(() => {
    const createValidator = async () => {
      if (!data || !client) return;
      const ecdsaValidator = await signerToEcdsaValidator(client, {
        signer: walletClientToSmartAccountSigner(data),
      });
      const account = await createKernelAccount(client, {
        plugins: {
          sudo: ecdsaValidator,
        },
      });
      setKernelAccount(account);
      setValidator(ecdsaValidator);
    };
    createValidator();
  }, [data, client]);

  return (
    <Modal opened={open} onClose={onClose} title={titleId}>
      <div className="flex flex-col items-center gap-2">
        {connectors.map((connector) => (
          <div key={connector.uid} className="w-full">
            <Button
              onClick={() => connect({ connector })}
              fullWidth
              variant="outline"
              style={{ justifyContent: "center" }}
            >
              {connector.name}
            </Button>
          </div>
        ))}
      </div>
    </Modal>
  );
}
