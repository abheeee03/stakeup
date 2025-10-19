"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Avatar, AvatarGroup, AvatarIcon } from "@heroui/avatar";
import { Badge } from "@heroui/badge";
import { Tooltip } from "@heroui/tooltip";
import { Tabs, Tab } from "@heroui/tabs";
import { addToast } from "@heroui/toast";
import { Button } from "@heroui/button";
import { Skeleton } from "@heroui/react";

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
};

function secondsToHMS(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [
    h > 0 ? `${h}h` : null,
    m > 0 ? `${m}m` : null,
    `${sec}s`
  ].filter(Boolean).join(" ");
}

function statusColor(status: Challenge["status"]) {
  switch (status) {
    case "pending":
      return "warning";
    case "active":
      return "primary";
    case "completed":
      return "success";
    default:
      return "default";
  }
}

export default function ChallengePage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const challengeId = params.id as string;
  const invite = search.get("invite");
  const supabase = useMemo(() => createClient(), []);

  // Main challenge/page state
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
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
    <div className="min-h-screen w-full px-40 py-12 flex items-center justify-start flex-col">
        <div className="pb-7 w-full flex items-center justify-between border-b-2 border-default-200">
          <Skeleton className="rounded-xl" isLoaded={!loading}>
            <div className="flex flex-col">
              <h1 className="text-3xl font-semibold">{challenge?.title}</h1>
              <p className="text-default-600 text-xl">{challenge?.description}</p>
            </div>
          </Skeleton>
            <div className="">
              <Button color="primary">
                Start Focusing
              </Button>
            </div>
        </div>

        <div className="">
          
        </div>
    </div>
  );
}