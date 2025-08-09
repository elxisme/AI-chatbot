// Supabase configuration disabled for development - using in-memory storage
// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
// const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

// export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Mock Supabase for development
const mockSupabase = {
  storage: {
    from: () => ({
      upload: async () => ({ data: { path: 'mock-path' }, error: null }),
      download: async () => ({ data: new Blob(), error: null }),
      remove: async () => ({ error: null }),
      getPublicUrl: () => ({ data: { publicUrl: 'mock-url' } })
    })
  }
};

export const supabase = mockSupabase as any;

export interface SupabaseStorageService {
  uploadFile(bucket: string, path: string, file: Buffer, contentType: string): Promise<string>;
  downloadFile(bucket: string, path: string): Promise<Buffer>;
  deleteFile(bucket: string, path: string): Promise<void>;
  getPublicUrl(bucket: string, path: string): string;
}

export class SupabaseStorage implements SupabaseStorageService {
  async uploadFile(bucket: string, path: string, file: Buffer, contentType: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert: true
      });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    return data.path;
  }

  async downloadFile(bucket: string, path: string): Promise<Buffer> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);

    if (error) {
      throw new Error(`Failed to download file: ${error.message}`);
    }

    return Buffer.from(await data.arrayBuffer());
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }
}

export const supabaseStorage = new SupabaseStorage();
