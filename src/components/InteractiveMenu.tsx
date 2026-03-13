"use client";

import React from 'react';
import { cn } from "@/lib/utils";

type IconComponentType = React.ElementType<{ className?: string }>;

export interface InteractiveMenuItem {
  label: string;
  icon: IconComponentType;
  id: any;
}

export interface InteractiveMenuProps {
  items: InteractiveMenuItem[];
  accentColor?: string;
  activeTab: any;
  setActiveTab: (id: any) => void;
  className?: string;
}

const InteractiveMenu: React.FC<InteractiveMenuProps> = ({ 
  items, 
  accentColor = "var(--primary)",
  activeTab,
  setActiveTab,
  className
}) => {
  return (
    <nav
      className={cn("menu w-[92%] max-w-[450px] justify-around py-3 md:py-2 px-2", className)}
      role="navigation"
    >
      {items.map((item) => {
        const isActive = item.id === activeTab;
        const IconComponent = item.icon;

        return (
          <button
            key={item.label}
            className={cn(
              "menu__item relative flex-1 gap-1 px-2", 
              isActive && "active"
            )}
            onClick={() => setActiveTab(item.id)}
          >
            <IconComponent className={cn("w-5 h-5 transition-all duration-300", isActive ? "text-primary scale-110" : "text-muted-foreground")} />
            <span className={cn(
              "text-[7px] md:text-[8px] font-mono tracking-[0.1em] md:tracking-widest uppercase transition-opacity duration-300",
              isActive ? "opacity-100 font-extrabold text-primary" : "opacity-40"
            )}>
              {item.label}
            </span>
            {isActive && (
              <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary glow-primary animate-pulse" />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export { InteractiveMenu };
