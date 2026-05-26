/**
 * Token Configuration for GridPlay
 * 
 * ALSA and SPIRIT tokens on Polygon network
 * Used for entry fees and payouts
 */

import { ethers } from 'ethers';

// ===========================================
// Token Addresses
// ===========================================

export const TOKEN_ADDRESSES = {
  ALSA: '0x1630fE468B414A964ed974b9F5Dd69d950E1Eb74',
  SPIRIT: '0xec5E56058494F2cb260Fd7D81B15f04872dbC34a',
} as const;

export type TokenSymbol = keyof typeof TOKEN_ADDRESSES;
export type TokenAddress = typeof TOKEN_ADDRESSES[TokenSymbol];

// ===========================================
// Chain Configuration
// ===========================================

export const POLYGON_CHAIN_ID = '0x89';
export const POLYGON_CHAIN_ID_NUMBER = 137;

export const POLYGON_NETWORK = {
  chainId: POLYGON_CHAIN_ID,
  chainName: 'Polygon',
  nativeCurrency: {
    name: 'POL',
    symbol: 'POL',
    decimals: 18,
  },
  rpcUrls: ['https://polygon-rpc.com', 'https://rpc-mainnet.maticvigil.com'],
  blockExplorerUrls: ['https://polygonscan.com'],
};

// ===========================================
// ERC20 ABI (minimal)
// ===========================================

export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
] as const;

// ===========================================
// Token Metadata
// ===========================================

export const TOKEN_METADATA: Record<TokenSymbol, {
  symbol: string;
  name: string;
  decimals: number;
  icon: string;
  color: string;
}> = {
  ALSA: {
    symbol: 'ALSA',
    name: 'Alsania Token',
    decimals: 18,
    icon: '🛡️',
    color: '#00f3ff',
  },
  SPIRIT: {
    symbol: 'SPIRIT',
    name: 'Spirit Wolf Token',
    decimals: 18,
    icon: '🐺',
    color: '#f59e0b',
  },
};

// ===========================================
// Helper Functions
// ===========================================

/**
 * Get token address by symbol
 */
export function getTokenAddress(symbol: TokenSymbol): string {
  return TOKEN_ADDRESSES[symbol];
}

/**
 * Format token amount from wei to display
 */
export function formatTokenAmount(weiAmount: bigint | string, symbol: TokenSymbol): string {
  const decimals = TOKEN_METADATA[symbol].decimals;
  const amount = typeof weiAmount === 'string' ? BigInt(weiAmount) : weiAmount;
  const formatted = ethers.formatUnits(amount, decimals);
  // Parse to number and round to 4 decimals
  const num = parseFloat(formatted);
  return num.toFixed(4);
}

/**
 * Parse token amount from display to wei
 */
export function parseTokenAmount(amount: number | string, symbol: TokenSymbol): bigint {
  const decimals = TOKEN_METADATA[symbol].decimals;
  const amountStr = typeof amount === 'number' ? amount.toString() : amount;
  return ethers.parseUnits(amountStr, decimals);
}

/**
 * Get token contract instance
 */
export function getTokenContract(
  address: string,
  signerOrProvider: ethers.Signer | ethers.Provider
): ethers.Contract {
  return new ethers.Contract(address, ERC20_ABI, signerOrProvider);
}

/**
 * Check if user has approved the contract to spend tokens
 */
export async function checkAllowance(
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string,
  provider: ethers.Provider
): Promise<bigint> {
  const tokenContract = getTokenContract(tokenAddress, provider);
  const allowance = await tokenContract.allowance(ownerAddress, spenderAddress);
  return allowance;
}

/**
 * Approve max tokens for spending
 */
export async function approveMaxTokens(
  tokenAddress: string,
  spenderAddress: string,
  signer: ethers.Signer
): Promise<ethers.ContractTransactionResponse> {
  const tokenContract = getTokenContract(tokenAddress, signer);
  const maxAmount = ethers.MaxUint256;
  const tx = await tokenContract.approve(spenderAddress, maxAmount);
  await tx.wait();
  return tx;
}

/**
 * Transfer tokens
 */
export async function transferTokens(
  tokenAddress: string,
  toAddress: string,
  amount: bigint,
  signer: ethers.Signer
): Promise<ethers.ContractTransactionResponse> {
  const tokenContract = getTokenContract(tokenAddress, signer);
  const tx = await tokenContract.transfer(toAddress, amount);
  await tx.wait();
  return tx;
}

/**
 * Get token balance
 */
export async function getTokenBalance(
  tokenAddress: string,
  ownerAddress: string,
  provider: ethers.Provider
): Promise<bigint> {
  const tokenContract = getTokenContract(tokenAddress, provider);
  const balance = await tokenContract.balanceOf(ownerAddress);
  return balance;
}

/**
 * Get multiple token balances
 */
export async function getMultipleTokenBalances(
  ownerAddress: string,
  provider: ethers.Provider
): Promise<Record<TokenSymbol, bigint>> {
  const balances: Record<TokenSymbol, bigint> = {
    ALSA: 0n,
    SPIRIT: 0n,
  };

  for (const [symbol, address] of Object.entries(TOKEN_ADDRESSES)) {
    const balance = await getTokenBalance(address, ownerAddress, provider);
    balances[symbol as TokenSymbol] = balance;
  }

  return balances;
}
