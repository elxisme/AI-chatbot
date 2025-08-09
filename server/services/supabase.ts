import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface SupabaseStorageService {
  uploadFile(bucket: string, path: string, file: Buffer, contentType: string): Promise<string>;
  downloadFile(bucket: string, path: string): Promise<Buffer>;
  deleteFile(bucket: string, path: string): Promise<void>;
  getPublicUrl(bucket: string, path: string): string;
}

export class SupabaseStorage implements SupabaseStorageService {
  async uploadFile(bucket: string, path: string, file: Buffer, contentType: string): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          contentType,
          upsert: true
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      return data.path;
    } catch (error) {
      console.error('Error uploading file to Supabase:', error);
      throw new Error('Failed to upload file to storage');
    }
  }

  async downloadFile(bucket: string, path: string): Promise<Buffer> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

      if (error) {
        console.error('Supabase download error:', error);
        throw new Error(`Failed to download file: ${error.message}`);
      }

      return Buffer.from(await data.arrayBuffer());
    } catch (error) {
      console.error('Error downloading file from Supabase:', error);
      throw new Error('Failed to download file from storage');
    }
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        console.error('Supabase delete error:', error);
        throw new Error(`Failed to delete file: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting file from Supabase:', error);
      throw new Error('Failed to delete file from storage');
    }
  }

  getPublicUrl(bucket: string, path: string): string {
    try {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return data.publicUrl;
    } catch (error) {
      console.error('Error getting public URL from Supabase:', error);
      throw new Error('Failed to get public URL');
    }
  }
}

export const supabaseStorage = new SupabaseStorage();