'use client';

import { createElement, useEffect, useState } from 'react';
import NonceRequiredModal from '@/components/composed/nonce-required-modal';
import { useModal } from '@/hooks/store/use-modal';

interface UseNonceModalParams {
  solanaAddress: string | null;
  solBalance: bigint;
  requiredLamports: bigint;
  nonce: {
    hasNonce: boolean;
    isLoading: boolean;
    isCreating: boolean;
    createError: Error | null;
    create: () => void;
  };
  mutateSolanaBalances: () => void;
  solLoading: boolean;
}

const useNonceModal = ({
  solanaAddress,
  solBalance,
  requiredLamports,
  nonce,
  mutateSolanaBalances,
  solLoading,
}: UseNonceModalParams) => {
  const [isOpen, setIsOpen] = useState(false);
  const setContent = useModal((s) => s.setContent);
  const handleClose = useModal((s) => s.handleClose);

  const open = () => setIsOpen(true);

  // Auto-open when query confirms no nonce account
  useEffect(() => {
    if (!nonce.isLoading && !nonce.hasNonce && solanaAddress) {
      setIsOpen(true);
    }
  }, [nonce.isLoading, nonce.hasNonce, solanaAddress]);

  // Sync modal content when dependencies change
  useEffect(() => {
    if (!isOpen || !solanaAddress) return;
    setContent(
      createElement(NonceRequiredModal, {
        solanaAddress,
        solBalance,
        requiredLamports,
        isCreating: nonce.isCreating,
        createError: nonce.createError,
        onCreate: () => nonce.create(),
        onRefreshBalance: () => mutateSolanaBalances(),
        refreshing: solLoading,
      }),
      { title: 'Nonce Account Required', allowClose: !nonce.isCreating }
    );
  }, [
    isOpen,
    solanaAddress,
    solBalance,
    nonce,
    solLoading,
    setContent,
    mutateSolanaBalances,
    requiredLamports,
  ]);

  // Auto-close when nonce is created
  useEffect(() => {
    if (isOpen && nonce.hasNonce) {
      setIsOpen(false);
      handleClose();
    }
  }, [isOpen, nonce.hasNonce, handleClose]);

  // Track modal dismissal
  useEffect(() => {
    if (!isOpen) return;
    return useModal.subscribe((state) => {
      if (!state.content) setIsOpen(false);
    });
  }, [isOpen]);

  return { isNonceModalOpen: isOpen, openNonceModal: open };
};

export default useNonceModal;
