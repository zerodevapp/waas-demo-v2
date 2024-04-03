import { useCreateKernelClientPasskey } from "@/waas";
import { Button, Flex, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { KernelVersionType } from "../../../types";

export default function PasskeySigner({
  version,
}: {
  version: KernelVersionType;
}) {
  const [username, setUsername] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { connectRegister, connectLogin, error } = useCreateKernelClientPasskey(
    { version: version }
  );

  useEffect(() => {
    setIsRegistering(false);
    setIsLoggingIn(false);
  }, [error]);

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
          disabled={isRegistering || !username}
          onClick={() => {
            setIsRegistering(true);
            connectRegister({ username });
          }}
        >
          Register
        </Button>
      </Flex>

      <Flex flex={1} justify="center" style={{ padding: "5px" }}>
        <Button
          variant="outline"
          style={{ marginLeft: "3px", padding: "3px" }}
          loading={isLoggingIn}
          disabled={isLoggingIn}
          onClick={() => {
            setIsLoggingIn(true);
            connectLogin();
          }}
        >
          Login
        </Button>
      </Flex>
    </Flex>
  );
}
