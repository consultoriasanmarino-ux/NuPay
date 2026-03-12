"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface BeamPath {
  path: string;
  gradientConfig: {
    initial: {
      x1: string;
      x2: string;
      y1: string | number;
      y2: string | number;
    };
    animate: {
      x1: string | string[];
      x2: string | string[];
      y1: string | number | (string | number)[];
      y2: string | number | (string | number)[];
    };
    transition?: any;
  };
  connectionPoints?: Array<{
    cx: number;
    cy: number;
    r: number;
  }>;
}

interface PulseBeamsProps {
  children?: React.ReactNode;
  className?: string;
  background?: React.ReactNode;
  beams: BeamPath[];
  width?: number;
  height?: number;
  baseColor?: string;
  accentColor?: string;
  gradientColors?: {
    start: string;
    middle: string;
    end: string;
  };
}

export const PulseBeams = ({
  children,
  className,
  background,
  beams,
  width = 858,
  height = 434,
  baseColor = "rgba(130, 10, 209, 0.1)",
  accentColor = "rgba(130, 10, 209, 0.2)",
  gradientColors = {
    start: "#820AD1",
    middle: "#9B30D9",
    end: "#6B07AB"
  },
}: PulseBeamsProps) => {
  return (
    <div
      className={cn(
        "w-full h-screen relative flex items-center justify-center antialiased overflow-hidden bg-[#0a0a0f]",
        className
      )}
    >
      {background}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
        <SVGs
          beams={beams}
          width={width}
          height={height}
          baseColor={baseColor}
          accentColor={accentColor}
          gradientColors={gradientColors}
        />
      </div>
      <div className="relative z-10 w-full flex items-center justify-center">{children}</div>
    </div>
  );
};

const SVGs = ({ beams, width, height, baseColor, accentColor, gradientColors }: PulseBeamsProps) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex flex-shrink-0"
    >
      {beams.map((beam: BeamPath, index: number) => (
        <React.Fragment key={index}>
          <path
            d={beam.path}
            stroke={baseColor}
            strokeWidth="1"
          />
          <path
            d={beam.path}
            stroke={`url(#grad${index})`}
            strokeWidth="2"
            strokeLinecap="round"
          />
          {beam.connectionPoints?.map((point: any, pointIndex: number) => (
            <circle
              key={`${index}-${pointIndex}`}
              cx={point.cx}
              cy={point.cy}
              r={point.r}
              fill={baseColor}
              stroke={accentColor}
              strokeWidth="1"
            />
          ))}
        </React.Fragment>
      ))}

      <defs>
        {beams.map((beam: BeamPath, index: number) => (
          <motion.linearGradient
            key={index}
            id={`grad${index}`}
            gradientUnits="userSpaceOnUse"
            initial={beam.gradientConfig.initial}
            animate={beam.gradientConfig.animate as any}
            transition={beam.gradientConfig.transition}
          >
            <GradientColors colors={gradientColors!} />
          </motion.linearGradient>
        ))}
      </defs>
    </svg>
  );
};

const GradientColors = ({ colors }: { colors: { start: string, middle: string, end: string } }) => {
  return (
    <>
      <stop offset="0%" stopColor={colors.start} stopOpacity="0" />
      <stop offset="20%" stopColor={colors.start} stopOpacity="1" />
      <stop offset="50%" stopColor={colors.middle} stopOpacity="1" />
      <stop offset="100%" stopColor={colors.end} stopOpacity="0" />
    </>
  );
};
