import { Button } from '@heroui/button'
import Link from 'next/link'
import React from 'react'

function Landing() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center gap-3">
      <h1 className='text-4xl'>Stakeup</h1>
      <p>fcuk it, accelerate!</p>
      <Link href={'/connect'}>
      <Button
      color='primary'
      >
        Get Started
      </Button>
        </Link>
    </div>
  )
}

export default Landing