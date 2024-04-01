import { type Policy } from "@zerodev/permission-validator";
import { generatePrivateKey } from "viem/accounts";
import {
  desirializePolicy,
  serializePolicy,
  type EncodedSessionType,
} from "./encodeSessionPolicy";

export type SessionInfoType = {
  smartAccount: `0x${string}`;
  enableSignature: `0x${string}`;
  policies: Policy[];
  sessionKey: `0x${string}`;
};

export type SessionType = {
  [permissionId: `0x${string}`]: SessionInfoType;
};

export function createSessionKey() {
  return generatePrivateKey();
}

export function createSession(
  permissionId: `0x${string}`,
  smartAccount: `0x${string}`,
  enableSignature: `0x${string}`,
  policies: Policy[],
  sessionKey: `0x${string}`
) {
  let sessionKeyStorage: EncodedSessionType = {};
  try {
    sessionKeyStorage = JSON.parse(
      localStorage.getItem(`kernel_session`) || "{}"
    );
  } catch (err) {}

  sessionKeyStorage[permissionId] = {
    smartAccount,
    enableSignature,
    policies: serializePolicy(policies),
    sessionKey,
  };
  localStorage.setItem(`kernel_session`, JSON.stringify(sessionKeyStorage));
}

export function getAllSession(): SessionType | null {
  const sessionKey = localStorage.getItem(`kernel_session`);
  if (!sessionKey) return null;

  const encodedSession: EncodedSessionType = JSON.parse(sessionKey);

  let session: SessionType = {};
  for (const [permissionId, encodedSessionInfo] of Object.entries(
    encodedSession
  )) {
    session[permissionId as `0x${string}`] = {
      smartAccount: encodedSessionInfo.smartAccount,
      enableSignature: encodedSessionInfo.enableSignature,
      policies: encodedSessionInfo.policies.map(desirializePolicy),
      sessionKey: encodedSessionInfo.sessionKey,
    };
  }
  return session;
}

export function getSession(
  permissionId: `0x${string}` | undefined
): SessionInfoType | null {
  const sessionKey = getAllSession();
  if (!sessionKey || !permissionId) return null;

  return sessionKey[permissionId];
}
