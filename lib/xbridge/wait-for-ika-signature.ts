import {
  Curve,
  type IkaClient,
  SignatureAlgorithm,
} from '@ika.xyz/sdk';

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const waitForIkaSignature = async (args: {
  ikaClient: IkaClient;
  signId: string;
  timeoutMs: number;
  intervalMs: number;
  signal: AbortSignal;
}): Promise<Uint8Array> => {
  const started = Date.now();
  let lastError: unknown = null;

  while (Date.now() - started < args.timeoutMs) {
    if (args.signal.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError');
    }

    try {
      const sign = await args.ikaClient.getSign(
        args.signId,
        Curve.ED25519,
        SignatureAlgorithm.EdDSA
      );

      const stateKind = sign.state.$kind;
      if (stateKind === 'Completed') {
        return new Uint8Array(sign.state.Completed.signature);
      }

      if (stateKind === 'NetworkRejected') {
        throw new Error('Bridge signature was rejected by the signing network');
      }
    } catch (caught) {
      lastError = caught;
      const message = caught instanceof Error ? caught.message : String(caught);
      if (/networkrejected|rejected by the signing network/i.test(message)) {
        throw caught;
      }
    }

    await sleep(args.intervalMs);
  }

  const reason =
    lastError instanceof Error
      ? ` Last error: ${lastError.message}`
      : lastError
        ? ` Last error: ${String(lastError)}`
        : '';
  throw new Error(`Timed out waiting for bridge signature.${reason}`);
};
