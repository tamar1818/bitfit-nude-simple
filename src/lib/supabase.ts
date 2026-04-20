import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️  Paste your Supabase credentials here (from your .env file)
const SUPABASE_URL = 'https://hpkpimkacoqgkyldslky.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_vkgi8ISEHtdmfMq4ksaUdw_SvTp5y9E';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
