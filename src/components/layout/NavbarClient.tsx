'use client';

import { useEffect, useState } from 'react';

interface NavbarClientProps {
  children: React.ReactNode;
}

export function NavbarClient({ children }: NavbarClientProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`border-b bg-background fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'backdrop-blur-md bg-background/80 border-border/50'
          : 'bg-background'
      }`}
    >
      {children}
    </nav>
  );
}

