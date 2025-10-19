"use client";

import NumberFlow from "@number-flow/react";
import React from "react";

type Skiper37Props = {
  count: number;
  label?: string;
};

const Skiper37 = ({ count, label = "Countdown" }: Skiper37Props) => {
  return (
    <section className="relative h-[calc(100vh-1rem)] w-full snap-y snap-mandatory overflow-y-scroll bg-[#f5f4f3]">
      <div className="relative flex h-screen w-full flex-col items-center justify-center bg-[#f5f4f3] text-black">
        <div className="top-22 absolute left-1/2 grid -translate-x-1/2 content-start justify-items-center gap-6 text-center text-black">
          <span className="relative max-w-[12ch] text-xs uppercase leading-tight opacity-40 after:absolute after:left-1/2 after:top-full after:h-16 after:w-px after:bg-gradient-to-b after:from-[#f5f4f3] after:to-black after:content-['']">
            {label}
          </span>
        </div>
        <div className="font-bebas-neue text-[20vw] tracking-tight">
          <NumberFlow value={count} prefix={count < 60 ? "0:" : ""} />
        </div>
      </div>
    </section>
  );
};

export { Skiper37 };
