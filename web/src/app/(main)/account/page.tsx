"use client"
import { createClient } from '@/utils/supabase/client'
import { addToast, Avatar } from '@heroui/react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

type UserDataType = {
    username: string,
    id: string,
    wallet_address: string,
    created_at: string
}

function Account() {
    const [User, setUser] = useState<UserDataType | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const getUser = async ()=>{
        setLoading(true)
        const supabase = createClient()
        const session = await supabase.auth.getUser()
        if(!session.data.user){
            router.push('/connect')
        }
        const {data} = await supabase.from("users").select('*').eq("id", session.data.user?.id)
        if(data){
            setUser(data[0])
            setLoading(false)
        } else {
            addToast({
                title: "something went wrong!"
            })
        }
    }

    useEffect(() => {
      getUser()
    }, [])

    if(loading){
        return <div className="h-screen w-full flex items-center justify-center text-sm">loading...</div>
    }
    
  return (
    <div className='h-screen w-full flex flex-col items-start justify-start py-10 px-30'>
        <div className="flex gap-2 items-center justify-center">
            <Avatar
            showFallback
            name='A'
            />
            <div className="">
            <h2 className='text-xl font-medium'>{User?.username}</h2>
            <p className='text-sm'>connected wallet: {User?.wallet_address.slice(0, 13)}.....</p>
            </div>
        </div>
    </div>
  )
}

export default Account