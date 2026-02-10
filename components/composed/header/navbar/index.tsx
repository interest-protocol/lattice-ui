'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { FC } from 'react';

import { ExternalLinkSVG } from '@/components/ui/icons';
import { NAV_ITEMS, NAV_ITEMS_TITLE, Routes } from '@/constants/routes';

const Navbar: FC = () => {
  const pathname = usePathname();

  return (
    <nav className="hidden lg:flex gap-10">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === Routes[item];
        return (
          <Link key={item} href={Routes[item]}>
            <span
              className={`cursor-pointer hover:text-accent ${isActive ? 'text-accent' : 'text-text-muted'}`}
            >
              {NAV_ITEMS_TITLE[item]}
            </span>
          </Link>
        );
      })}
      <Link target="_blank" href="https://docs.lattice.trade">
        <div className="gap-2 flex text-text-muted items-center hover:text-accent">
          <span>Docs</span>
          <ExternalLinkSVG maxWidth="1rem" width="100%" />
        </div>
      </Link>
    </nav>
  );
};

export default Navbar;
