"use client"
import { createClient } from '@/utils/supabase/client'
import { addToast } from '@heroui/toast'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

function Home() {
    const [user, setUser] = useState<User | null>(null)
    const supabase = createClient()
    const router = useRouter()
    const getUser = async ()=>{
        const session = await supabase.auth.getSession()
        if(!session.data.session){
            router.push('/connect')
            addToast({
                title: "Please Login First"
            })
            return
        }
        setUser(session.data.session.user)     
    }
    useEffect(() => {
        getUser()
    }, [])
    
    return (
    <div>
        <h1>user: {user?.id}</h1>
        <button
        onClick={async()=>{
            await supabase.auth.signOut()
            router.push('/connect');
        }}
        >
            Log Out
        </button>        
    </div>
  )
}

export default Home