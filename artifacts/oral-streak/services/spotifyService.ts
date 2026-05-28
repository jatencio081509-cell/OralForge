import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? "";

const SCOPES = [
  "user-read-currently-playing",
  "user-read-playback-state",
].join(" ");

const STORAGE_KEY = "@oralstreak_spotify_token";
const EXPIRY_KEY = "@oralstreak_spotify_expiry";
const CODE_VERIFIER_KEY = "@oralstreak_spotify_verifier";

function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";
  const array = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < length; i++) array[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest("SHA-256", data);
}

function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const byte of bytes) str += String.fromCharCode(byte);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const hashed = await sha256(verifier);
  return base64urlEncode(hashed);
}

function getRedirectUri(): string {
  if (Platform.OS === "web") {
    return Linking.createURL("/");
  }
  return "oral-streak://spotify-callback";
}

export async function startSpotifyAuth(): Promise<string | null> {
  if (!SPOTIFY_CLIENT_ID) return null;

  try {
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    await AsyncStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);

    const redirectUri = getRedirectUri();

    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      response_type: "code",
      redirect_uri: redirectUri,
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
      scope: SCOPES,
    });

    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type !== "success") return null;

    const url = result.url;
    const parsed = new URL(url);
    const code = parsed.searchParams.get("code");

    if (!code) return null;

    return await exchangeCodeForToken(code, codeVerifier, redirectUri);
  } catch {
    return null;
  }
}

async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<string | null> {
  try {
    const body = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const token = data.access_token as string;
    const expiresIn = (data.expires_in as number) * 1000;

    await AsyncStorage.setItem(STORAGE_KEY, token);
    await AsyncStorage.setItem(
      EXPIRY_KEY,
      String(Date.now() + expiresIn)
    );

    return token;
  } catch {
    return null;
  }
}

export async function loadStoredToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEY);
    const expiry = await AsyncStorage.getItem(EXPIRY_KEY);
    if (!token || !expiry) return null;
    if (Date.now() > parseInt(expiry, 10)) {
      await clearSpotifyToken();
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export async function clearSpotifyToken(): Promise<void> {
  await AsyncStorage.multiRemove([STORAGE_KEY, EXPIRY_KEY, CODE_VERIFIER_KEY]);
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: string;
  albumArt: string | null;
  playlistName: string | null;
}

export async function fetchNowPlaying(
  token: string
): Promise<SpotifyTrack | null> {
  try {
    const res = await fetch("https://api.spotify.com/v1/me/player", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 204 || !res.ok) return null;

    const data = await res.json();
    if (!data?.item) return null;

    const item = data.item;
    const context = data.context;

    let playlistName: string | null = null;
    if (context?.type === "playlist" && context?.uri) {
      try {
        const playlistId = context.uri.split(":").pop();
        const p = await fetch(
          `https://api.spotify.com/v1/playlists/${playlistId}?fields=name`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (p.ok) {
          const pd = await p.json();
          playlistName = pd?.name ?? null;
        }
      } catch {}
    }

    return {
      id: item.id,
      name: item.name,
      artists: (item.artists ?? []).map((a: any) => a.name).join(", "),
      albumArt: item.album?.images?.[0]?.url ?? null,
      playlistName,
    };
  } catch {
    return null;
  }
}
