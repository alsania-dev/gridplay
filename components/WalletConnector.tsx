/**
 * WalletConnector Component
 * 
 * Handles MetaMask/Rabby wallet connection for token payments.
 * Provides balance display and network switching.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  POLYGON_CHAIN_ID,
  POLYGON_NETWORK,
  TOKEN_ADDRESSES,
  TOKEN_METADATA,
  getMultipleTokenBalances,
  formatTokenAmount,
  type TokenSymbol,
} from '../lib/tokens';

// ===========================================
// Types
// ===========================================

interface WalletContextValue {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  
  // Balances
  balances: Record<TokenSymbol, bigint>;
  formattedBalances: Record<TokenSymbol, string>;
  
  // Network state
  isCorrectNetwork: boolean;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
  refreshBalances: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// ===========================================
// Provider Component
// ===========================================

interface WalletProviderProps {
  children: React.ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [balances, setBalances] = useState<Record<TokenSymbol, bigint>>({
    ALSA: 0n,
    SPIRIT: 0n,
  });

  // Check if wallet is available
  const hasWallet = typeof window !== 'undefined' && window.ethereum;

  // Check current network
  const checkNetwork = useCallback(async () => {
    if (!window.ethereum) return false;
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const isCorrect = chainId === POLYGON_CHAIN_ID;
      setIsCorrectNetwork(isCorrect);
      return isCorrect;
    } catch (error) {
      console.error('Failed to check network:', error);
      return false;
    }
  }, []);

  // Switch to Polygon network
  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask or Rabby wallet');
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: POLYGON_CHAIN_ID }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        // Network not added, add it
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [POLYGON_NETWORK],
          });
        } catch (addError) {
          console.error('Failed to add network:', addError);
          alert('Failed to add Polygon network. Please add it manually in your wallet.');
        }
      } else {
        console.error('Failed to switch network:', error);
        alert('Failed to switch to Polygon network. Please switch manually in your wallet.');
      }
    }
  }, []);

  // Refresh token balances
  const refreshBalances = useCallback(async () => {
    if (!provider || !address) return;

    try {
      const newBalances = await getMultipleTokenBalances(address, provider);
      setBalances(newBalances);
    } catch (error) {
      console.error('Failed to refresh balances:', error);
    }
  }, [provider, address]);

  // Connect wallet
  const connect = useCallback(async () => {
    if (!hasWallet) {
      alert('Please install MetaMask or Rabby wallet to play with tokens');
      return;
    }

    setIsConnecting(true);

    try {
      // Request accounts
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Create provider
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      const newSigner = await newProvider.getSigner();
      const userAddress = await newSigner.getAddress();

      setProvider(newProvider);
      setSigner(newSigner);
      setAddress(userAddress);
      setIsConnected(true);

      // Check network
      const isCorrect = await checkNetwork();
      if (!isCorrect) {
        // Don't auto-switch - let user decide
        console.log('Not on Polygon network');
      }

      // Load balances
      const balances = await getMultipleTokenBalances(userAddress, newProvider);
      setBalances(balances);

      // Setup event listeners
      window.ethereum.on('accountsChanged', () => {
        window.location.reload();
      });
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  }, [hasWallet, checkNetwork]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAddress(null);
    setIsConnected(false);
    setBalances({ ALSA: 0n, SPIRIT: 0n });
  }, []);

  // Auto-refresh balances periodically
  useEffect(() => {
    if (!isConnected || !provider || !address) return;

    refreshBalances();
    const interval = setInterval(refreshBalances, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [isConnected, provider, address, refreshBalances]);

  // Check network on mount and when wallet events fire
  useEffect(() => {
    if (!hasWallet) return;

    checkNetwork();

    const handleChainChanged = () => {
      checkNetwork();
      refreshBalances();
    };

    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [hasWallet, checkNetwork, refreshBalances]);

  const formattedBalances: Record<TokenSymbol, string> = {
    ALSA: formatTokenAmount(balances.ALSA, 'ALSA'),
    SPIRIT: formatTokenAmount(balances.SPIRIT, 'SPIRIT'),
  };

  const value: WalletContextValue = {
    isConnected,
    isConnecting,
    address,
    provider,
    signer,
    balances,
    formattedBalances,
    isCorrectNetwork,
    connect,
    disconnect,
    switchNetwork,
    refreshBalances,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// ===========================================
// Wallet Status Component
// ===========================================

interface WalletStatusProps {
  /** Show compact version (just icon + truncated address) */
  compact?: boolean;
}

export const WalletStatus: React.FC<WalletStatusProps> = ({ compact = false }) => {
  const { isConnected, isConnecting, address, formattedBalances, isCorrectNetwork, connect, disconnect, switchNetwork } = useWallet();

  if (isConnecting) {
    return (
      <button className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 animate-pulse" disabled>
        Connecting...
      </button>
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium hover:from-emerald-500 hover:to-teal-500 transition-all"
      >
        🔌 Connect Wallet
      </button>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <button
        onClick={switchNetwork}
        className="px-4 py-2 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-500 transition-all"
      >
        ⚠️ Switch to Polygon
      </button>
    );
  }

  const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-sm font-mono text-gray-300">{truncatedAddress}</span>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-gray-400">Connected</span>
        </div>
        <button
          onClick={disconnect}
          className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
        >
          Disconnect
        </button>
      </div>

      <div className="font-mono text-sm text-white mb-3">
        {address}
      </div>

      <div className="flex gap-4 text-sm">
        <div>
          <span className="text-gray-500">🛡️ ALSA:</span>
          <span className="text-white ml-2">{formattedBalances.ALSA}</span>
        </div>
        <div>
          <span className="text-gray-500">🐺 SPIRIT:</span>
          <span className="text-white ml-2">{formattedBalances.SPIRIT}</span>
        </div>
      </div>
    </div>
  );
};

// ===========================================
// Token Approval Component
// ===========================================

interface TokenApprovalProps {
  tokenSymbol: TokenSymbol;
  spenderAddress: string;
  onApproved?: () => void;
  buttonText?: string;
}

export const TokenApproval: React.FC<TokenApprovalProps> = ({
  tokenSymbol,
  spenderAddress,
  onApproved,
  buttonText = 'Approve',
}) => {
  const { signer, isConnected, isCorrectNetwork } = useWallet();
  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const handleApprove = async () => {
    if (!signer || !isConnected || !isCorrectNetwork) {
      alert('Please connect your wallet and switch to Polygon network');
      return;
    }

    setIsApproving(true);

    try {
      const tokenAddress = tokenSymbol === 'ALSA' 
        ? '0x1630fE468B414A964ed974b9F5Dd69d950E1Eb74'
        : '0xec5E56058494F2cb260Fd7D81B15f04872dbC34a';

      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function approve(address spender, uint256 amount) returns (bool)'],
        signer
      );

      const maxAmount = ethers.MaxUint256;
      const tx = await tokenContract.approve(spenderAddress, maxAmount);
      await tx.wait();

      setIsApproved(true);
      onApproved?.();
    } catch (error) {
      console.error('Approval failed:', error);
      alert('Approval failed. Please try again.');
    } finally {
      setIsApproving(false);
    }
  };

  if (!isConnected || !isCorrectNetwork) {
    return null;
  }

  if (isApproved) {
    return (
      <div className="text-sm text-green-500 flex items-center gap-2">
        <span>✓</span> {tokenSymbol} Approved
      </div>
    );
  }

  return (
    <button
      onClick={handleApprove}
      disabled={isApproving}
      className={`px-4 py-2 rounded-lg font-medium transition-all ${
        isApproving
          ? 'bg-gray-600 cursor-not-allowed'
          : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
      } text-white`}
    >
      {isApproving ? 'Approving...' : `${buttonText} ${tokenSymbol}`}
    </button>
  );
};
