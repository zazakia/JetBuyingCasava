import { getSupabaseClient } from './supabase';
import { v4 as uuidv4 } from 'uuid';

type FileType = 'profile' | 'document' | 'image' | 'other';

const BUCKET_NAMES = {
  PROFILE: 'profile-pictures',
  DOCUMENTS: 'documents',
  IMAGES: 'images',
  GENERAL: 'general'
} as const;

const ALLOWED_FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const;

const MAX_FILE_SIZES = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
} as const;

interface UploadOptions {
  bucket?: string;
  path?: string;
  upsert?: boolean;
  cacheControl?: string;
  contentType?: string;
}

export const storageService = {
  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    file: File,
    fileType: FileType = 'other',
    options: UploadOptions = {}
  ) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // Determine bucket
    const bucket = options.bucket || this.getBucketForFileType(fileType);
    
    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = options.path ? `${options.path}/${fileName}` : fileName;

    // Validate file
    this.validateFile(file, fileType);

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: options.cacheControl || '3600',
        upsert: options.upsert || false,
        contentType: options.contentType || file.type,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      path: data.path,
      fullPath: `${bucket}/${data.path}`,
      publicUrl,
      bucket,
      mimeType: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };
  },

  /**
   * Delete a file from Supabase Storage
   */
  async deleteFile(filePath: string, bucket?: string) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const targetBucket = bucket || this.determineBucketFromPath(filePath);
    const { error } = await supabase.storage
      .from(targetBucket)
      .remove([filePath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }

    return { success: true };
  },

  /**
   * Get a signed URL for a file
   */
  async getSignedUrl(filePath: string, expiresIn = 3600, bucket?: string) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const targetBucket = bucket || this.determineBucketFromPath(filePath);
    const { data, error } = await supabase.storage
      .from(targetBucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(`Failed to get signed URL: ${error.message}`);
    }

    return data.signedUrl;
  },

  /**
   * Helper to determine bucket based on file type
   */
  private getBucketForFileType(fileType: FileType): string {
    switch (fileType) {
      case 'profile':
        return BUCKET_NAMES.PROFILE;
      case 'document':
        return BUCKET_NAMES.DOCUMENTS;
      case 'image':
        return BUCKET_NAMES.IMAGES;
      default:
        return BUCKET_NAMES.GENERAL;
    }
  },

  /**
   * Extract bucket name from full path
   */
  private determineBucketFromPath(path: string): string {
    const parts = path.split('/');
    return parts[0];
  },

  /**
   * Validate file based on type and size
   */
  private validateFile(file: File, fileType: FileType) {
    // Check file size
    if (fileType === 'image' && file.size > MAX_FILE_SIZES.IMAGE) {
      throw new Error(`Image size must be less than ${MAX_FILE_SIZES.IMAGE / (1024 * 1024)}MB`);
    }

    if ((fileType === 'document' || fileType === 'other') && file.size > MAX_FILE_SIZES.DOCUMENT) {
      throw new Error(`File size must be less than ${MAX_FILE_SIZES.DOCUMENT / (1024 * 1024)}MB`);
    }

    // Check file type
    if (fileType === 'image' && !ALLOWED_FILE_TYPES.IMAGE.includes(file.type)) {
      throw new Error(`Invalid image type. Allowed types: ${ALLOWED_FILE_TYPES.IMAGE.join(', ')}`);
    }

    if (fileType === 'document' && !ALLOWED_FILE_TYPES.DOCUMENT.includes(file.type)) {
      throw new Error(`Invalid document type. Allowed types: ${ALLOWED_FILE_TYPES.DOCUMENT.join(', ')}`);
    }
  },

  /**
   * Get the public URL for a file
   */
  getPublicUrl(bucket: string, path: string) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  },

  /**
   * List files in a bucket
   */
  async listFiles(bucket: string, path = '', limit = 100, offset = 0) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path, {
        limit,
        offset,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }

    return data.map(file => ({
      ...file,
      publicUrl: this.getPublicUrl(bucket, `${path}/${file.name}`.replace(/\/\//g, '/')),
    }));
  },

  /**
   * Create a new bucket
   */
  async createBucket(bucketName: string, isPublic = false) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: isPublic,
      allowedMimeTypes: isPublic 
        ? [...ALLOWED_FILE_TYPES.IMAGE, ...ALLOWED_FILE_TYPES.DOCUMENT]
        : null,
      fileSizeLimit: 50 * 1024 * 1024, // 50MB
    });

    if (error) {
      throw new Error(`Failed to create bucket: ${error.message}`);
    }

    return data;
  },

  /**
   * Delete a bucket
   */
  async deleteBucket(bucketName: string) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // First, delete all files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list();

    if (listError) {
      throw new Error(`Failed to list files in bucket: ${listError.message}`);
    }

    const filePaths = files.map(file => file.name);
    
    if (filePaths.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove(filePaths);

      if (deleteError) {
        throw new Error(`Failed to delete files: ${deleteError.message}`);
      }
    }

    // Then delete the bucket
    const { error } = await supabase.storage.deleteBucket(bucketName);
    
    if (error) {
      throw new Error(`Failed to delete bucket: ${error.message}`);
    }

    return { success: true };
  }
};

// Example usage:
/*
// Upload a profile picture
const uploadProfilePicture = async (file: File) => {
  try {
    const result = await storageService.uploadFile(file, 'profile', {
      path: 'profile-pictures',
      contentType: file.type,
    });
    console.log('File uploaded successfully:', result.publicUrl);
    return result;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};
*/

export default storageService;
