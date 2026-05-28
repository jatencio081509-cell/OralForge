import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  SPOTIFY_CLIENT_ID,
  SpotifyTrack,
  clearSpotifyToken,
  fetchNowPlaying,
  loadStoredToken,
  startSpotifyAuth,
} from "@/services/spotifyService";

interface SpotifyContextValue {
  token: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  hasClientId: boolean;
  nowPlaying: SpotifyTrack | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}

const SpotifyContext = createContext<SpotifyContextValue | null>(null);

export function SpotifyProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<SpotifyTrack | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingActive = useRef(false);

  useEffect(() => {
    loadStoredToken().then((t) => {
      if (t) setToken(t);
    });
  }, []);

  const connect = useCallback(async () => {
    if (!SPOTIFY_CLIENT_ID) return;
    setIsConnecting(true);
    try {
      const t = await startSpotifyAuth();
      if (t) setToken(t);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    stopPolling();
    await clearSpotifyToken();
    setToken(null);
    setNowPlaying(null);
  }, []);

  const startPolling = useCallback(() => {
    if (!token || pollingActive.current) return;
    pollingActive.current = true;

    const poll = async () => {
      if (!pollingActive.current || !token) return;
      const track = await fetchNowPlaying(token);
      setNowPlaying(track);
    };

    poll();
    pollingRef.current = setInterval(poll, 5000);
  }, [token]);

  const stopPolling = useCallback(() => {
    pollingActive.current = false;
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setNowPlaying(null);
  }, []);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  return (
    <SpotifyContext.Provider
      value={{
        token,
        isConnected: !!token,
        isConnecting,
        hasClientId: !!SPOTIFY_CLIENT_ID,
        nowPlaying,
        connect,
        disconnect,
        startPolling,
        stopPolling,
      }}
    >
      {children}
    </SpotifyContext.Provider>
  );
}

export function useSpotify() {
  const ctx = useContext(SpotifyContext);
  if (!ctx) throw new Error("useSpotify must be used within SpotifyProvider");
  return ctx;
}
