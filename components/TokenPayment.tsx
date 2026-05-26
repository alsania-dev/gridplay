/**
 * TokenPayment Component
 * 
 * Handles token-based entry fees for GridPlay games.
 * Includes approval and payment flow for ALSA/SPIRIT tokens.
 */

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './WalletConnector';
import {
  TOKEN_ADDRESSES,
  TOKEN_METADATA,
  ERC20_ABI,
  checkAllowance,
  approveMaxTokens,
  transferTokens,
  formatTokenAmount,
  parseTokenAmount,
  type TokenSymbol,
} from '../lib/tokens';

// ===========================================
// Types
// ===========================================

interface TokenPaymentProps {
  /** Token symbol to use for payment */
  tokenSymbol: TokenSymbol;
  /** Amount to pay (in token units, e.g., 1 for 1 ALSA) */
  amount: number;
  /** Recipient address (game contract or escrow) */
  recipientAddress: string;
  /** Callback when payment is successful */
  onSuccess?: (transactionHash: string) => void;
  /** Callback when payment fails */
  onError?: (error: Error) => void;
  /** Button text */
  buttonText?: string;
  /** Disable payment button */
  disabled?: boolean;
}

// ===========================================
// Component
// ===========================================

export const TokenPayment: React.FC<TokenPaymentProps> = ({
  tokenSymbol,
  amount,
  recipientAddress,
  onSuccess,
  onError,
  buttonText = 'Pay Entry Fee',
  disabled = false,
}) => {
  const { signer, address, isConnected, isCorrectNetwork, refreshBalances } = useWallet();
  
  const [isApproved, setIsApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [allowance, setAllowance] = useState<bigint>(0n);
  const [status, setStatus] = useState<string>('');
  
  const tokenAddress = TOKEN_ADDRESSES[tokenSymbol];
  const metadata = TOKEN_METADATA[tokenSymbol];
  const amountInWei = parseTokenAmount(amount, tokenSymbol);

  // Check allowance on mount and when dependencies change
  useEffect(() => {
    if (!isConnected || !isCorrectNetwork || !signer || !address) {
      setIsApproved(false);
      return;
    }

    const checkAllowanceStatus = async () => {
      try {
        const provider = signer.provider;
        if (!provider) return;
        
        const currentAllowance = await checkAllowance(
          tokenAddress,
          address,
          recipientAddress,
          provider
        );
        setAllowance(currentAllowance);
        setIsApproved(currentAllowance >= amountInWei);
      } catch (error) {
        console.error('Failed to check allowance:', error);
      }
    };

    checkAllowanceStatus();
    
    // Check every 5 seconds
    const interval = setInterval(checkAllowanceStatus, 5000);
    return () => clearInterval(interval);
  }, [isConnected, isCorrectNetwork, signer, address, tokenAddress, recipientAddress, amountInWei]);

  // Handle approve
  const handleApprove = async () => {
    if (!signer || !address) {
      setStatus('Please connect your wallet first');
      return;
    }

    setIsApproving(true);
    setStatus(`Approving ${metadata.symbol}...`);

    try {
      const tx = await approveMaxTokens(tokenAddress, recipientAddress, signer);
      setStatus(`Approved! Waiting for confirmation...`);
      await tx.wait();
      setStatus(`${metadata.symbol} approved! You can now pay.`);
      setIsApproved(true);
      
      // Refresh allowance
      if (signer.provider && address) {
        const newAllowance = await checkAllowance(
          tokenAddress,
          address,
          recipientAddress,
          signer.provider
        );
        setAllowance(newAllowance);
      }
    } catch (error) {
      console.error('Approval failed:', error);
      setStatus(`Approval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      onError?.(error instanceof Error ? error : new Error('Approval failed'));
    } finally {
      setIsApproving(false);
      setTimeout(() => setStatus(''), 3000);
    }
  };

  // Handle payment
  const handlePayment = async () => {
    if (!signer || !address) {
      setStatus('Please connect your wallet first');
      return;
    }

    if (!isApproved) {
      setStatus('Please approve the token first');
      return;
    }

    setIsPaying(true);
    setStatus(`Paying ${amount} ${metadata.symbol}...`);

    try {
      const tx = await transferTokens(tokenAddress, recipientAddress, amountInWei, signer);
      setStatus(`Transaction submitted. Waiting for confirmation...`);
      await tx.wait();
      setStatus(`✅ Payment successful! Paid ${amount} ${metadata.symbol}`);
      
      // Refresh balances
      await refreshBalances();
      
      onSuccess?.(tx.hash);
    } catch (error) {
      console.error('Payment failed:', error);
      setStatus(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      onError?.(error instanceof Error ? error : new Error('Payment failed'));
    } finally {
      setIsPaying(false);
      setTimeout(() => setStatus(''), 3000);
    }
  };

  // Not connected state
  if (!isConnected) {
    return (
      <div className="p-4 rounded-lg bg-gray-800/50 text-center">
        <p className="text-gray-400 mb-3">Connect wallet to pay with {metadata.symbol}</p>
        <button
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium"
          onClick={() => document.querySelector('[data-wallet-button]')?.dispatchEvent(new Event('click'))}
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  // Wrong network state
  if (!isCorrectNetwork) {
    return (
      <div className="p-4 rounded-lg bg-amber-900/30 border border-amber-500/50 text-center">
        <p className="text-amber-400 mb-2">⚠️ Wrong Network</p>
        <p className="text-gray-400 text-sm">Please switch to Polygon network to pay with {metadata.symbol}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Balance Display */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">Your Balance:</span>
        <span className="text-white font-mono">
          {metadata.icon} {formatTokenAmount(0n, tokenSymbol)} {metadata.symbol}
        </span>
      </div>

      {/* Amount Display */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">Entry Fee:</span>
        <span className="text-white font-bold">
          {metadata.icon} {amount} {metadata.symbol}
        </span>
      </div>

      {/* Status Message */}
      {status && (
        <div className={`text-sm text-center p-2 rounded ${
          status.includes('✅') ? 'bg-green-500/20 text-green-400' :
          status.includes('failed') ? 'bg-red-500/20 text-red-400' :
          'bg-blue-500/20 text-blue-400'
        }`}>
          {status}
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        {!isApproved ? (
          <button
            onClick={handleApprove}
            disabled={isApproving || disabled}
            className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${
              isApproving || disabled
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
            } text-white`}
          >
            {isApproving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Approving...
              </span>
            ) : (
              `🔓 Approve ${metadata.symbol}`
            )}
          </button>
        ) : (
          <button
            onClick={handlePayment}
            disabled={isPaying || disabled}
            className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${
              isPaying || disabled
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
            } text-white`}
          >
            {isPaying ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Processing...
              </span>
            ) : (
              `${buttonText} ${metadata.icon} ${amount} ${metadata.symbol}`
            )}
          </button>
        )}
      </div>

      {/* Approval Note */}
      {!isApproved && (
        <p className="text-xs text-gray-500 text-center">
          💡 Approve once to play multiple games. No per-game approval needed.
        </p>
      )}
    </div>
  );
};

export default TokenPayment;
