'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { FC } from 'react';

import { NAV_ITEMS, NAV_ITEMS_TITLE, Routes } from '@/constants/routes';

const Navbar: FC = () => {
  const pathname = usePathname();

  return (
    <nav className="hidden lg:flex gap-10">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === Routes[item];
        return (
          <Link
            key={item}
            href={Routes[item]}
            className="focus-ring rounded-md"
          >
            <span
              className={`cursor-pointer text-sm font-medium tracking-[0.04em] uppercase transition-colors duration-200 ${isActive ? 'text-accent' : 'text-text-secondary hover:text-text'}`}
            >
              {NAV_ITEMS_TITLE[item]}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default Navbar;
