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
  accentColor = "#8A05BE",
  activeTab,
  setActiveTab,
  className
}) => {
  return (
    <nav
      className={cn("menu md:hidden", className)}
      role="navigation"
      style={{ '--primary': accentColor } as React.CSSProperties}
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
            <div className="menu__icon">
              <IconComponent className="icon w-6 h-6" />
            </div>
            <strong className={cn("menu__text", isActive && "active")}>
              {item.label}
            </strong>
          </button>
        );
      })}
    </nav>
  );
};

export { InteractiveMenu };
