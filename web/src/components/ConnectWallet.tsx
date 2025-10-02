"use client"
import React, { useEffect } from 'react'
import { Card } from './ui/card'
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import '@solana/wallet-adapter-react-ui/styles.css';
import { useWallet } from '@solana/wallet-adapter-react';

function ConnectWallet() {

    const {wallet, publicKey} = useWallet()
    
    useEffect(() => {
      console.log(publicKey);       
    }, [wallet])
    

  return (
    <div className="h-screen w-full flex items-center justify-center bg-red-200 text-center">
        <Card>
        <WalletModalProvider>
            <div className="px-10">
                    <WalletMultiButton />
                    { /* Your app's components go here, nested within the context providers. */ }
            </div>
                </WalletModalProvider>
        </Card>
    </div>
  )
}

export default ConnectWallet