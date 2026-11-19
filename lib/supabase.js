import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL polyfill for React Native runtime
try {
  require('react-native-url-polyfill/auto');
} catch {}

const supabaseUrl = 'https://ubatkkswrurxoenjiqld.supabase.co';
const supabaseAnonKey = 'sb_publishable_2Y1M1Lkgk_5bFN_mXhYL2Q_hh1HJOdf';

const safeStorage = {
  getItem: async (key) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key, val) => {
    try {
      await AsyncStorage.setItem(key, val);
    } catch {}
  },
  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
