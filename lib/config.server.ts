import invariant from 'tiny-invariant';

const privyAppSecret = process.env.PRIVY_APP_SECRET;
invariant(privyAppSecret, 'PRIVY_APP_SECRET not configured');
export const PRIVY_APP_SECRET = privyAppSecret;

const privyAuthorizationKeyRaw = process.env.PRIVY_AUTHORIZATION_KEY;
invariant(privyAuthorizationKeyRaw, 'PRIVY_AUTHORIZATION_KEY not configured');
export const PRIVY_AUTHORIZATION_KEY = privyAuthorizationKeyRaw.replace(
  /^wallet-auth:/,
  ''
);

const enclaveUrl = process.env.ENCLAVE_URL;
invariant(enclaveUrl, 'ENCLAVE_URL not configured');
export const ENCLAVE_URL = enclaveUrl;

const enclaveApiKey = process.env.ENCLAVE_API_KEY;
invariant(enclaveApiKey, 'ENCLAVE_API_KEY not configured');
export const ENCLAVE_API_KEY = enclaveApiKey;
