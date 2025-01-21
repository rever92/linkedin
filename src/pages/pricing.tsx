import { NextPage } from 'next';
import Pricing from '../components/Pricing';
import { useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const PricingPage: NextPage = () => {
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Pricing />
        </div>
      </div>
    </div>
  );
};

export default PricingPage; 