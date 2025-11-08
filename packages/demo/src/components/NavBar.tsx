"use client";

import { Button } from "@/components/ui/button";
import { Menu, Star, Search, Moon, Sun, ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "./ThemeProvider";
import { useEffect, useState } from "react";
// import { CommandDialog } from "@/components/ui/command";
import { Link } from "react-router";

export function Navbar() {
  const navItems = [
    { href: "/", label: "Home" },
    { href: "/docs", label: "Docs" },
    { href: "https://github.com/maskin25/captions.js", label: "Github" },
    {
      href: "https://main--68e681805917843931c33a87.chromatic.com",
      label: "Storybook",
    },
  ];

  const [stars, setStars] = useState<number | null>(null);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch("https://api.github.com/repos/maskin25/captions.js")
      .then((res) => res.json())
      .then((data) => setStars(data.stargazers_count))
      .catch(() => setStars(null));
  }, []);

  /*  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []); */

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">captions.js</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center gap-1 text-sm font-medium text-foreground/60 transition-colors hover:text-foreground"
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={
                  item.href.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
              >
                {item.label}
                {item.href.startsWith("http") && (
                  <ExternalLink className="h-4 w-4" />
                )}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Search Button */}
            {/* <Button
              variant="outline"
              size="sm"
              className="hidden md:flex items-center gap-2 bg-transparent"
              onClick={() => setOpen(true)}
            >
              <Search className="h-4 w-4" />
              <span className="text-xs text-muted-foreground">
                Search docs...
              </span>
              <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button> */}

            {/* Mobile Search Icon */}
            {/* <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setOpen(true)}
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search documentation</span>
            </Button> */}

            {/* GitHub Stars */}
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hidden sm:flex bg-transparent"
            >
              <a
                href="https://github.com/maskin25/captions.js/stargazers"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Star className="h-4 w-4" />
                {stars !== null && (
                  <span className="text-xs font-medium">
                    {stars.toLocaleString()}
                  </span>
                )}
              </a>
            </Button>

            {/* Theme Switcher */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-4 p-4">
                  {navItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-1 xt-lg font-medium text-foreground/60 transition-colors hover:text-foreground"
                    >
                      {item.label}
                      {item.href.startsWith("http") && (
                        <ExternalLink className="h-4 w-4" />
                      )}
                    </a>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Search documentation..."
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Suggestions
          </div>
          <div className="flex flex-col gap-1">
            <button className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
              Getting Started
            </button>
            <button className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
              Installation
            </button>
            <button className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
              Components
            </button>
            <button className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
              Theming
            </button>
          </div>
        </div>
      </CommandDialog> */}
    </>
  );
}
