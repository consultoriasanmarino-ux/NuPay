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
      className={cn("menu", className)}
      role="navigation"
    >
      {items.map((item) => {
        const isActive = item.id === activeTab;
        const IconComponent = item.icon;

        return (
          <button
            key={item.label}
            className={cn("menu__item", isActive && "active")}
            onClick={() => setActiveTab(item.id)}
          >
            <IconComponent className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
            <span className="text-[8px] font-mono tracking-widest uppercase mt-1">
              {item.label}
            </span>
            {isActive && (
              <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary glow-primary" />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export { InteractiveMenu };
