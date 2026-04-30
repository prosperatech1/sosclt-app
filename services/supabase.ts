import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔑 ATENÇÃO: Cole aqui o seu Project URL (começa com https://)
const supabaseUrl = 'https://yweyflgschjpkwysopps.supabase.co';

// 🔑 ATENÇÃO: Cole aqui a sua Publishable Key (começa com sb_publishable_)
const supabaseAnonKey = 'sb_publishable_SpqSEH1AYQu4oz-LMnL8Vw_skFvaaRM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
