import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { Div } from '@stylin.js/elements';
import BigNumberJS from 'bignumber.js';
import type BigNumber from 'bignumber.js';
import { type FC, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import {
  SOL_DECIMALS,
  XBRIDGE_DECIMALS,
} from '@/constants';
import {
  ALPHA_MAX_SOL,
  ALPHA_MAX_SUI,
  MIN_GAS_SOL,
  MIN_GAS_SUI,
} from '@/constants/alpha-limits';
import { ASSET_METADATA, SOL_TYPE } from '@/constants/coins';
import useSolanaBalances from '@/hooks/blockchain/use-solana-balances';
import useSuiBalances from '@/hooks/blockchain/use-sui-balances';
import useBridge, { type BridgeDirection } from '@/hooks/domain/use-bridge';
import useWalletAddresses from '@/hooks/domain/use-wallet-addresses';
import { FixedPointMath } from '@/lib/entities/fixed-point-math';
import { formatMoney } from '@/utils';

import BridgeDetails from './bridge-details';
import BridgeForm from './bridge-form';
import type { NetworkType, TokenKey, TokenOption, ValidationResult } from './bridge.types';

const SUI_DECIMALS = 9;

const TOKEN_OPTIONS: Record<string, TokenOption> = {
  SUI: {
    symbol: 'SUI',
    iconUrl: ASSET_METADATA[SUI_TYPE_ARG]?.iconUrl,
    decimals: 9,
  },
  SOL: {
    symbol: 'SOL',
    iconUrl: ASSET_METADATA[SOL_TYPE]?.iconUrl,
    decimals: SOL_DECIMALS,
  },
};

const Bridge: FC = () => {
  const { bridge, status, isLoading } = useBridge();
  const { suiAddress, solanaAddress } = useWalletAddresses();

  const [sourceNetwork, setSourceNetwork] = useState<NetworkType>('solana');
  const [selectedToken, setSelectedToken] = useState<TokenKey>('SOL');
  const [amount, setAmount] = useState('');

  const destNetwork = sourceNetwork === 'sui' ? 'Solana' : 'Sui';
  const token = TOKEN_OPTIONS[selectedToken];

  const { balances: suiBalances, isLoading: suiLoading } =
    useSuiBalances(suiAddress);
  const { balances: solanaBalances, isLoading: solLoading } =
    useSolanaBalances(solanaAddress);

  const getBalance = (): BigNumber => {
    if (sourceNetwork === 'sui') {
      if (selectedToken === 'SUI') return suiBalances.sui;
      return suiBalances.wsol;
    }
    if (selectedToken === 'SOL') return solanaBalances.sol;
    return solanaBalances.wsui;
  };

  const getDecimals = (): number => {
    if (sourceNetwork === 'sui') {
      return selectedToken === 'SUI' ? 9 : XBRIDGE_DECIMALS;
    }
    return selectedToken === 'SOL' ? SOL_DECIMALS : XBRIDGE_DECIMALS;
  };

  const balanceLoading = sourceNetwork === 'sui' ? suiLoading : solLoading;
  const balance = getBalance();
  const decimals = getDecimals();
  const balanceFormatted = formatMoney(
    FixedPointMath.toNumber(balance, decimals)
  );

  const setMaxAmount = () => {
    setAmount(FixedPointMath.toNumber(balance, decimals).toString());
  };

  const validation: ValidationResult = useMemo(() => {
    const amountNum = Number.parseFloat(amount) || 0;

    if (!amount || amountNum <= 0) {
      return { isDisabled: true, message: 'Enter amount' };
    }

    if (selectedToken === 'SUI' && amountNum > ALPHA_MAX_SUI) {
      return {
        isDisabled: true,
        message: `Max ${ALPHA_MAX_SUI} SUI (alpha limit)`,
      };
    }
    if (selectedToken === 'SOL' && amountNum > ALPHA_MAX_SOL) {
      return {
        isDisabled: true,
        message: `Max ${ALPHA_MAX_SOL} SOL (alpha limit)`,
      };
    }

    if (sourceNetwork === 'sui') {
      const gasNeeded = new BigNumberJS(MIN_GAS_SUI).times(10 ** SUI_DECIMALS);
      const amountNeeded =
        selectedToken === 'SUI'
          ? new BigNumberJS(amountNum).times(10 ** SUI_DECIMALS)
          : new BigNumberJS(0);
      const totalNeeded = gasNeeded.plus(amountNeeded);

      if (suiBalances.sui.lt(totalNeeded)) {
        const suiBalance = FixedPointMath.toNumber(
          suiBalances.sui,
          SUI_DECIMALS
        );
        if (selectedToken === 'SUI') {
          return {
            isDisabled: true,
            message: `Insufficient SUI (need ${amountNum} + ~${MIN_GAS_SUI} gas, have ${suiBalance.toFixed(4)})`,
          };
        }
        return {
          isDisabled: true,
          message: `Insufficient SUI for gas (need ~${MIN_GAS_SUI}, have ${suiBalance.toFixed(4)})`,
        };
      }
    }

    if (sourceNetwork === 'solana') {
      const gasNeeded = new BigNumberJS(MIN_GAS_SOL).times(10 ** SOL_DECIMALS);
      const amountNeeded =
        selectedToken === 'SOL'
          ? new BigNumberJS(amountNum).times(10 ** SOL_DECIMALS)
          : new BigNumberJS(0);
      const totalNeeded = gasNeeded.plus(amountNeeded);

      if (solanaBalances.sol.lt(totalNeeded)) {
        const solBalance = FixedPointMath.toNumber(
          solanaBalances.sol,
          SOL_DECIMALS
        );
        if (selectedToken === 'SOL') {
          return {
            isDisabled: true,
            message: `Insufficient SOL (need ${amountNum} + ~${MIN_GAS_SOL} gas, have ${solBalance.toFixed(6)})`,
          };
        }
        return {
          isDisabled: true,
          message: `Insufficient SOL for gas (need ~${MIN_GAS_SOL}, have ${solBalance.toFixed(6)})`,
        };
      }
    }

    return { isDisabled: false, message: null };
  }, [
    amount,
    selectedToken,
    sourceNetwork,
    suiBalances.sui,
    solanaBalances.sol,
  ]);

  const isDisabled = isLoading || validation.isDisabled;

  const getBridgeDirection = (): BridgeDirection => {
    if (sourceNetwork === 'sui') {
      return selectedToken === 'SUI' ? 'sui-to-wsui' : 'wsol-to-sol';
    }
    return selectedToken === 'SOL' ? 'sol-to-wsol' : 'wsui-to-sui';
  };

  const handleBridge = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      toast.error('Enter an amount');
      return;
    }

    const direction = getBridgeDirection();
    const amountBN = new BigNumberJS(amount).times(10 ** decimals);

    await bridge({ direction, amount: amountBN });

    if (status === 'success') {
      setAmount('');
    }
  };

  return (
    <Div
      display="flex"
      flexDirection="column"
      gap="1.5rem"
      width="100%"
      maxWidth="40rem"
      mx="auto"
    >
      <BridgeForm
        sourceNetwork={sourceNetwork}
        setSourceNetwork={setSourceNetwork}
        selectedToken={selectedToken}
        setSelectedToken={setSelectedToken}
        amount={amount}
        setAmount={setAmount}
        isDisabled={isDisabled}
        isLoading={isLoading}
        status={status}
        validationMessage={validation.message}
        destNetwork={destNetwork}
        token={token}
        balanceLoading={balanceLoading}
        balanceFormatted={balanceFormatted}
        setMaxAmount={setMaxAmount}
        onBridge={handleBridge}
      />

      <BridgeDetails
        sourceNetwork={sourceNetwork}
        selectedToken={selectedToken}
        destNetwork={destNetwork}
        amount={amount}
      />
    </Div>
  );
};

export default Bridge;
