export const ZERODEV_APP_ID = process.env.NEXT_PUBLIC_ZERODEV_APP_ID || "";

export const ZERODEV_ARB_APP_ID =
  process.env.NEXT_PUBLIC_ZERODEV_APP_ARBITRUM_ID || "";

export const ZERODEV_SEP_APP_ID =
  process.env.NEXT_PUBLIC_ZERODEV_APP_SEPOLIA_ID || "";

export const ZERODEV_BUNDLER_URL = `https://rpc.zerodev.app/api/v2/bundler/${ZERODEV_APP_ID}`;

export const ZERODEV_PAYMASTER_URL = `https://rpc.zerodev.app/api/v2/paymaster/${ZERODEV_APP_ID}`;

export const getBundler = (chainId: number) => {
  if (chainId === 42161) {
    return `https://rpc.zerodev.app/api/v2/bundler/${ZERODEV_ARB_APP_ID}`;
  } else return `https://rpc.zerodev.app/api/v2/bundler/${ZERODEV_SEP_APP_ID}`;
};

export const getPaymaster = (chainId: number) => {
  if (chainId === 42161) {
    return `https://rpc.zerodev.app/api/v2/paymaster/${ZERODEV_ARB_APP_ID}`;
  } else if (chainId === 11155111) {
    return `https://rpc.zerodev.app/api/v2/paymaster/${ZERODEV_SEP_APP_ID}`;
  }
  return "";
};
