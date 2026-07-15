import { cn } from "@/lib/utils";

export const GridBackground = ({ children, className }: { children?: React.ReactNode, className?: string }) => {
  return (
    <div className={cn("w-full relative", className)}>
      {/* Quiet brass vignette, faded toward the edges */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(ellipse 70% 50% at 50% 0%, rgba(136,115,76,0.08) 0%, transparent 70%)`,
          maskImage: "linear-gradient(to bottom, black 0%, transparent 85%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 85%)",
        }}
      />
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};
