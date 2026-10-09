import { Platform } from 'react-native';

/**
 * Where the ezfinance backend (backend/src/EzFinance.Api) is reachable.
 *
 * Development: run `dotnet run --launch-profile http` in backend/src/EzFinance.Api on this Mac.
 * The iOS simulator reaches the Mac at localhost, the Android emulator at 10.0.2.2.
 * On a physical phone, set DEV_HOST to the Mac's Wi-Fi IP (e.g. '192.168.1.20'); the phone
 * and the Mac must be on the same network.
 */
const DEV_HOST: string | null = null;
const DEV_PORT = 5080;

/** Set once the backend is deployed. Release builds can't talk to a laptop. */
const PRODUCTION_API_URL: string | null = null;

const devHost = DEV_HOST ?? (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');

export const API_BASE_URL = __DEV__ ? `http://${devHost}:${DEV_PORT}` : PRODUCTION_API_URL;

export const REQUEST_TIMEOUT_MS = 15000;

/**
 * Google OAuth client IDs (Google Cloud project "My Project 70", alpine-flare-397219). These are
 * public identifiers, not secrets. The web, iOS and Android IDs must all be listed under
 * Supabase → Authentication → Sign In / Providers → Google → Client IDs.
 * Android client: package com.ezfinance + SHA-1 of android/app/debug.keystore.
 */
export const GOOGLE_WEB_CLIENT_ID = '220615390473-jqro5o9jk389g3dljlns28epdk83l1j1.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID = '220615390473-nmlqe223rui19qmsg6uoei8icqvhji1j.apps.googleusercontent.com';
