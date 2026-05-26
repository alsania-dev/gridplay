import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { RecoilRoot } from 'recoil';
import type { AppProps } from 'next/app';
import { WalletProvider } from '../components/WalletConnector';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider value={defaultSystem}>
      <RecoilRoot>
        <WalletProvider>
          <Component {...pageProps} />
        </WalletProvider>
      </RecoilRoot>
    </ChakraProvider>
  );
}

export default MyApp;
