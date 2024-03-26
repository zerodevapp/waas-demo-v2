import {
  QueryFunction,
  QueryFunctionContext,
  useQuery,
} from "@tanstack/react-query";
import {
  ParamOperator,
  oneAddress,
  signerToSessionKeyValidator,
  type SessionKeyData,
  type SessionKeyPlugin,
} from "@zerodev/session-key";
// import { type SmartAccountSigner } from "permissionless/accounts";
import { createKernelAccount } from "@zerodev/sdk";
import { useEffect, useState } from "react";
import { PublicClient, parseAbi, type Abi, type Address } from "viem";
import {
  generatePrivateKey,
  privateKeyToAccount,
  privateKeyToAddress,
} from "viem/accounts";
import { usePublicClient } from "wagmi";
import { useValidator } from "..";
import { useAppId } from "./useAppId";

type SessionPermissionKey = [
  key: string,
  params: {
    address: Address | undefined | null;
    appId: string | undefined | null;
    client: PublicClient | undefined | null;
  }
];

export type SessionPermission = {
  signer: Address;
  validatorData?: SessionKeyData<Abi>;
  entryPoint?: Address;
  validatorAddress?: Address;
};

type fetchPermissionRes = {
  permissions?: SessionPermission;
  isExpired: boolean;
  validator?: SessionKeyPlugin;
};

type useSessionPermissionRes = {
  permissions?: SessionPermission;
  validator?: SessionKeyPlugin;
  isExpired?: boolean;
  isLoading: boolean;
  error: any;
};

export function getSessionKey(): `0x${string}` | null {
  const sessionKey = localStorage.getItem("kernel_session_key");
  if (sessionKey && sessionKey.startsWith("0x")) {
    return sessionKey as `0x${string}`;
  } else {
    return null;
  }
}

export function setSessionKey(sessionKey: `0x${string}` | null) {
  if (!sessionKey) localStorage.removeItem("kernel_session_key");
  else localStorage.setItem("kernel_session_key", sessionKey);
}

export function createSessionKey() {
  const sessionKey = generatePrivateKey();
  setSessionKey(sessionKey);
  return sessionKey;
}

async function getSessionValidator({
  smartAccountAddress,
  permissions,
  sessionKey,
  client,
}: {
  smartAccountAddress: Address;
  permissions: SessionPermission;
  sessionKey: `0x${string}` | null;
  client: PublicClient;
}) {
  const isKeyExpired =
    !sessionKey || privateKeyToAddress(sessionKey) !== permissions?.signer;

  if (isKeyExpired)
    return {
      permissions: permissions,
      isExpired: isKeyExpired,
    };
  const sessionSigner = privateKeyToAccount(sessionKey);
  const sessionValidator = await signerToSessionKeyValidator(client, {
    ...permissions,
    signer: sessionSigner,
  });
  const isEnabled = await sessionValidator.isEnabled(
    smartAccountAddress,
    sessionSigner.address
  );
  return {
    permissions: permissions,
    isExpired: !isEnabled,
    validator: sessionValidator,
  };
}

async function fetchPermission({
  queryKey,
}: QueryFunctionContext<SessionPermissionKey>): Promise<fetchPermissionRes> {
  const [_key, { appId, address, client }] = queryKey;

  const sessionKey = getSessionKey();

  if (!sessionKey || !address || !client) {
    throw new Error("Session key, address, and client are required");
  }

  // mock permission
  const signerAddress = sessionKey
    ? privateKeyToAddress(sessionKey)
    : (address as Address);
  const masterAccountAddress = address;
  const contractAddress = "0x34bE7f35132E97915633BC1fc020364EA5134863";
  const contractABI = parseAbi([
    "function mint(address _to) public",
    "function balanceOf(address owner) external view returns (uint256 balance)",
  ]);
  const permissions = {
    signer: signerAddress,
    validatiorData: {
      paymaster: oneAddress,
      permissions: [
        {
          target: contractAddress,
          // Maximum value that can be transferred.  In this case we
          // set it to zero so that no value transfer is possible.
          valueLimit: BigInt(0),
          // Contract abi
          abi: contractABI,
          // Function name
          functionName: "mint",
          // An array of conditions, each corresponding to an argument for
          // the function.
          args: [
            {
              // In this case, we are saying that the session key can only mint
              // NFTs to the account itself
              operator: ParamOperator.EQUAL,
              value: masterAccountAddress,
            },
          ],
        },
      ],
    },
  };

  if (!permissions) {
    return {
      permissions: permissions,
      isExpired: false,
    };
  }
  return getSessionValidator({
    smartAccountAddress: address,
    permissions: permissions,
    sessionKey: sessionKey,
    client: client,
  });
}

export function useSessionPermission(): useSessionPermissionRes {
  const { appId } = useAppId();
  const { validator } = useValidator();
  const [address, setAddress] = useState<string | undefined>();
  const client = usePublicClient();

  useEffect(() => {
    const getAddress = async () => {
      if (!validator || !client) return;
      const account = await createKernelAccount(client, {
        plugins: {
          sudo: validator,
        },
      });
      const smartAccountAddress = account.address;
      setAddress(smartAccountAddress);
    };
    getAddress();
  }, [validator, client]);

  const {
    data: sessionPermission,
    isLoading,
    error,
  } = useQuery<SessionPermissionKey>({
    queryKey: ["session_permission", { appId, address, client }],
    queryFn: fetchPermission as unknown as QueryFunction<
      SessionPermissionKey,
      any,
      any
    >,
    enabled: !!appId && !!address && !!client,
  });

  return {
    ...sessionPermission,
    isLoading,
    error,
  };
}
