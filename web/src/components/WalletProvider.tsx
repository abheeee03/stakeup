"use client"
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import React, { ReactNode } from 'react'

function WalletAdapterProvider({children}:{children: ReactNode}) {
  return (
    <div>
         <ConnectionProvider endpoint={process.env.NEXT_PUBLIC_RPC_URL!}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
            {children}
        </WalletModalProvider>
      </WalletProvider>
         </ConnectionProvider>
    </div>
  )
}

export default WalletAdapterProvider