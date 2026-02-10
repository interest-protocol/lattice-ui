import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { usePrivy } from '@privy-io/react-auth';
import { Button, Div, Input, Label, P, Span } from '@stylin.js/elements';
import type BigNumber from 'bignumber.js';
import { type FC, useState } from 'react';
import { toast } from 'react-hot-toast';

import {
  BRIDGED_ASSET_METADATA,
  SOL_DECIMALS,
  WSOL_SUI_TYPE,
  WSUI_SOLANA_MINT,
  XBRIDGE_DECIMALS,
} from '@/constants';
import { ASSET_METADATA, SOL_TYPE } from '@/constants/coins';
import useSolanaBalances from '@/hooks/use-solana-balances';
import useSuiBalances from '@/hooks/use-sui-balances';
import useWalletAddresses from '@/hooks/use-wallet-addresses';
import { FixedPointMath } from '@/lib/entities/fixed-point-math';
import { sendSolana, sendSui } from '@/lib/wallet/client';
import { formatMoney } from '@/utils';

type NetworkType = 'sui' | 'solana';

interface WithdrawViewProps {
  network: NetworkType;
}

interface TokenOption {
  type: string;
  symbol: string;
  name: string;
  iconUrl?: string;
  decimals: number;
}

const SUI_TOKENS: TokenOption[] = [
  {
    type: SUI_TYPE_ARG,
    symbol: 'SUI',
    name: ASSET_METADATA[SUI_TYPE_ARG]?.name ?? 'Sui',
    iconUrl: ASSET_METADATA[SUI_TYPE_ARG]?.iconUrl,
    decimals: 9,
  },
  {
    type: WSOL_SUI_TYPE,
    symbol: BRIDGED_ASSET_METADATA[WSOL_SUI_TYPE]?.symbol ?? 'wSOL',
    name: BRIDGED_ASSET_METADATA[WSOL_SUI_TYPE]?.name ?? 'Solana (Wormhole)',
    iconUrl: BRIDGED_ASSET_METADATA[WSOL_SUI_TYPE]?.iconUrl,
    decimals: XBRIDGE_DECIMALS,
  },
];

const SOLANA_TOKENS: TokenOption[] = [
  {
    type: SOL_TYPE,
    symbol: 'SOL',
    name: ASSET_METADATA[SOL_TYPE]?.name ?? 'Solana',
    iconUrl: ASSET_METADATA[SOL_TYPE]?.iconUrl,
    decimals: SOL_DECIMALS,
  },
  {
    type: WSUI_SOLANA_MINT,
    symbol: BRIDGED_ASSET_METADATA[WSUI_SOLANA_MINT]?.symbol ?? 'wSUI',
    name: BRIDGED_ASSET_METADATA[WSUI_SOLANA_MINT]?.name ?? 'Sui (Wormhole)',
    iconUrl: BRIDGED_ASSET_METADATA[WSUI_SOLANA_MINT]?.iconUrl,
    decimals: XBRIDGE_DECIMALS,
  },
];

const WithdrawView: FC<WithdrawViewProps> = ({ network }) => {
  const { authenticated, user } = usePrivy();
  const { suiAddress, solanaAddress } = useWalletAddresses();

  const [selectedTokenIndex, setSelectedTokenIndex] = useState(0);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);

  const tokens = network === 'sui' ? SUI_TOKENS : SOLANA_TOKENS;
  const selectedToken = tokens[selectedTokenIndex];

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

  const handleSendSolana = async () => {
    if (!user?.id) {
      toast.error('Not authenticated');
      return;
    }

    const rawAmount = FixedPointMath.toBigNumber(
      Number.parseFloat(amount),
      selectedToken.decimals
    )
      .toFixed(0)
      .toString();

    const result = await sendSolana({
      userId: user.id,
      recipient,
      amount: rawAmount,
      mint: selectedToken.type === SOL_TYPE ? undefined : selectedToken.type,
    });

    return result.signature;
  };

  const handleSendSui = async () => {
    if (!user?.id) {
      toast.error('Not authenticated');
      return;
    }

    const rawAmount = FixedPointMath.toBigNumber(
      Number.parseFloat(amount),
      selectedToken.decimals
    )
      .toFixed(0)
      .toString();

    const result = await sendSui({
      userId: user.id,
      recipient,
      amount: rawAmount,
      coinType:
        selectedToken.type === SUI_TYPE_ARG ? undefined : selectedToken.type,
    });

    return result.digest;
  };

  const handleSend = async () => {
    if (!authenticated) {
      toast.error('Please connect your wallet');
      return;
    }
    if (!recipient || !amount) {
      toast.error('Please fill in all fields');
      return;
    }

    setSending(true);
    try {
      if (network === 'solana') {
        await handleSendSolana();
      } else {
        await handleSendSui();
      }
      toast.success('Transaction sent!');
      setRecipient('');
      setAmount('');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Transaction failed'
      );
    } finally {
      setSending(false);
    }
  };

  const networkName = network === 'sui' ? 'Sui' : 'Solana';

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
          placeholder={network === 'sui' ? '0x...' : 'Solana address...'}
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
          : `Withdraw ${selectedToken.symbol} on ${networkName}`}
      </Button>
    </Div>
  );
};

export default WithdrawView;
