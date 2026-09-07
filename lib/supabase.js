import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://ubatkkswrurxoenjiqld.supabase.co';
const supabaseAnonKey = 'sb_publishable_2Y1M1Lkgk_5bFN_mXhYL2Q_hh1HJOdf';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});