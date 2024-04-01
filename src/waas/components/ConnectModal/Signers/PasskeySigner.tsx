import { useAppId, useValidator } from "@/waas";
import { getEntryPoint } from "@/waas/utils/entryPoint";
import { Button, Flex, TextInput } from "@mantine/core";
import {
  WEBAUTHN_VALIDATOR_ADDRESS_V07,
  createPasskeyValidator,
  getPasskeyValidator,
} from "@zerodev/passkey-validator";
import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";

export default function PasskeySigner() {
  const { setValidator } = useValidator();
  const { appId } = useAppId();
  const [username, setUsername] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const client = usePublicClient();

  useEffect(() => {
    setIsRegistering(false);
    setIsLoggingIn(false);
  }, []);

  const handleRegister = async () => {
    setIsRegistering(true);

    try {
      const passkeyValidator = await createPasskeyValidator(client!, {
        passkeyName: username,
        passkeyServerUrl: `https://passkeys.zerodev.app/api/v3/${appId!}`,
        entryPoint: getEntryPoint(),
        validatorAddress: WEBAUTHN_VALIDATOR_ADDRESS_V07,
      });
      setValidator(passkeyValidator);
    } catch (err) {
      setIsRegistering(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);

    try {
      const passkeyValidator = await getPasskeyValidator(client!, {
        passkeyServerUrl: `https://passkeys.zerodev.app/api/v3/${appId!}`,
        entryPoint: getEntryPoint(),
        validatorAddress: WEBAUTHN_VALIDATOR_ADDRESS_V07,
      });
      setValidator(passkeyValidator);
    } catch (err) {
      setIsLoggingIn(false);
    }
  };

  return (
    <Flex justify="between" align="center" style={{ width: "100%" }}>
      <Flex
        flex={1}
        direction="column"
        align="center"
        style={{ padding: "3px" }}
      >
        <TextInput
          value={username}
          onChange={(event) => setUsername(event.currentTarget.value)}
          placeholder="Passkey Name"
          style={{ marginBottom: "3px", padding: "3px" }}
        />
        <Button
          variant="outline"
          style={{ padding: "3px" }}
          loading={isRegistering}
          disabled={isRegistering || !client || !username || !appId}
          onClick={() => handleRegister()}
        >
          Register
        </Button>
      </Flex>

      <Flex flex={1} justify="center" style={{ padding: "5px" }}>
        <Button
          variant="outline"
          style={{ marginLeft: "3px", padding: "3px" }}
          loading={isLoggingIn}
          disabled={isLoggingIn || !appId}
          onClick={() => handleLogin()}
        >
          Login
        </Button>
      </Flex>
    </Flex>
  );
}
