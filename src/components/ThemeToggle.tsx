
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const isDark = theme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <div className="flex items-center space-x-2">
      <Sun className="h-[1.5rem] w-[1.5rem]" />
      <Switch 
        id="theme-switch" 
        checked={isDark} 
        onCheckedChange={toggleTheme}
        aria-label="Toggle theme"
      />
      <Moon className="h-[1.5rem] w-[1.5rem]" />
    </div>
  )
}

    