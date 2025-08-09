import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const uploadFile = async (file: File, path: string): Promise<string> => {
  const { data, error } = await supabase.storage
    .from('legal-documents')
    .upload(path, file);

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return data.path;
};

export const getFileUrl = (path: string): string => {
  const { data } = supabase.storage
    .from('legal-documents')
    .getPublicUrl(path);

  return data.publicUrl;
};
