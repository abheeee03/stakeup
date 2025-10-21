"use client"
import { createClient } from '@/utils/supabase/client'
import { addToast, Avatar, Button, Card, Skeleton, Tooltip, Divider, Snippet } from '@heroui/react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

type UserDataType = {
  username: string
  id: string
  wallet_address: string
  created_at: string
}

function Account() {
  const [user, setUser] = useState<UserDataType | null>(null)
  const [loading, setLoading] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const router = useRouter()

  const getUser = async () => {
    setLoading(true)
    const supabase = createClient()
    const session = await supabase.auth.getUser()
    if (!session.data.user) {
      router.push('/connect')
      return
    }
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.data.user?.id)
    if (data && data[0]) {
      setUser(data[0])
    } else {
      addToast({
        title: "Something went wrong!"
      })
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    setLogoutLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    setLogoutLoading(false)
    if (!error) {
      addToast({ title: "Signed out successfully!" })
      router.push('/connect')
    } else {
      addToast({ title: "Sign out failed", description: error.message })
    }
  }

  useEffect(() => {
    getUser()
    // eslint-disable-next-line
  }, [])

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Card className="max-w-md w-full p-8">
          <div className="flex flex-col items-center gap-5">
            <Skeleton className="rounded-full" isLoaded={false}>
              <div className="h-16 w-16 rounded-full bg-gray-200"></div>
            </Skeleton>
            <Skeleton className="w-32 h-6" isLoaded={false}></Skeleton>
            <Skeleton className="w-52 h-4" isLoaded={false}></Skeleton>
            <Skeleton className="w-40 h-4 mt-3" isLoaded={false}></Skeleton>
            <Skeleton className="w-24 h-8 mt-5" isLoaded={false}></Skeleton>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen w-full flex items-center justify-center transition">
      <Card className="max-w-lg w-full p-10 rounded-2xl shadow-2xl relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-100/40 via-purple-100/30 to-pink-100/10 pointer-events-none z-0"></div>
        <div className="relative z-10 flex flex-col items-center gap-2 mb-6">
          <Avatar
            showFallback
            name={user?.username?.[0]?.toUpperCase() ?? "U"}
            size="lg"
            className="mb-2 shadow-lg"
          />
          <h1 className="text-2xl md:text-3xl font-medium tracking-tight">
            {user?.username || <span className="text-gray-400">User</span>}
          </h1>
          <span className="text-sm text-gray-500 mb-1">
            Joined: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : ""}
          </span>
        </div>
        <Divider className="my-4" />
        <div className="relative z-10 flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">
              Wallet:
            </span>
              <Snippet
                variant="flat"
                size="sm"
                color="primary"
                hideSymbol
                className="bg-gray-50 shadow"
              >
                {user?.wallet_address
                  ? `${user.wallet_address.slice(0, 7)}...${user.wallet_address.slice(-5)}`
                  : "Not Connected"}
              </Snippet>
           
          </div>
          <Button
            color="danger"
            className="mt-2 w-full font-bold shadow"
            onPress={handleLogout}
            disabled={logoutLoading}
            radius="lg"
          >
            Log out
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default Account