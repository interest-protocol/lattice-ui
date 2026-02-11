import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { usePrivy } from '@privy-io/react-auth';
import Image from 'next/image';
import { type FC, useState } from 'react';

import { toasting } from '@/components/ui/toast';
import { CHAIN_REGISTRY, type ChainKey } from '@/constants/chains';
import { CHAIN_TOKENS } from '@/constants/chains/chain-tokens';
import { SOL_TYPE } from '@/constants/coins';
import useSolanaBalances from '@/hooks/blockchain/use-solana-balances';
import useSuiBalances from '@/hooks/blockchain/use-sui-balances';
import useWalletAddresses from '@/hooks/domain/use-wallet-addresses';
import { FixedPointMath } from '@/lib/entities/fixed-point-math';
import { sendTokens } from '@/lib/wallet/client';
import { extractErrorMessage, formatMoney } from '@/utils';

interface WithdrawViewProps {
  network: ChainKey;
}

const WithdrawView: FC<WithdrawViewProps> = ({ network }) => {
  const { authenticated, user } = usePrivy();
  const { getAddress } = useWalletAddresses();
  const suiAddress = getAddress('sui');
  const solanaAddress = getAddress('solana');

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
      toasting.error({
        action: 'Withdraw',
        message: 'Please connect your wallet',
      });
      return;
    }
    if (!recipient || !amount) {
      toasting.error({
        action: 'Withdraw',
        message: 'Please fill in all fields',
      });
      return;
    }
    if (!user?.id) {
      toasting.error({ action: 'Withdraw', message: 'Not authenticated' });
      return;
    }

    setSending(true);
    const dismiss = toasting.loading({
      message: `Withdrawing ${selectedToken.symbol}...`,
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
        action: 'Withdraw',
        message: `${amount} ${selectedToken.symbol} sent`,
      });
      setRecipient('');
      setAmount('');
    } catch (error) {
      dismiss();
      toasting.error({
        action: 'Withdraw',
        message: extractErrorMessage(error, 'Transaction failed'),
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className="text-text-secondary text-sm font-medium mb-2 block">
          Select Token
        </span>
        <div className="flex gap-2">
          {tokens.map((token, index) => {
            const isSelected = index === selectedTokenIndex;
            return (
              <button
                key={token.type}
                type="button"
                className="flex-1 p-2.5 flex items-center justify-center gap-2 cursor-pointer rounded-lg transition-all duration-200"
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
                    width={18}
                    height={18}
                    style={{ borderRadius: '50%' }}
                  />
                )}
                <span className="text-text font-semibold text-sm">
                  {token.symbol}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="text-text-secondary text-sm font-medium mb-2 block">
          Recipient Address
        </span>
        <input
          className="w-full p-3.5 text-text bg-surface-inset rounded-lg border border-surface-border font-mono text-[0.8125rem] outline-none focus:border-accent-border transition-all duration-200"
          placeholder={config.addressPlaceholder}
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <span className="text-text-secondary text-sm font-medium">
            Amount
          </span>
          <span className="text-text-muted text-[0.8125rem]">
            Balance:{' '}
            {isLoading ? '...' : `${balanceFormatted} ${selectedToken.symbol}`}
          </span>
        </div>
        <div className="relative">
          <input
            className="w-full p-3.5 pr-14 text-text bg-surface-inset rounded-lg border border-surface-border font-mono text-[0.9375rem] outline-none focus:border-accent-border transition-all duration-200"
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
            className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-accent text-[0.8125rem] font-semibold bg-transparent border-none hover:opacity-70"
            onClick={setMaxAmount}
          >
            MAX
          </button>
        </div>
      </div>

      <div
        className="p-3 rounded-lg"
        style={{
          background: 'var(--color-accent-wash)',
          border: '1px solid var(--color-accent-border)',
        }}
      >
        <p className="text-text text-[0.8125rem]">
          Verify the address carefully. Transactions cannot be reversed.
        </p>
      </div>

      <button
        type="button"
        className="w-full p-3.5 text-white rounded-lg font-semibold text-[0.9375rem] text-center border-none transition-all duration-200 disabled:cursor-wait disabled:opacity-60"
        style={{
          cursor: sending ? 'wait' : 'pointer',
          opacity: sending ? 0.6 : 1,
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          boxShadow: '0 0 20px #6366f11a',
        }}
        onClick={handleSend}
        disabled={sending}
      >
        {sending
          ? 'Sending...'
          : `Withdraw ${selectedToken.symbol} on ${config.displayName}`}
      </button>
    </div>
  );
};

export default WithdrawView;
