import type { NextPage } from 'next';

import { SEO } from '@/components';
import Account from '@/views/account';

const AccountPage: NextPage = () => (
  <>
    <SEO />
    <Account />
  </>
);

export default AccountPage;
