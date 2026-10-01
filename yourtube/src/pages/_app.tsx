import type { AppProps } from 'next/app';
import AppShell from '@/components/AppShell';
import { UserProvider } from '@/lib/AuthContext';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
 return <UserProvider><AppShell><Component {...pageProps}/></AppShell></UserProvider>;
}
