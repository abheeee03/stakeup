"use client"
import { createClient } from '@/utils/supabase/client'
import { Button } from '@heroui/button'
import { addToast } from '@heroui/toast'
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

type ChallengeType = {
  title: string,
  invite_code: string,
  min_players: string,
  id: number,
  creator: {
    username: string,
    id: string,
    wallet_address: string
  }
  creator_id: string,
  duration_days: string,
  stake_amount: string,
  status: string,
  description: string
}

function JoinPage() {
  const params = useParams<{ invite: string }>()
  const [challenge, setChallenge] = useState<ChallengeType | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const getChallenge = async ()=>{
    setLoading(true)
    const { data, error } = await supabase
      .from("challenges")
      .select("*, creator:users(id, username, wallet_address)") // join users table on creator_id
      .eq("invite_code", params.invite)

    if (data && data.length > 0) {
      setLoading(false)
      console.log(data)
      // attach challenge and its creator details
      setChallenge({
        ...data[0],
        creator: data[0].creator
      })
      return
    }

    router.push('/404')

  }


  useEffect(() => {
    getChallenge()
  }, [])
  
  const handelJoinChallenge = async ()=>{
    const user = await supabase.auth.getUser()
    try{
      const {data, error} = await supabase
      .from("challenge_participants")
      .insert({
        challenge_id: challenge?.id,
        user_id: user.data.user?.id
      })
      if(data){
        router.push(`/challenge/${params.invite}`)
      } else {
        console.log(error);        
        addToast({
          title: "please try again!"
        })
      }
      
    } catch (err){
      addToast({
        title: "Something went wrong"
      })
    }
  }

  if(loading){
    return <div className="h-screen w-full text-center">loading....</div>
  }

  return (
    <div className='h-screen w-full flex items-start justify-center'>
      <div className="h-90 w-90 flex items-center justify-center flex-col gap-4">
        <div className="text-center">
          <h1 className="text-sm">You are Invited for a challenge!</h1>
          <div className="mt-4 flex flex-col gap-3">
          <h1 className='text-3xl font-medium'>{challenge?.title}</h1>
          <p className='text-default-700'>{challenge?.description}</p>
          <span>Created by : {challenge?.creator.username}</span>
          <span>Stake Amount: {challenge?.stake_amount} SOL</span>
          </div>

        </div>
        <div className="flex gap-3">
        <Button 
        onPress={handelJoinChallenge}
        color='primary'
        >
          Join
        </Button>
        <Button variant='solid'>
          Cancel
        </Button>
        </div>
      </div>
    </div>
  )
}

export default JoinPage