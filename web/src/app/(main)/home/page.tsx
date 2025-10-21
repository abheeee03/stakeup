"use client"
import { createClient } from '@/utils/supabase/client'
import { Avatar, Card, CardBody } from '@heroui/react'
import { addToast } from '@heroui/toast'
import { User as UserType } from '@supabase/supabase-js'
import { BellIcon, SearchIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

type Challenge = {
  id: string
  creator_id: string
  title: string
  description: string | null
  stake_amount: string
  duration_days: number
  start_date: string
  end_date: string | null
  status: 'pending' | 'active' | 'completed'
  onchain_challenge_pubkey: string | null
  created_at: string
}

const ChallengeCard = ({
  id,
  title,
  description,
  stake_amount,
  status,
  duration_days,
  start_date,
  end_date,
}: Challenge) => {
  return (
    <Card className="max-w-[400px] w-80 m-2">
      <CardBody>
        <h1 className="text-lg font-bold mb-1">{title}</h1>
        <span className={`text-xs capitalize rounded px-2 py-0.5 text-white ${status === 'active' ? "bg-blue-500" : status === 'completed' ? "bg-green-500" : "bg-yellow-500"}`}>
          {status}
        </span>
        <p className="text-sm mt-2 mb-1">{description || <i>No description</i>}</p>
        <div className="text-sm mb-1">
          <strong>Stake:</strong> {stake_amount}
        </div>
        <div className="text-xs mb-1">
          <strong>Duration:</strong> {duration_days} day{duration_days > 1 ? "s" : ""}
        </div>
        <div className="text-xs mb-2">
          <strong>Start:</strong> {start_date}
          {end_date ? <> <strong> &ndash; </strong> {end_date}</> : null}
        </div>
        <Link className="text-xs text-blue-600 underline" href={`/challenge/${id}`}>
          View More
        </Link>
      </CardBody>
    </Card>
  )
}

function Home() {
  const [user, setUser] = useState<UserType | null>(null)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  const getUserAndChallenges = async () => {
    setLoading(true)
    const session = await supabase.auth.getSession()
    if (!session.data.session) {
      router.push('/connect')
      addToast({
        title: "Please Login First"
      })
      return
    }
    const currentUser = session.data.session.user
    setUser(currentUser)
    // Fetch challenges created by this user (as creator_id)
    const { data: chals, error } = await supabase
      .from('challenges')
      .select('id, creator_id, title, description, stake_amount, duration_days, start_date, end_date, status, onchain_challenge_pubkey, created_at')
      .eq('creator_id', currentUser.id)
      .order('created_at', { ascending: false })

    if (error) {
      addToast({ title: "Error loading challenges" })
      setChallenges([])
    } else {
      setChallenges(chals || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    getUserAndChallenges()
    // eslint-disable-next-line
  }, [])

  return (
    <>
      <div className="fixed w-full flex items-center justify-between px-5 py-3 bg-white z-10">
        <div className="font-medium tracking-wide text-lg">StakeUp</div>
        <div className="flex items-center justify-center gap-5">
          <Link href={'/create'} className="text-sm font-medium px-2 py-1 rounded hover:bg-slate-100 transition">
            Create Challenge
          </Link>
          <button>
            <SearchIcon size={17} />
          </button>
          <button>
            <BellIcon size={17} />
          </button>
          <button
          className='cursor-pointer'
          onClick={()=>{
            router.push('/account')
          }}
          >
            <Avatar
              size='sm'
              showFallback
              name={user?.email?.[0]?.toUpperCase() ?? "U"}
            />
          </button>
        </div>
      </div>
      <div className="min-h-screen w-full py-5 px-18 ">
        <h1 className="text-xl font-medium mt-20 mb-5">Your Challenges</h1>
        {loading ? (
          <div className="w-full flex flex-wrap items-start justify-start mt-4">
            <div className="text-gray-400">Loading...</div>
          </div>
        ) : (
          <div className="w-full flex flex-wrap items-start justify-start mt-4">
            {challenges.length === 0 ? (
              <div className="text-gray-500">No challenges found. <Link href="/create" className="text-blue-600 underline">Create one?</Link></div>
            ) : (
              challenges.map(chal =>
                <ChallengeCard key={chal.id} {...chal} />
              )
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default Home