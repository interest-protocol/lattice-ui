import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { usePrivy } from '@privy-io/react-auth';
import Image from 'next/image';
import { type FC, useState } from 'react';

import { InfoSVG, WalletSVG } from '@/components/ui/icons';
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
        <span className="text-text-secondary text-sm font-medium opacity-80 mb-2 block">
          Select Token
        </span>
        <div className="flex gap-2">
          {tokens.map((token, index) => {
            const isSelected = index === selectedTokenIndex;
            return (
              <button
                key={token.type}
                type="button"
                className="flex-1 p-3 flex items-center justify-center gap-2 cursor-pointer rounded-xl hover:bg-surface-hover transition-all duration-200"
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
                    width={24}
                    height={24}
                    className="rounded-full"
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
        <label
          htmlFor="withdraw-recipient"
          className="text-text-secondary text-sm font-medium opacity-80 mb-2 block"
        >
          Recipient Address
        </label>
        <div className="p-4 rounded-xl border border-surface-border focus-within:border-accent-border transition-all duration-200 bg-surface-inset">
          <input
            id="withdraw-recipient"
            className="w-full bg-transparent border-none text-text font-mono text-sm outline-none"
            placeholder={config.addressPlaceholder}
            autoComplete="off"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <label
            htmlFor="withdraw-amount"
            className="text-text-secondary text-sm font-medium opacity-80"
          >
            Amount
          </label>
          <button
            type="button"
            className="flex gap-2 items-center cursor-pointer bg-transparent border-none p-0 text-text-muted text-sm hover:text-accent transition-colors"
            onClick={setMaxAmount}
          >
            <WalletSVG maxWidth="1rem" width="100%" />
            <span className="font-mono">
              {isLoading
                ? '...'
                : `${balanceFormatted} ${selectedToken.symbol}`}
            </span>
          </button>
        </div>
        <div className="p-4 rounded-xl border border-surface-border focus-within:border-accent-border transition-all duration-200 bg-surface-inset flex items-center gap-3">
          <input
            id="withdraw-amount"
            className="flex-1 bg-transparent border-none text-text font-mono text-2xl outline-none min-w-0"
            placeholder="0"
            type="text"
            inputMode="decimal"
            autoComplete="off"
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
            className="px-3 py-1.5 rounded-lg text-accent text-xs font-semibold cursor-pointer border-none bg-accent-wash hover:bg-accent-subtle transition-colors"
            onClick={setMaxAmount}
          >
            MAX
          </button>
        </div>
      </div>

      <div className="p-3 bg-warning-bg border border-warning-border rounded-xl flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <InfoSVG maxWidth="1rem" width="100%" />
          <span className="text-warning font-semibold text-sm">Important</span>
        </div>
        <p className="text-text-secondary text-xs leading-relaxed m-0">
          Verify the recipient address carefully. Transactions on the blockchain
          cannot be reversed.
        </p>
      </div>

      <button
        type="button"
        className="w-full py-4 px-6 text-white text-base font-semibold rounded-xl border-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          cursor: sending ? 'wait' : 'pointer',
          opacity: sending ? 0.5 : 1,
          background: 'var(--btn-primary-bg)',
          boxShadow: 'var(--btn-primary-shadow)',
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
