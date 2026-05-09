'use client';

import * as React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="rounded-full">
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={theme === 'light' ? 'default' : 'outline'}
        size="sm"
        className="rounded-full gap-2"
        onClick={() => setTheme('light')}
      >
        <Sun className="h-4 w-4" />
        Light
      </Button>
      <Button
        variant={theme === 'dark' ? 'default' : 'outline'}
        size="sm"
        className="rounded-full gap-2"
        onClick={() => setTheme('dark')}
      >
        <Moon className="h-4 w-4" />
        Dark
      </Button>
      <Button
        variant={theme === 'system' ? 'default' : 'outline'}
        size="sm"
        className="rounded-full gap-2"
        onClick={() => setTheme('system')}
      >
        <Monitor className="h-4 w-4" />
        System
      </Button>
    </div>
  );
}
