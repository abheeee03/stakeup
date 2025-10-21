"use client"
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

function pad(num: number) {
  return num.toString().padStart(2, '0');
}

type ChallengeType = {
  id: string,
  created_at: string,
  creator_id: string,
  title: string,
  description: string,
  duration_days: string,
}

function TimerSession() {
  const params = useParams<{ id: string }>();
  const challengeId = params.id as string;
  const supabase = React.useMemo(() => createClient(), []);
  const [isPaused, setIsPaused] = useState(true);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [challenge, setChallenge] = useState<ChallengeType | null>(null)
  const [loading, setLoading] = useState(true);
  // Store session-related info in refs to prevent re-renders on every tick
  const sessionIdRef = useRef<string | null>(null);
  const [mounted, setMounted] = useState(false)
  const sessionStartRef = useRef<string | null>(null);

  // State for today focused total seconds
  const [todayFocused, setTodayFocused] = useState(0);

  // Store current userId for easy access
  const [userId, setUserId] = useState<string | null>(null);

  // Find participant_id for current user in this challenge
  const fetchParticipantId = useCallback(async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return null;
    setUserId(user.id);
    // Find participant by user id and challenge id
    return user.id;
  }, [supabase, challengeId]);

  const fetchChallenge = async () =>{
    const {data, error} = await supabase
    .from("challenges")
    .select("*")
    .eq("id", challengeId)
    if(data){
      setChallenge(data[0])
      setLoading(false)
    }
  }

  // Fetch all focus sessions for current user and challenge, and compute today's focused time
  const fetchTodayFocus = useCallback(async (currUserId: string) => {
    // Get today at midnight in user's local time as ISO
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    // Get ISO but just the start of the day
    const todayISO = todayMidnight.toISOString();

    const { data, error } = await supabase
      .from('focus_sessions')
      .select('duration_seconds,start_time,end_time,is_active,participant_id,challenge_id')
      .eq('participant_id', currUserId)
      .eq('challenge_id', challengeId)
      .or(`start_time.gte.${todayISO},end_time.gte.${todayISO}`) // One or both could be in today

    if (!data || error) {
      setTodayFocused(0);
      return;
    }

    let total = 0;
    const nowEpoch = Math.floor(Date.now() / 1000);

    for (let session of data) {
      // Only count those in today
      const start = Date.parse(session.start_time);
      // If end_time is missing (active), count up to now
      const end = session.end_time ? Date.parse(session.end_time) : Date.now();

      // Only count if end >= today midnight
      // session overlaps today if it started after todayMidnight, or ends after todayMidnight
      if (end > todayMidnight.getTime()) {
        // Find the overlap interval between [start, end] and [todayMidnight, now]
        const overlapStart = Math.max(start, todayMidnight.getTime());
        const overlapEnd = Math.min(end, Date.now());
        let seconds = Math.floor((overlapEnd - overlapStart) / 1000);

        // If session is active, update to now
        if (!session.end_time && session.is_active && overlapEnd === Date.now()) {
          seconds = Math.floor((Date.now() - overlapStart) / 1000);
        }

        // duration_seconds field may be more accurate for finished sessions and (start >= todayMidnight)
        // But we only want to count time that happened after todayMidnight.
        // If full session is in today, can use duration_seconds (for finished);
        // If partial overlap, must calculate duration.

        // Only add if overlap positive
        if (seconds > 0) {
          total += seconds;
        }
      }
    }
    setTodayFocused(total);
  }, [supabase, challengeId]);

  // Start a new focus_session in supabase
  const startSession = useCallback(async () => {
    const participantId = await fetchParticipantId();
    if (!participantId) return;
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('focus_sessions')
      .insert([{
        participant_id: participantId,
        start_time: now,
        challenge_id: challengeId,
        is_active: true,
      }])
      .select('id,start_time')
      .single();
    if (!error && data) {
      sessionIdRef.current = data.id;
      sessionStartRef.current = data.start_time;
      // On new session, also update today's focus on next tick
      fetchTodayFocus(participantId);
    }
  }, [fetchParticipantId, challengeId, supabase, fetchTodayFocus]);

  // End the current focus_session in supabase
  const endSession = useCallback(async (durationOverride?: number) => {
    if (!sessionIdRef.current || !sessionStartRef.current || !userId) return;
    const endTimeISO = new Date().toISOString();
    const durationSeconds = typeof durationOverride === 'number'
      ? durationOverride
      : Math.floor((Date.now() - Date.parse(sessionStartRef.current)) / 1000);
    await supabase
      .from('focus_sessions')
      .update({
        end_time: endTimeISO,
        duration_seconds: durationSeconds,
        is_active: false
      })
      .eq('id', sessionIdRef.current);

    // Clear refs
    sessionIdRef.current = null;
    sessionStartRef.current = null;
    // Also update today's focus after ending
    fetchTodayFocus(userId);
  }, [supabase, userId, fetchTodayFocus]);

  // Handle timer logic and database sync
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (!isPaused) {
      // Start session if not started
      if (!sessionIdRef.current) {
        startSession();
      }
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      // Paused - update end_time and duration in supabase for the last session
      if (sessionIdRef.current && sessionStartRef.current) {
        endSession(seconds);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused]);

  // Reset session: finish previous, clear, start new
  useEffect(() => {
    async function reset() {
      // End previous session if one existed
      if (sessionIdRef.current && sessionStartRef.current) {
        await endSession(seconds);
      }
      setSeconds(0);
      // For visual reset, we don't want it to auto-resume if was paused
      if (!isPaused) startSession();
      // also refresh today's focus (session might be removed/ re-started)
      if (userId) await fetchTodayFocus(userId);
    }
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTrigger]);

  // On unmount, cleanup active session if not finished
  useEffect(() => {
    fetchChallenge();
    setMounted(true);

    // Ensure we get userId and today's focus
    (async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user && user.id) {
        setUserId(user.id);
        await fetchTodayFocus(user.id);
      }
    })();

    return () => {
      if (sessionIdRef.current && sessionStartRef.current && userId) {
        // Don't care about awaiting
        endSession(seconds);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update today focus on timer tick if active
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (!isPaused && userId) {
      interval = setInterval(() => {
        fetchTodayFocus(userId);
      }, 15000); // every 15 seconds (not every tick for perf)
    }
    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused, userId]);

  const handleReset = () => {
    setResetTrigger((prev) => prev + 1);
  };

  // Handle hours, minutes, and seconds for formatting
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const displaySeconds = seconds % 60;
  // Show as HH:MM:SS if hours > 0; otherwise MM:SS
  const timeString =
    hours > 0
      ? `${pad(hours)}:${pad(minutes)}:${pad(displaySeconds)}`
      : `${pad(minutes)}:${pad(displaySeconds)}`;

  // Format todayFocused to HH:MM:SS or MM:SS
  const tfHours = Math.floor(todayFocused / 3600);
  const tfMinutes = Math.floor((todayFocused % 3600) / 60);
  const tfSeconds = todayFocused % 60;
  const todayFocusString =
    tfHours > 0
      ? `${pad(tfHours)}:${pad(tfMinutes)}:${pad(tfSeconds)}`
      : `${pad(tfMinutes)}:${pad(tfSeconds)}`;

  if(!mounted){return null}
  if(loading){
    return <div className="h-screen w-full flex items-center justify-center">loading..</div>
  }

  return (
    <>
      <div className="fixed w-full px-8 py-4 z-10 flex items-center justify-between">
        <Link href={`/challenge/${challenge?.id}`}>
        <h1 className='text-lg'>{challenge?.title}</h1>
        </Link>
        <span>
          today focused:{" "}
          <span className="font-mono text-black/80 text-base">{todayFocusString}</span>
        </span>
      </div>

      <div className="relative flex h-screen overflow-hidden w-full flex-col items-center justify-center bg-[#f5f4f3] text-black">
        <div className="font-bebas-neue text-[20vw] tracking-tight select-none">
          {timeString}
        </div>
        <div className="flex w-fit items-center gap-2">
          <motion.button
            aria-label="Pause timer"
            onClick={() => setIsPaused((p) => !p)}
            whileTap={{ scale: 0.9 }}
            className="hover:bg-[#ff3828 flex h-10 w-10 items-center justify-center rounded-full bg-[#ff3828] transition-colors"
          >
            <AnimatePresence initial={false} mode="wait">
              {isPaused ? (
                <motion.svg
                  key="play"
                  initial={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
                  transition={{ duration: 0.1 }}
                  viewBox="0 0 12 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 fill-current text-[#f5f4f3]"
                >
                  <path d="M0.9375 13.2422C1.25 13.2422 1.51562 13.1172 1.82812 12.9375L10.9375 7.67188C11.5859 7.28906 11.8125 7.03906 11.8125 6.625C11.8125 6.21094 11.5859 5.96094 10.9375 5.58594L1.82812 0.3125C1.51562 0.132812 1.25 0.015625 0.9375 0.015625C0.359375 0.015625 0 0.453125 0 1.13281V12.1172C0 12.7969 0.359375 13.2422 0.9375 13.2422Z" />
                </motion.svg>
              ) : (
                <motion.svg
                  key="pause"
                  initial={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
                  transition={{ duration: 0.1 }}
                  viewBox="0 0 10 13"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 fill-current text-[#f5f4f3]"
                >
                  <path d="M1.03906 12.7266H2.82031C3.5 12.7266 3.85938 12.3672 3.85938 11.6797V1.03906C3.85938 0.328125 3.5 0 2.82031 0H1.03906C0.359375 0 0 0.359375 0 1.03906V11.6797C0 12.3672 0.359375 12.7266 1.03906 12.7266ZM6.71875 12.7266H8.49219C9.17969 12.7266 9.53125 12.3672 9.53125 11.6797V1.03906C9.53125 0.328125 9.17969 0 8.49219 0H6.71875C6.03125 0 5.67188 0.359375 5.67188 1.03906V11.6797C5.67188 12.3672 6.03125 12.7266 6.71875 12.7266Z" />
                </motion.svg>
              )}
            </AnimatePresence>
          </motion.button>
          <button
            aria-label="Reset timer"
            onClick={handleReset}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/45 text-[#ff3828] shadow-2xl transition-colors hover:bg-white/70"
          >
            <Plus className="rotate-45" />
          </button>
        </div>
      </div>
    </>
  );
}

export default TimerSession