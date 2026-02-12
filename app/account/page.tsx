import dynamic from 'next/dynamic';

const Account = dynamic(() => import('@/views/account'));

const AccountPage = () => <Account />;

export default AccountPage;
