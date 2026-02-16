import { usePrivy } from '@privy-io/react-auth';
import { motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';
import { type FC, useState } from 'react';

import { ChevronDownSVG, InfoSVG, WalletSVG } from '@/components/ui/icons';
import Spinner from '@/components/ui/spinner';
import { toasting } from '@/components/ui/toast';
import { SPRING_CONTROLLED } from '@/constants/animations';
import { CHAIN_REGISTRY, type ChainKey } from '@/constants/chains';
import { CHAIN_TOKENS } from '@/constants/chains/chain-tokens';
import useChainBalance from '@/hooks/domain/use-chain-balance';
import { useModal } from '@/hooks/store/use-modal';
import { FixedPointMath } from '@/lib/entities/fixed-point-math';
import { isNativeToken } from '@/lib/entities/token-utils';
import { sendTokens } from '@/lib/wallet/client';
import { extractErrorMessage } from '@/utils';
import { filterDecimalInput } from '@/utils/decimal-input';
import WithdrawTokenModal from './withdraw-token-modal';

interface WithdrawViewProps {
  network: ChainKey;
}

const WithdrawView: FC<WithdrawViewProps> = ({ network }) => {
  const { authenticated, user } = usePrivy();
  const reducedMotion = useReducedMotion();

  const [selectedTokenIndex, setSelectedTokenIndex] = useState(0);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);

  const tokens = CHAIN_TOKENS[network];
  const selectedToken = tokens[selectedTokenIndex];
  const config = CHAIN_REGISTRY[network];

  const { getBalanceByIndex, isLoading, formatBalance, toHumanAmount } =
    useChainBalance(network);

  const setContent = useModal((s) => s.setContent);

  const balance = getBalanceByIndex(selectedTokenIndex);
  const balanceFormatted = formatBalance(balance, selectedToken.decimals);

  const setMaxAmount = () => {
    setAmount(toHumanAmount(balance, selectedToken.decimals).toString());
  };

  const handleSend = async () => {
    if (!authenticated) {
      toasting.error({
        action: 'Withdraw',
        message: 'Please connect your wallet',
      });
      return;
    }
    if (!(recipient && amount)) {
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
          Token
        </span>
        <button
          type="button"
          className="w-full p-3 flex items-center gap-3 cursor-pointer rounded-xl hover:bg-surface-hover transition-colors duration-200"
          style={{
            border: '1px solid var(--color-surface-border)',
            background: 'var(--color-surface-light)',
          }}
          onClick={() =>
            setContent(
              <WithdrawTokenModal
                tokens={tokens}
                selectedType={selectedToken.type}
                getBalance={getBalanceByIndex}
                onSelect={setSelectedTokenIndex}
              />,
              { title: 'Select Token' }
            )
          }
        >
          {selectedToken.iconUrl ? (
            <Image
              src={selectedToken.iconUrl}
              alt={selectedToken.symbol}
              width={24}
              height={24}
              className="rounded-full"
            />
          ) : null}
          <span className="text-text font-semibold text-sm flex-1 text-left">
            {selectedToken.symbol}
          </span>
          <span className="text-text-muted">
            <ChevronDownSVG maxWidth="1rem" width="100%" />
          </span>
        </button>
      </div>

      <div>
        <label
          htmlFor="withdraw-recipient"
          className="text-text-secondary text-sm font-medium opacity-80 mb-2 block"
        >
          Recipient Address
        </label>
        <div className="p-4 rounded-xl border border-surface-border focus-within:border-accent-border transition-colors duration-200 bg-surface-inset">
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
        <div className="p-4 rounded-xl border border-surface-border focus-within:border-accent-border transition-colors duration-200 bg-surface-inset flex items-center gap-3">
          <input
            id="withdraw-amount"
            className="flex-1 bg-transparent border-none text-text font-mono text-2xl outline-none min-w-0"
            placeholder="0"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={amount}
            onChange={(e) => setAmount(filterDecimalInput(e.target.value))}
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

      <motion.button
        type="button"
        className="w-full py-[18px] px-6 text-white text-base font-semibold rounded-2xl border-none disabled:cursor-not-allowed focus-ring"
        style={{
          cursor: sending ? 'wait' : 'pointer',
          opacity: sending ? 0.5 : 1,
          background: 'var(--btn-primary-bg)',
          boxShadow: sending ? 'none' : 'var(--cta-idle-glow)',
        }}
        whileHover={
          sending || reducedMotion
            ? undefined
            : { y: -3, scale: 1.01, boxShadow: 'var(--cta-hover-glow)' }
        }
        whileTap={sending || reducedMotion ? undefined : { scale: 0.98 }}
        transition={reducedMotion ? { duration: 0 } : SPRING_CONTROLLED}
        onClick={handleSend}
        disabled={sending}
      >
        <span className="flex items-center justify-center gap-2">
          {sending && <Spinner />}
          {sending
            ? 'Sending...'
            : `Withdraw ${selectedToken.symbol} on ${config.displayName}`}
        </span>
      </motion.button>
    </div>
  );
};

export default WithdrawView;
