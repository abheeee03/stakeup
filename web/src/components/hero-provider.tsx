"use client"
// app/providers.tsx

import {HeroUIProvider} from '@heroui/react'
import WalletAdapterProvider from './WalletProvider'

export function Providers({children}: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <WalletAdapterProvider>
      {children}
      </WalletAdapterProvider>
    </HeroUIProvider>
  )
}