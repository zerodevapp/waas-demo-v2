import { useValidator } from "@/waas";
import { Button, Modal } from "@mantine/core";
import { createKernelAccount } from "@zerodev/sdk";
import { useEffect } from "react";
import { JsonRpcAccount, PublicClient } from "viem";
import type { Config } from "wagmi";
import {
  useAccount,
  useConfig,
  useConnect,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import { signerToEcdsaValidator } from "../../kernel/toECDSAValidatorPlugin";

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
  const { chain } = useAccount();
  const config = useConfig();

  useEffect(() => {
    const createValidator = async (
      client: PublicClient,
      signer: JsonRpcAccount,
      config: Config
    ) => {
      const ecdsaValidator = await signerToEcdsaValidator(client, {
        config,
        signer,
      });
      const account = await createKernelAccount(client, {
        plugins: {
          sudo: ecdsaValidator,
        },
      });
      setKernelAccount(account);
      setValidator(ecdsaValidator);
    };
    const account = data?.account;
    if (account && client && config) {
      createValidator(client, account as JsonRpcAccount, config);
    }
  }, [data, setValidator, chain, client, config]);

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
