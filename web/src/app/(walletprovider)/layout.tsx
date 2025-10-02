"use client"
import React, { ReactNode } from 'react'

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
function Home({children}:{children: ReactNode}) {
  return (
    <ConnectionProvider endpoint={process.env.NEXT_PUBLIC_RPC_URL!}>
        <WalletProvider wallets={[]}>
            {children}
        </WalletProvider>
    </ConnectionProvider>
  )
}

export default Home