import invariant from 'tiny-invariant';

const privyAppSecret = process.env.PRIVY_APP_SECRET;
invariant(privyAppSecret, 'PRIVY_APP_SECRET not configured');
export const PRIVY_APP_SECRET = privyAppSecret;

const enclaveUrl = process.env.ENCLAVE_URL;
invariant(enclaveUrl, 'ENCLAVE_URL not configured');
export const ENCLAVE_URL = enclaveUrl;
