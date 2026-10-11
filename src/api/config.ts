import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

/**
 * Where the ezfinance backend (backend/src/EzFinance.Api) is reachable.
 *
 * Development:
 * - Android Emulator: reaches host at 10.0.2.2
 * - Physical Android phone: reaches host at localhost via `adb reverse tcp:5080 tcp:5080`
 * - iOS Simulator / Mac: reaches host at localhost
 */
const DEV_HOST: string | null = null;
const DEV_PORT = 5080;

/** Azure App Service Production URL (Korea Central - Gemini API supported region) */
const AZURE_API_URL = 'https://ezfinance-backend.azurewebsites.net';

/**
 * Toggle this to true if you want to test against a local backend running on your machine.
 * When false (default), the app connects directly to the Azure-hosted backend.
 */
const USE_LOCAL_BACKEND = false;

const isEmulator = DeviceInfo.isEmulatorSync();
const devHost = DEV_HOST ?? (Platform.OS === 'android' ? (isEmulator ? '10.0.2.2' : 'localhost') : 'localhost');

export const API_BASE_URL = USE_LOCAL_BACKEND
  ? `http://${devHost}:${DEV_PORT}`
  : AZURE_API_URL;

export const REQUEST_TIMEOUT_MS = 15000;

/**
 * Google OAuth client IDs (Google Cloud project "My Project 70", alpine-flare-397219). These are
 * public identifiers, not secrets. The web, iOS and Android IDs must all be listed under
 * Supabase → Authentication → Sign In / Providers → Google → Client IDs.
 * Android client: package com.ezfinance + SHA-1 of android/app/debug.keystore.
 */
export const GOOGLE_WEB_CLIENT_ID = '220615390473-jqro5o9jk389g3dljlns28epdk83l1j1.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID = '220615390473-nmlqe223rui19qmsg6uoei8icqvhji1j.apps.googleusercontent.com';
