import { GridBackground } from "@/components/ui/grid-background";

export default function DemoOne() {
  return (
    <GridBackground className="min-h-[400px]">
      <div className="flex items-center justify-center h-full p-10">
        <h1 className="text-4xl font-bold">Grid Background Demo</h1>
      </div>
    </GridBackground>
  );
}
