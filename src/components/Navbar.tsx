import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SideDrawer } from "./SideDrawer";
import profileLogo from "@/assets/profile.png";

export function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md">
        <div className="container max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center gap-2.5">
            <img
              src={profileLogo}
              alt="Logo"
              className="w-8 h-8 rounded object-cover"
            />
            <span className="text-lg font-bold tracking-wider text-foreground uppercase">
              DEIMOS MODS™
            </span>
          </div>

          {/* Right: Hamburger */}
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="relative p-2 text-primary hover:shadow-glow transition-all duration-200 rounded"
            aria-label="Toggle menu"
          >
            {drawerOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
        {/* Glow line */}
        <div className="navbar-glow-line" />
      </nav>

      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
