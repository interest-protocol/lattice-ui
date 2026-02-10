import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { usePrivy } from '@privy-io/react-auth';
import { Button, Div, Input, Label, P, Span } from '@stylin.js/elements';
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
import { formatMoney } from '@/utils';

const SendModal: FC = () => {
  const { authenticated, user } = usePrivy();
  const handleClose = useModal((s) => s.handleClose);
  const { suiAddress, solanaAddress } = useWalletAddresses();

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
          {CHAIN_KEYS.map((net) => {
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
                  {CHAIN_REGISTRY[net].displayName}
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
                  <Image
                    src={token.iconUrl}
                    alt={token.symbol}
                    width={20}
                    height={20}
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
          placeholder={config.addressPlaceholder}
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
          : `Send ${selectedToken.symbol} on ${config.displayName}`}
      </Button>
    </Div>
  );
};

export default SendModal;
