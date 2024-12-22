import React from 'react';
import { useUserRole } from '../../hooks/useUserRole';
import PremiumBanner from '../ui/premium-banner';
import Spinner from '../ui/spinner';

interface WithRoleAccessProps {
  feature: string;
  customMessage?: string;
}

export const withRoleAccess = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  { feature, customMessage }: WithRoleAccessProps
) => {
  return function WithRoleAccessComponent(props: P) {
    const { hasAccess, loading, error } = useUserRole();

    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-[200px]">
          <Spinner />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-red-500 p-4">
          Error al verificar los permisos: {error}
        </div>
      );
    }

    if (!hasAccess(feature)) {
      return <PremiumBanner message={customMessage} />;
    }

    return <WrappedComponent {...props} />;
  };
};

export default withRoleAccess; 