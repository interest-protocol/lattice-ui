import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { usePrivy } from '@privy-io/react-auth';
import Image from 'next/image';
import { type FC, useState } from 'react';

import { toasting } from '@/components/ui/toast';
import { CHAIN_KEYS, CHAIN_REGISTRY, type ChainKey } from '@/constants/chains';
import { CHAIN_TOKENS } from '@/constants/chains/chain-tokens';
import { SOL_TYPE } from '@/constants/coins';
import useSolanaBalances from '@/hooks/blockchain/use-solana-balances';
import useSuiBalances from '@/hooks/blockchain/use-sui-balances';
import useWalletAddresses from '@/hooks/domain/use-wallet-addresses';
import { useModal } from '@/hooks/store/use-modal';
import { FixedPointMath } from '@/lib/entities/fixed-point-math';
import { sendTokens } from '@/lib/wallet/client';
import { extractErrorMessage, formatMoney } from '@/utils';

const SendModal: FC = () => {
  const { authenticated, user } = usePrivy();
  const handleClose = useModal((s) => s.handleClose);
  const { getAddress } = useWalletAddresses();
  const suiAddress = getAddress('sui');
  const solanaAddress = getAddress('solana');

  const [network, setNetwork] = useState<ChainKey>('solana');
  const [selectedTokenIndex, setSelectedTokenIndex] = useState(0);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);

  const tokens = CHAIN_TOKENS[network];
  const selectedToken = tokens[selectedTokenIndex];
  const config = CHAIN_REGISTRY[network];

  const { balances: suiBalances, isLoading: suiLoading } =
    useSuiBalances(suiAddress);
  const { balances: solanaBalances, isLoading: solLoading } =
    useSolanaBalances(solanaAddress);

  const getBalance = (): bigint => {
    if (network === 'sui') {
      return selectedTokenIndex === 0 ? suiBalances.sui : suiBalances.wsol;
    }
    return selectedTokenIndex === 0 ? solanaBalances.sol : solanaBalances.wsui;
  };

  const isLoading = network === 'sui' ? suiLoading : solLoading;
  const balance = getBalance();
  const balanceFormatted = formatMoney(
    FixedPointMath.toNumber(balance, selectedToken.decimals)
  );

  const setMaxAmount = () => {
    setAmount(
      FixedPointMath.toNumber(balance, selectedToken.decimals).toString()
    );
  };

  const isNativeToken = (type: string, chain: ChainKey): boolean =>
    chain === 'sui' ? type === SUI_TYPE_ARG : type === SOL_TYPE;

  const handleSend = async () => {
    if (!authenticated) {
      toasting.error({ action: 'Send', message: 'Please connect your wallet' });
      return;
    }
    if (!recipient || !amount) {
      toasting.error({ action: 'Send', message: 'Please fill in all fields' });
      return;
    }
    if (!user?.id) {
      toasting.error({ action: 'Send', message: 'Not authenticated' });
      return;
    }

    setSending(true);
    const dismiss = toasting.loading({
      message: `Sending ${selectedToken.symbol}...`,
    });
    try {
      const rawAmount = FixedPointMath.toBigNumber(
        Number.parseFloat(amount),
        selectedToken.decimals
      ).toString();

      await sendTokens(network, {
        userId: user.id,
        recipient,
        amount: rawAmount,
        tokenType: isNativeToken(selectedToken.type, network)
          ? undefined
          : selectedToken.type,
      });

      dismiss();
      toasting.success({
        action: 'Send',
        message: `${amount} ${selectedToken.symbol} sent`,
      });
      handleClose();
    } catch (error) {
      dismiss();
      toasting.error({
        action: 'Send',
        message: extractErrorMessage(error, 'Transaction failed'),
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Network Selection */}
      <div>
        <span className="text-text-secondary text-sm font-medium mb-2 block">
          Network
        </span>
        <div className="flex gap-2">
          {CHAIN_KEYS.map((net) => {
            const isSelected = net === network;
            return (
              <button
                key={net}
                type="button"
                className="flex-1 p-3 flex items-center justify-center gap-2 cursor-pointer rounded-lg transition-all duration-200"
                style={{
                  border: `1px solid ${isSelected ? 'var(--color-accent-border)' : 'var(--color-surface-border)'}`,
                  background: isSelected
                    ? 'var(--color-accent-wash)'
                    : 'var(--color-surface-light)',
                }}
                onClick={() => {
                  setNetwork(net);
                  setSelectedTokenIndex(0);
                }}
              >
                <span className="text-text font-semibold capitalize">
                  {CHAIN_REGISTRY[net].displayName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Token Selection */}
      <div>
        <span className="text-text-secondary text-sm font-medium mb-2 block">
          Token
        </span>
        <div className="flex gap-2">
          {tokens.map((token, index) => {
            const isSelected = index === selectedTokenIndex;
            return (
              <button
                key={token.type}
                type="button"
                className="flex-1 p-3 flex items-center justify-center gap-2 cursor-pointer rounded-lg transition-all duration-200"
                style={{
                  border: `1px solid ${isSelected ? 'var(--color-accent-border)' : 'var(--color-surface-border)'}`,
                  background: isSelected
                    ? 'var(--color-accent-wash)'
                    : 'var(--color-surface-light)',
                }}
                onClick={() => setSelectedTokenIndex(index)}
              >
                {token.iconUrl && (
                  <Image
                    src={token.iconUrl}
                    alt={token.symbol}
                    width={20}
                    height={20}
                    style={{ borderRadius: '50%' }}
                  />
                )}
                <span className="text-text font-semibold">{token.symbol}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recipient Address */}
      <div>
        <span className="text-text-secondary text-sm font-medium mb-2 block">
          Recipient Address
        </span>
        <input
          className="w-full p-4 text-text bg-surface-inset rounded-lg border border-surface-border font-mono text-sm outline-none focus:border-accent-border transition-all duration-200"
          placeholder={config.addressPlaceholder}
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
      </div>

      {/* Amount */}
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-text-secondary text-sm font-medium">
            Amount
          </span>
          <span className="text-text-muted text-sm">
            Balance:{' '}
            {isLoading ? '...' : `${balanceFormatted} ${selectedToken.symbol}`}
          </span>
        </div>
        <div className="relative">
          <input
            className="w-full p-4 pr-16 text-text bg-surface-inset rounded-lg border border-surface-border font-mono text-base outline-none focus:border-accent-border transition-all duration-200"
            placeholder="0.0"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              const filtered = e.target.value.replace(/[^0-9.]/g, '');
              const firstDot = filtered.indexOf('.');
              if (firstDot !== -1) {
                setAmount(
                  filtered.slice(0, firstDot + 1) +
                    filtered.slice(firstDot + 1).replace(/\./g, '')
                );
              } else {
                setAmount(filtered);
              }
            }}
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-accent text-sm font-semibold bg-transparent border-none hover:opacity-70"
            onClick={setMaxAmount}
          >
            MAX
          </button>
        </div>
      </div>

      {/* Warning */}
      <div
        className="p-4 rounded-lg"
        style={{
          background: 'var(--color-accent-wash)',
          border: '1px solid var(--color-accent-border)',
        }}
      >
        <p className="text-text text-sm">
          Please verify the recipient address carefully. Transactions cannot be
          reversed.
        </p>
      </div>

      {/* Send Button */}
      <button
        type="button"
        className="w-full p-4 text-white rounded-xl font-semibold text-base text-center border-none transition-all duration-200 disabled:cursor-wait disabled:opacity-60"
        style={{
          cursor: sending ? 'wait' : 'pointer',
          opacity: sending ? 0.6 : 1,
          background: 'var(--btn-primary-bg)',
          boxShadow: 'var(--btn-primary-shadow)',
        }}
        onClick={handleSend}
        disabled={sending}
      >
        {sending
          ? 'Sending...'
          : `Send ${selectedToken.symbol} on ${config.displayName}`}
      </button>
    </div>
  );
};

export default SendModal;
