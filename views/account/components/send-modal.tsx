import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { usePrivy } from '@privy-io/react-auth';
import { Button, Div, Input, Label, P, Span } from '@stylin.js/elements';
import type BigNumber from 'bignumber.js';
import { type FC, useState } from 'react';

import { toasting } from '@/components/ui/toast';
import {
  BRIDGED_ASSET_METADATA,
  SOL_DECIMALS,
  WSOL_SUI_TYPE,
  WSUI_SOLANA_MINT,
  XBRIDGE_DECIMALS,
} from '@/constants';
import { ASSET_METADATA, SOL_TYPE } from '@/constants/coins';
import { useModal } from '@/hooks/store/use-modal';
import useSolanaBalances from '@/hooks/blockchain/use-solana-balances';
import useSuiBalances from '@/hooks/blockchain/use-sui-balances';
import useWalletAddresses from '@/hooks/domain/use-wallet-addresses';
import { FixedPointMath } from '@/lib/entities/fixed-point-math';
import { sendSolana, sendSui } from '@/lib/wallet/client';
import { formatMoney } from '@/utils';

type NetworkType = 'sui' | 'solana';

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

const SendModal: FC = () => {
  const { authenticated, user } = usePrivy();
  const handleClose = useModal((s) => s.handleClose);
  const { suiAddress, solanaAddress } = useWalletAddresses();

  const [network, setNetwork] = useState<NetworkType>('solana');
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
      toasting.error({ action: 'Send', message: 'Not authenticated' });
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
      toasting.error({ action: 'Send', message: 'Not authenticated' });
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
      toasting.error({ action: 'Send', message: 'Please connect your wallet' });
      return;
    }
    if (!recipient || !amount) {
      toasting.error({ action: 'Send', message: 'Please fill in all fields' });
      return;
    }

    setSending(true);
    const dismiss = toasting.loading({
      message: `Sending ${selectedToken.symbol}...`,
    });
    try {
      if (network === 'solana') {
        await handleSendSolana();
      } else {
        await handleSendSui();
      }
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
        message: error instanceof Error ? error.message : 'Transaction failed',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Div display="flex" flexDirection="column" gap="1.5rem" p="1.5rem">
      {/* Network Selection */}
      <Div>
        <Label
          color="#FFFFFF80"
          fontSize="0.875rem"
          mb="0.5rem"
          display="block"
        >
          Network
        </Label>
        <Div display="flex" gap="0.5rem">
          {(['solana', 'sui'] as const).map((net) => {
            const isSelected = net === network;
            return (
              <Button
                key={net}
                all="unset"
                flex="1"
                p="0.75rem"
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap="0.5rem"
                cursor="pointer"
                borderRadius="0.5rem"
                border={`1px solid ${isSelected ? '#A78BFA' : '#FFFFFF1A'}`}
                bg={isSelected ? '#A78BFA1A' : '#FFFFFF0D'}
                onClick={() => {
                  setNetwork(net);
                  setSelectedTokenIndex(0);
                }}
                nHover={{ bg: isSelected ? '#A78BFA1A' : '#FFFFFF1A' }}
              >
                <Span
                  color="#FFFFFF"
                  fontWeight="600"
                  textTransform="capitalize"
                >
                  {net === 'sui' ? 'Sui' : 'Solana'}
                </Span>
              </Button>
            );
          })}
        </Div>
      </Div>

      {/* Token Selection */}
      <Div>
        <Label
          color="#FFFFFF80"
          fontSize="0.875rem"
          mb="0.5rem"
          display="block"
        >
          Token
        </Label>
        <Div display="flex" gap="0.5rem">
          {tokens.map((token, index) => {
            const isSelected = index === selectedTokenIndex;
            return (
              <Button
                key={token.type}
                all="unset"
                flex="1"
                p="0.75rem"
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap="0.5rem"
                cursor="pointer"
                borderRadius="0.5rem"
                border={`1px solid ${isSelected ? '#A78BFA' : '#FFFFFF1A'}`}
                bg={isSelected ? '#A78BFA1A' : '#FFFFFF0D'}
                onClick={() => setSelectedTokenIndex(index)}
                nHover={{ bg: isSelected ? '#A78BFA1A' : '#FFFFFF1A' }}
              >
                {token.iconUrl && (
                  <img
                    src={token.iconUrl}
                    alt={token.symbol}
                    width="20"
                    height="20"
                    style={{ borderRadius: '50%' }}
                  />
                )}
                <Span color="#FFFFFF" fontWeight="600">
                  {token.symbol}
                </Span>
              </Button>
            );
          })}
        </Div>
      </Div>

      {/* Recipient Address */}
      <Div>
        <Label
          color="#FFFFFF80"
          fontSize="0.875rem"
          mb="0.5rem"
          display="block"
        >
          Recipient Address
        </Label>
        <Input
          all="unset"
          width="100%"
          p="1rem"
          color="#FFFFFF"
          bg="#000000"
          borderRadius="0.5rem"
          border="1px solid #FFFFFF1A"
          fontFamily="JetBrains Mono"
          fontSize="0.875rem"
          placeholder={network === 'sui' ? '0x...' : 'Solana address...'}
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
      </Div>

      {/* Amount */}
      <Div>
        <Div display="flex" justifyContent="space-between" mb="0.5rem">
          <Label color="#FFFFFF80" fontSize="0.875rem">
            Amount
          </Label>
          <Span color="#FFFFFF80" fontSize="0.875rem">
            Balance:{' '}
            {isLoading ? '...' : `${balanceFormatted} ${selectedToken.symbol}`}
          </Span>
        </Div>
        <Div position="relative">
          <Input
            all="unset"
            width="100%"
            p="1rem"
            pr="4rem"
            color="#FFFFFF"
            bg="#000000"
            borderRadius="0.5rem"
            border="1px solid #FFFFFF1A"
            fontFamily="JetBrains Mono"
            fontSize="1rem"
            placeholder="0.0"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button
            all="unset"
            position="absolute"
            right="1rem"
            top="50%"
            transform="translateY(-50%)"
            cursor="pointer"
            color="#A78BFA"
            fontSize="0.875rem"
            fontWeight="600"
            onClick={setMaxAmount}
            nHover={{ opacity: 0.7 }}
          >
            MAX
          </Button>
        </Div>
      </Div>

      {/* Warning */}
      <Div
        p="1rem"
        bg="#A78BFA1A"
        borderRadius="0.5rem"
        border="1px solid #A78BFA4D"
      >
        <P color="#FFFFFF" fontSize="0.875rem">
          Please verify the recipient address carefully. Transactions cannot be
          reversed.
        </P>
      </Div>

      {/* Send Button */}
      <Button
        all="unset"
        width="100%"
        p="1rem"
        bg="#A78BFA"
        color="#000000"
        borderRadius="0.75rem"
        fontWeight="600"
        fontSize="1rem"
        textAlign="center"
        cursor={sending ? 'wait' : 'pointer'}
        opacity={sending ? '0.6' : '1'}
        onClick={handleSend}
        disabled={sending}
        nHover={!sending ? { bg: '#C4B5FD' } : {}}
      >
        {sending
          ? 'Sending...'
          : `Send ${selectedToken.symbol} on ${network === 'sui' ? 'Sui' : 'Solana'}`}
      </Button>
    </Div>
  );
};

export default SendModal;
