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
  owner: string,
  status: string
}

function JoinPage() {
  const params = useParams<{ invite: string }>()
  const [challenge, setChallenge] = useState<ChallengeType | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const getChallenge = async ()=>{
    setLoading(true)
    const {data} = await supabase
    .from("challenges")
    .select("*")
    .eq("invite_code", params.invite)
    if(data){
      setLoading(false)
      console.log(data);
      setChallenge(data[0])
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
      .from("participants")
      .insert({
        challenge_id: challenge?.id,
        userID: user.data.user?.id
      })
      if(data){
        router.push(`/challenge/${params.invite}`)
      } else {
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
    <div className='h-screen w-full flex items-center justify-center'>
      <div className="h-90 w-90 border rounded-xl flex items-center justify-center flex-col gap-4">
        <h1 className='text-xl text-center'>
          code : {params.invite}
        </h1> 
        <Button 
        onPress={handelJoinChallenge}
        variant='solid'>
          Join
        </Button>
        <Button variant='solid'>
          Cancel
        </Button>
      </div>
    </div>
  )
}

export default JoinPage