import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { authClient, setAccessToken } from "@/lib/auth";
import { api } from "@/lib/api";

export type Profile = {
  id: string;
  displayName: string;
  username: string;
  phone: string | null;
  city: string | null;
  biography: string | null;
  role: "member" | "moderator" | "admin";
};

type AuthValue = {
  user: { id: string; name: string; email: string; emailVerified?: boolean } | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = authClient.useSession() as {
    data: {
      user: { id: string; name: string; email: string; emailVerified?: boolean };
      session?: { token?: string | null } | null;
    } | null;
    isPending: boolean;
  };
  const sessionUser = session?.data?.user;
  const sessionToken = session?.data?.session?.token;
  const user = useMemo(() => sessionUser ? {
    id: sessionUser.id,
    name: sessionUser.name || "",
    email: sessionUser.email || "",
    emailVerified: sessionUser.emailVerified,
  } : null, [sessionUser]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    setAccessToken(sessionToken);
  }, [sessionToken]);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    try {
      const result = await api<{ profile: Profile | null } | Profile>("/api/profile");
      const existing = "profile" in result ? result.profile : result;
      if (existing) {
        setProfile(existing);
      } else {
        const created = await api<Profile>("/api/profile", {
          method: "POST",
          body: JSON.stringify({ displayName: user.name || user.email.split("@")[0] }),
        });
        setProfile(created);
      }
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) void refreshProfile().catch(() => setProfile(null));
    else setProfile(null);
  }, [user, refreshProfile]);

  const signOut = useCallback(async () => {
    await authClient.signOut({});
    setAccessToken(null);
    setProfile(null);
  }, []);

  const value = useMemo<AuthValue>(() => ({
    user,
    profile,
    loading: Boolean(session?.isPending || profileLoading),
    refreshProfile,
    signOut,
  }), [user, profile, session?.isPending, profileLoading, refreshProfile, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth doit être utilisé dans AuthProvider.");
  return value;
}
