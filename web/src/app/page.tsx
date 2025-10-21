"use client"
import { Button } from '@heroui/button'
import { useTransform, motion, useScroll } from 'framer-motion';
import ReactLenis from 'lenis/react';
import { ArrowRightIcon, XIcon } from 'lucide-react';
import Link from 'next/link'
import { useRouter } from 'next/navigation';
import React, { useRef } from 'react'
import { BiWorld } from 'react-icons/bi';
import { FaXTwitter } from 'react-icons/fa6';
import { IoIosMail } from 'react-icons/io';

const FeatureCard = ({
  i,
  title,
  content,
  color,
  progress,
  range,
  targetScale,
}: {
  i: number;
  title: string;
  content: string;
  color: string;
  progress: any;
  range: [number, number];
  targetScale: number;
}) => {
  const container = useRef<HTMLDivElement>(null);

  const scale = useTransform(progress, range, [1, targetScale]);

  // The Tailwind syntax bg-[${color}] is not valid, so use inline style for backgroundColor
  return (
    <div
      ref={container}
      className="sticky top-0 flex items-center justify-center"
    >
      <motion.div
        style={{
          scale,
          top: `calc(-5vh + ${i * 20 + 250}px)`,
          backgroundColor: color, 
        }}
        className="rounded-4xl relative -top-1/4 flex h-[400px] w-[600px] origin-top flex-col overflow-hidden px-9 text-center items-center justify-center gap-4 shadow-xl"
      >
        <h2 className='text-xl font-medium'>{title}</h2>
        <p className='text-3xl font-semibold'>
          {content}
        </p>
      </motion.div>
    </div>
  );
};

function Landing() {

  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  
const projects = [
  {
    title: "Stake Your Focus",
    content: "Put your SOL. Lock in your stake, stay focused, and watch your consistency literally pay off.",
    color: "#AB9FF2"
  },
  {
    title: "Focus Rooms",
    content: "Chill zones for real grinders. Set your timer, go heads-down, and let your streak flex do the talking.",
    color: "#FFDADC"
  },
  {
    title: "Squad Challenges",
    content: "Invite your homies, set the bet, and see who blinks first. Friendly fire but make it productive.",
    color: "#E9E8EA"
  },
  {
    title: "Live Leaderboards",
    content: "Real-time rankings so you can see who’s locked in and who’s doom-scrolling. Stay on top, stay bragging.",
    color: "#FFDADC"
  }
];

const router = useRouter()

  return (
    <>
    <div className="fixed w-full px-20 py-6 flex items-center justify-between z-20">
        <h1 className="text-xl">stakeup</h1>
       
        <div className="">
          <Button
          color='primary'
          onPress={()=>{
            router.push('/connect')
          }}
          >
            Get Started
          </Button>
        </div>
    </div>
    <div className="h-screen w-full flex flex-col items-center justify-center gap-3 bg-[#F5F2FF]">
      <span className="text-2xl text-[#61577C] leading-none tracking-tight">introducing stakup</span>
      <div className="text-8xl text-[#3C315B] text-center tracking-tighter mb-10">
      <h1>
      Bet on consistency
      </h1>
      <h1>
      earn with focus.
      </h1>
      </div>
      <Link href={'/connect'}>
      <button
      className='flex items-center justify-center gap-2 px-10 py-3 font-medium hover:text-white hover:bg-[#AB9FF2] bg-white cursor-pointer rounded-xl text-xl transition-all duration-300'
      >
        Get Started <ArrowRightIcon/>
      </button>
        </Link>
    </div>
    <div id="features">
    <ReactLenis root>
      <main
        ref={container}
        className="relative bg-[#F5F2FF] flex w-full flex-col items-center justify-center pb-[100vh] pt-[50vh]"
      >
        <div className="absolute left-1/2 top-[10%] grid -translate-x-1/2 content-start justify-items-center gap-6 text-center">
          <div className="tracking-tighter text-7xl">
          <h2>
          What Makes
          </h2>
          <h2>
            Stakeup a Total W
          </h2>
          </div>
        </div>
        {projects.map((project, i) => {
          const targetScale = Math.max(
            0.5,
            1 - (projects.length - i - 1) * 0.1,
          );
          return (
            <FeatureCard
              key={`p_${i}`}
              i={i}
              {...project}
              progress={scrollYProgress}
              range={[i * 0.25, 1]}
              targetScale={targetScale}
            />
          );
        })}
      </main>
    </ReactLenis>
    </div>
    <div className="w-full bg-[#F5F2FF] px-5 py-5 overflow-hidden">
      <div className="w-full border-t-1 border-default-200 bg-white flex flex-col items-center justify-center shadow rounded-xl py-10 px-10">
        <span className='text-9xl relative font-medium opacity-90 tracking-tighter'>
          stakeup
        </span>
        <div className="flex items-center justify-center gap-3 mt-4">
          <Link href={'/'}>
            <FaXTwitter size={20} />
          </Link>
          <Link href={'/'}>
            <IoIosMail size={26} />
          </Link>
          <Link href={'/'}>
            <BiWorld size={26} />
          </Link>
        </div>
    </div>
      </div>
    </>
  )
}

export default Landing