import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { usePrivy } from '@privy-io/react-auth';
import { Button, Div, Input, Label, P, Span } from '@stylin.js/elements';
import type BigNumber from 'bignumber.js';
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
  const { suiAddress, solanaAddress } = useWalletAddresses();

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

  const getBalance = (): BigNumber => {
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
      )
        .toFixed(0)
        .toString();

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
    <Div display="flex" flexDirection="column" gap="1rem">
      <Div>
        <Label
          color="#FFFFFF80"
          fontSize="0.8125rem"
          mb="0.5rem"
          display="block"
        >
          Select Token
        </Label>
        <Div display="flex" gap="0.5rem">
          {tokens.map((token, index) => {
            const isSelected = index === selectedTokenIndex;
            return (
              <Button
                key={token.type}
                all="unset"
                flex="1"
                p="0.625rem"
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap="0.5rem"
                cursor="pointer"
                borderRadius="0.5rem"
                border={`1px solid ${isSelected ? '#A78BFA' : '#FFFFFF1A'}`}
                bg={isSelected ? '#A78BFA1A' : 'transparent'}
                onClick={() => setSelectedTokenIndex(index)}
                nHover={{ bg: isSelected ? '#A78BFA1A' : '#FFFFFF0D' }}
              >
                {token.iconUrl && (
                  <img
                    src={token.iconUrl}
                    alt={token.symbol}
                    width="18"
                    height="18"
                    style={{ borderRadius: '50%' }}
                  />
                )}
                <Span color="#FFFFFF" fontWeight="600" fontSize="0.875rem">
                  {token.symbol}
                </Span>
              </Button>
            );
          })}
        </Div>
      </Div>

      <Div>
        <Label
          color="#FFFFFF80"
          fontSize="0.8125rem"
          mb="0.5rem"
          display="block"
        >
          Recipient Address
        </Label>
        <Input
          all="unset"
          width="100%"
          p="0.875rem"
          color="#FFFFFF"
          bg="#000000"
          borderRadius="0.5rem"
          border="1px solid #FFFFFF1A"
          fontFamily="JetBrains Mono"
          fontSize="0.8125rem"
          placeholder={config.addressPlaceholder}
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
      </Div>

      <Div>
        <Div display="flex" justifyContent="space-between" mb="0.5rem">
          <Label color="#FFFFFF80" fontSize="0.8125rem">
            Amount
          </Label>
          <Span color="#FFFFFF80" fontSize="0.8125rem">
            Balance:{' '}
            {isLoading ? '...' : `${balanceFormatted} ${selectedToken.symbol}`}
          </Span>
        </Div>
        <Div position="relative">
          <Input
            all="unset"
            width="100%"
            p="0.875rem"
            pr="3.5rem"
            color="#FFFFFF"
            bg="#000000"
            borderRadius="0.5rem"
            border="1px solid #FFFFFF1A"
            fontFamily="JetBrains Mono"
            fontSize="0.9375rem"
            placeholder="0.0"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button
            all="unset"
            position="absolute"
            right="0.875rem"
            top="50%"
            transform="translateY(-50%)"
            cursor="pointer"
            color="#A78BFA"
            fontSize="0.8125rem"
            fontWeight="600"
            onClick={setMaxAmount}
            nHover={{ opacity: 0.7 }}
          >
            MAX
          </Button>
        </Div>
      </Div>

      <Div
        p="0.75rem"
        bg="#A78BFA1A"
        borderRadius="0.5rem"
        border="1px solid #A78BFA4D"
      >
        <P color="#FFFFFF" fontSize="0.8125rem">
          Verify the address carefully. Transactions cannot be reversed.
        </P>
      </Div>

      <Button
        all="unset"
        width="100%"
        p="0.875rem"
        bg="#A78BFA"
        color="#000000"
        borderRadius="0.5rem"
        fontWeight="600"
        fontSize="0.9375rem"
        textAlign="center"
        cursor={sending ? 'wait' : 'pointer'}
        opacity={sending ? '0.6' : '1'}
        onClick={handleSend}
        disabled={sending}
        nHover={!sending ? { bg: '#C4B5FD' } : {}}
      >
        {sending
          ? 'Sending...'
          : `Withdraw ${selectedToken.symbol} on ${config.displayName}`}
      </Button>
    </Div>
  );
};

export default WithdrawView;
