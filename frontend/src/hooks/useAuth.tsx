import { useState, useEffect, createContext, useContext } from 'react';
import { web3Service } from "@/Services/Web3Service";
import { useAccount } from 'wagmi';
import { eventFactoryABI } from '../../web3/constants';

type Organization = {
  address: string;
  name: string;
  description?: string;
  website?: string;
  registered: boolean;
  active: boolean;
};

type AuthContextType = {
  organization: Organization | null;
  loading: boolean;
  signIn: () => Promise<boolean>;
  signOut: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      if (!address) {
        setOrganization(null);
        setLoading(false);
        return;
      }

      try {
        const orgData = await web3Service.getPublicClient().readContract({
          address: web3Service.getEventFactoryAddress()!,
          abi: eventFactoryABI.abi,
          functionName: 'organizations',
          args: [address],
        }) as [string, string, string, boolean, boolean];

        const [name, description, website, registered, active] = orgData;

        if (registered) {
          setOrganization({ address, name, description, website, registered, active });
        } else {
          setOrganization(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setOrganization(null);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [address]);

  async function signIn(): Promise<boolean> {
    if (!address) {
      return false;
    }

    setLoading(true);
    try {
      const orgData = await web3Service.getPublicClient().readContract({
        address: web3Service.getEventFactoryAddress()!,
        abi: eventFactoryABI.abi,
        functionName: 'organizations',
        args: [address],
      }) as [string, string, string, boolean, boolean];

      const [name, description, website, registered, active] = orgData;

      if (registered) {
        setOrganization({ address, name, description, website, registered, active });
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Sign in error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }

  function signOut() {
    setOrganization(null);
  }

  const value: AuthContextType = {
    organization,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!organization,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
