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
import { formatMoney } from '@/utils';

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
        message: error instanceof Error ? error.message : 'Transaction failed',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className="text-text-muted text-[0.8125rem] mb-2 block">
          Select Token
        </span>
        <div className="flex gap-2">
          {tokens.map((token, index) => {
            const isSelected = index === selectedTokenIndex;
            return (
              <button
                key={token.type}
                type="button"
                className="flex-1 p-2.5 flex items-center justify-center gap-2 cursor-pointer rounded-lg"
                style={{
                  border: `1px solid ${isSelected ? '#A78BFA' : '#FFFFFF1A'}`,
                  background: isSelected ? '#A78BFA1A' : 'transparent',
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
                <span className="text-white font-semibold text-sm">
                  {token.symbol}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="text-text-muted text-[0.8125rem] mb-2 block">
          Recipient Address
        </span>
        <input
          className="w-full p-3.5 text-white bg-black rounded-lg border border-surface-border font-mono text-[0.8125rem] outline-none"
          placeholder={config.addressPlaceholder}
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <span className="text-text-muted text-[0.8125rem]">Amount</span>
          <span className="text-text-muted text-[0.8125rem]">
            Balance:{' '}
            {isLoading ? '...' : `${balanceFormatted} ${selectedToken.symbol}`}
          </span>
        </div>
        <div className="relative">
          <input
            className="w-full p-3.5 pr-14 text-white bg-black rounded-lg border border-surface-border font-mono text-[0.9375rem] outline-none"
            placeholder="0.0"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
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
          background: '#A78BFA1A',
          border: '1px solid #A78BFA4D',
        }}
      >
        <p className="text-white text-[0.8125rem]">
          Verify the address carefully. Transactions cannot be reversed.
        </p>
      </div>

      <button
        type="button"
        className="w-full p-3.5 bg-accent text-black rounded-lg font-semibold text-[0.9375rem] text-center border-none hover:bg-accent-hover disabled:cursor-wait disabled:opacity-60"
        style={{
          cursor: sending ? 'wait' : 'pointer',
          opacity: sending ? 0.6 : 1,
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
