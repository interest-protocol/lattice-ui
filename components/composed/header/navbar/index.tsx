'use client';

import { Div, Nav, Span } from '@stylin.js/elements';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { FC } from 'react';

import { ExternalLinkSVG } from '@/components/ui/icons';
import { NAV_ITEMS, NAV_ITEMS_TITLE, Routes } from '@/constants/routes';

const Navbar: FC = () => {
  const pathname = usePathname();

  return (
    <Nav display={['none', 'none', 'none', 'flex']} gap="2.5rem">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === Routes[item];
        return (
          <Link key={item} href={Routes[item]}>
            <Span
              color={isActive ? '#A78BFA' : '#FFFFFF80'}
              cursor="pointer"
              nHover={{ color: '#A78BFA' }}
            >
              {NAV_ITEMS_TITLE[item]}
            </Span>
          </Link>
        );
      })}
      <Link target="_blank" href="https://docs.lattice.trade">
        <Div
          gap="0.5rem"
          display="flex"
          color="#FFFFFF80"
          alignItems="center"
          nHover={{ color: '#A78BFA' }}
        >
          <Span>Docs</Span>
          <ExternalLinkSVG maxWidth="1rem" width="100%" />
        </Div>
      </Link>
    </Nav>
  );
};

export default Navbar;
