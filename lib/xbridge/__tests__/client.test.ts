import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api/client', () => ({
  post: vi.fn(),
}));

const { post } = await import('@/lib/api/client');
const mockPost = vi.mocked(post);

const {
  bridgeMint,
  bridgeBurnCreate,
  bridgeBurnVote,
  bridgeBurnSign,
  bridgeBurnFinalize,
} = await import('../client');

describe('xbridge/client', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  describe('bridgeMint', () => {
    it('calls POST /api/xbridge/bridge-mint with correct params', async () => {
      const mockResult = {
        digest: 'd1',
        requestId: 'r1',
        mintCapId: 'm1',
        createDigest: 'cd1',
      };
      mockPost.mockResolvedValue(mockResult);

      const params = {
        userId: 'user-1',
        sourceChain: 1,
        sourceToken: [1, 2, 3],
        sourceDecimals: 9,
        sourceAddress: [4, 5, 6],
        sourceAmount: '1000000000',
        coinType: '0x2::sui::SUI',
        depositSignature: 'sig123',
      };

      const result = await bridgeMint(params);

      expect(result).toEqual(mockResult);
      expect(mockPost).toHaveBeenCalledWith(
        '/api/xbridge/bridge-mint',
        params,
        { timeout: 30_000, retries: 0 }
      );
    });
  });

  describe('bridgeBurnCreate', () => {
    it('calls POST /api/xbridge/bridge-burn/create with correct params', async () => {
      const mockResult = {
        createDigest: 'cd1',
        requestId: 'r1',
        burnCapId: 'b1',
        presignCapId: 'p1',
        suiWalletId: 'w1',
        userSignature: 'usig1',
        message: 'msg1',
      };
      mockPost.mockResolvedValue(mockResult);

      const params = {
        userId: 'user-1',
        sourceAmount: '500000000',
        destinationAddress: [7, 8, 9],
        nonceAddress: 'nonce123',
        coinType: '0x2::sui::SUI',
      };

      const result = await bridgeBurnCreate(params);

      expect(result).toEqual(mockResult);
      expect(mockPost).toHaveBeenCalledWith(
        '/api/xbridge/bridge-burn/create',
        params,
        { timeout: 30_000, retries: 0 }
      );
    });
  });

  describe('bridgeBurnVote', () => {
    it('calls POST /api/xbridge/bridge-burn/vote with correct params', async () => {
      const mockResult = { signature: 'vsig1', timestampMs: 1700000000000 };
      mockPost.mockResolvedValue(mockResult);

      const params = {
        userId: 'user-1',
        requestId: 'r1',
        coinType: '0x2::sui::SUI',
      };

      const result = await bridgeBurnVote(params);

      expect(result).toEqual(mockResult);
      expect(mockPost).toHaveBeenCalledWith(
        '/api/xbridge/bridge-burn/vote',
        params,
        { timeout: 20_000, retries: 0 }
      );
    });
  });

  describe('bridgeBurnSign', () => {
    it('calls POST /api/xbridge/bridge-burn/sign with 120s timeout', async () => {
      const mockResult = { solverSignature: 'ssig1' };
      mockPost.mockResolvedValue(mockResult);

      const params = {
        userId: 'user-1',
        requestId: 'r1',
        coinType: '0x2::sui::SUI',
        presignCapId: 'p1',
      };

      const result = await bridgeBurnSign(params);

      expect(result).toEqual(mockResult);
      expect(mockPost).toHaveBeenCalledWith(
        '/api/xbridge/bridge-burn/sign',
        params,
        { timeout: 120_000, retries: 0 }
      );
    });
  });

  describe('bridgeBurnFinalize', () => {
    it('calls POST /api/xbridge/bridge-burn/finalize with correct params', async () => {
      const mockResult = { executeDigest: 'ed1', signId: 's1' };
      mockPost.mockResolvedValue(mockResult);

      const params = {
        userId: 'user-1',
        requestId: 'r1',
        burnCapId: 'b1',
        presignCapId: 'p1',
        coinType: '0x2::sui::SUI',
        voteSignature: 'vsig1',
        voteTimestampMs: 1700000000000,
        solverSignature: 'ssig1',
      };

      const result = await bridgeBurnFinalize(params);

      expect(result).toEqual(mockResult);
      expect(mockPost).toHaveBeenCalledWith(
        '/api/xbridge/bridge-burn/finalize',
        params,
        { timeout: 30_000, retries: 0 }
      );
    });
  });

  describe('all functions use retries: 0', () => {
    it('none of the bridge operations use automatic retries', async () => {
      mockPost.mockResolvedValue({});

      await bridgeMint({
        userId: 'u',
        sourceChain: 1,
        sourceToken: [],
        sourceDecimals: 9,
        sourceAddress: [],
        sourceAmount: '0',
        coinType: 'c',
        depositSignature: 's',
      });

      await bridgeBurnCreate({
        userId: 'u',
        sourceAmount: '0',
        destinationAddress: [],
        nonceAddress: 'n',
        coinType: 'c',
      });

      await bridgeBurnVote({ userId: 'u', requestId: 'r', coinType: 'c' });

      await bridgeBurnSign({
        userId: 'u',
        requestId: 'r',
        coinType: 'c',
        presignCapId: 'p',
      });

      await bridgeBurnFinalize({
        userId: 'u',
        requestId: 'r',
        burnCapId: 'b',
        presignCapId: 'p',
        coinType: 'c',
        voteSignature: 'v',
        voteTimestampMs: 0,
        solverSignature: 's',
      });

      for (const call of mockPost.mock.calls) {
        expect(call[2]).toEqual(
          expect.objectContaining({ retries: 0 })
        );
      }
    });
  });
});
