import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

export const AppHeader = () => {
  const location = useLocation();
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 40;
      const y = (e.clientY / window.innerHeight - 0.5) * 40;
      if (glowRef.current) {
        glowRef.current.style.setProperty("--glow-x", `${x}px`);
        glowRef.current.style.setProperty("--glow-y", `${y}px`);
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="relative overflow-hidden">
      <div className="ambient-glow -top-24 -left-24 absolute" ref={glowRef} />
      <div className={cn("w-full rounded-lg p-4 mb-6 border bg-card/80 backdrop-blur surface-gradient")}
        aria-label="Navigation">
        <nav className="container mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2" aria-label="Driver Tracker Home">
            <div className="h-8 w-8 rounded-md bg-gradient-hero" />
            <span className="font-semibold">Klagenfurt Driver Tracker</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant={isActive("/") ? "default" : "secondary"} asChild>
              <Link to="/">Dashboard</Link>
            </Button>
            <Button variant={isActive("/yearly") ? "default" : "secondary"} asChild>
              <Link to="/yearly">Yearly Analysis</Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default AppHeader;
