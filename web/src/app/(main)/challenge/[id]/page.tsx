"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { addToast } from "@heroui/toast";
import { Button } from "@heroui/button";
import { Card, CardBody, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Skeleton, Snippet, Tooltip, useDisclosure, User } from "@heroui/react";

type User = {
  id: string;
  username: string;
  avatar_url: string | null;
  wallet_address: string;
};

type Participant = {
  id: string;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  total_focus_time: number;
  is_winner: boolean;
  joined_at: string;
  rank: number | null;
  stake_status: string;
};

type Challenge = {
  id: string;
  title: string;
  description: string;
  status: "pending" | "active" | "completed";
  creator: User;
  created_at: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  stake_amount: number;
  invite_code: string;
};

function StreakCard(){
  return <div className="flex flex-col">
    <Tooltip
    color="foreground"
    content="Focused 2 Hrs"
    >
     <Card>
        <div className="bg-green-900 h-10 w-10"></div>
      </Card>
    </Tooltip>
      <p className="text-sm text-center font-medium">
          Day 1
      </p>
  </div>
}

function UserCard({name, streak, time}:{name: string,streak: string, time: number}){
  return <User
  avatarProps={{
    name: name
  }}
  description={
    <>
      <span>Streak: {streak}, Todays Focused Time: {time}</span>
    </>
  }
  name={name}
/>
}


export default function ChallengePage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const challengeId = params.id as string;
  const invite = search.get("invite");
  const supabase = useMemo(() => createClient(), []);
  const {isOpen, onOpen, onClose} = useDisclosure();
  // Main challenge/page state
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter()
  // Fetch challenge and participants
  useEffect(() => {
    if (!challengeId) return;

    let mounted = true;

    async function init() {
      setLoading(true);
      // Fetch current user
      const { data: { user } } = await supabase.auth.getUser();
      let myProfile: User | null = null;
      if (user) {
        // Get user profile info
        const { data: userData } = await supabase
          .from("users")
          .select("id,username,avatar_url,wallet_address")
          .eq("id", user.id)
          .maybeSingle();
        if (userData) myProfile = userData as User;
      }
      if (mounted) setMe(myProfile);

      // Fetch challenge info with creator attached
      const { data: challengeData, error: challengeErr } = await supabase
        .from("challenges")
        .select(`
          *,
          creator:creator_id(id,username,avatar_url,wallet_address)
        `)
        .eq("id", challengeId)
        .maybeSingle();
      if (challengeErr) addToast({ title: "Challenge not found" });
      if (!challengeData) return setLoading(false);
      if (mounted) setChallenge(challengeData as Challenge);
      // Fetch participants, their user profile, focus time, etc
      const { data: participantData } = await supabase
        .from("challenge_participants")
        .select(`
          id,
          user:user_id(id,username,avatar_url),
          total_focus_time,
          is_winner,
          joined_at,
          rank,
          stake_status
        `)
        .eq("challenge_id", challengeId)
        .order("joined_at", { ascending: true });
          //@ts-ignore
      if (mounted) setParticipants((participantData ?? []) as Participant[]);
        
      // Join if invited & not already in participants
      if (
        invite &&
        myProfile &&
        !Boolean(participantData?.some((p) => p.user[0].id === myProfile?.id))
      ) {
        // Try joining
        const { error } = await supabase
          .from("challenge_participants")
          .upsert({
            challenge_id: challengeId,
            user_id: myProfile.id,
          });
        if (!error) {
          addToast({
            title: "You joined the challenge!",
            description: `Good luck, ${myProfile.username}!`,
          });
        }
      }

      setLoading(false);
    }
    init();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId]);

  // Calculate focus leaderboard (descending)
  const focusLeaderBoard = [...participants]
    .sort((a, b) => b.total_focus_time - a.total_focus_time)
    .map((p, idx) => ({
      ...p,
      position: idx + 1,
    }));  

  return (
    <>
    <div className="fixed w-full flex items-center justify-between px-4 py-3">
    <span className="font-medium">Total Pool: 2 SOL</span>
      <button onClick={onOpen} className="cursor-pointer">
        Invite Friends
      </button>
    </div>
    <Modal isOpen={isOpen} size={"md"} onClose={onClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Invite Friends</ModalHeader>
              <ModalBody>
                <h2>Share this Link</h2>
                <Snippet
                hideSymbol
                  tooltipProps={{
                    color: "foreground",
                    content: "Copy this snippet",
                    disableAnimation: true,
                    placement: "right",
                    closeDelay: 0,
                  }}
                >
                 <span>
                   {process.env.NEXT_PUBLIC_BASE_URL}/join/{challenge?.invite_code}
                  </span>
              </Snippet>
              </ModalBody>
              <ModalFooter>
                <Button color="success" onPress={onClose}>
                  Done
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    <div className="min-h-screen w-full px-40 py-16 flex items-center justify-start flex-col">
        <div className="pb-7 w-full flex items-center justify-between border-b-2 border-default-200">
          <Skeleton className="rounded-xl" isLoaded={!loading}>
            <div className="flex flex-col">
              <h1 className="text-3xl font-semibold">{challenge?.title}</h1>
              <p className="text-default-600 text-xl">{challenge?.description}</p>
              
            </div>
          </Skeleton>
            <div className="">
              <Button onPress={()=>{
                router.push(`/timer/${challenge?.id}`)
              }} color="primary">
                Start Focusing
              </Button>
            </div>
        </div>

        <div className="w-full min-h-72 flex flex-col items-start justify-start py-3">
        

          <h1 className="text-xl font-medium">
             Your Streak
          </h1>

          <div className="mt-4 flex flex-wrap gap-8">
           <StreakCard/>
           <StreakCard/>
           <StreakCard/>
          </div>
        </div>

        <div className="flex flex-col items-start justify-start w-full min-h-72">
          <h1 className="text-xl font-medium">Other Participants</h1>
          <div className="mt-4 flex flex-col gap-8">
            {
              participants.map((user)=>{
                return <UserCard
                name={user.user.username}
                streak={"0"}
                time={user.total_focus_time}
                />
              })
            }
          </div>
        </div>
    </div>
    </>
  );
}