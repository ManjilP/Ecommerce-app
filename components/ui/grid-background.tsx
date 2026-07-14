import { cn } from "@/lib/utils";
import { useState } from "react";

export const GridBackground = ({ children, className }: { children?: React.ReactNode, className?: string }) => {
  return (
    <div className={cn("w-full relative", className)}>
      {/* Magenta Orb Grid Background, faded toward the edges */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(71,85,105,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(71,85,105,0.1) 1px, transparent 1px),
            radial-gradient(circle at 50% 60%, rgba(236,72,153,0.15) 0%, rgba(168,85,247,0.05) 40%, transparent 70%)
          `,
          backgroundSize: "40px 40px, 40px 40px, 100% 100%",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, black 0%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, black 0%, transparent 75%)",
        }}
      />
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};
