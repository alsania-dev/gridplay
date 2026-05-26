/**
 * Ethereum provider type declaration
 * 
 * Extends Window interface to include ethereum property from MetaMask/Rabby
 */

import { Eip1193Provider } from 'ethers';

declare global {
  interface Window {
    ethereum?: Eip1193Provider & {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
      isRabby?: boolean;
      selectedAddress?: string;
      networkVersion?: string;
      chainId?: string;
    };
  }
}

export {};
