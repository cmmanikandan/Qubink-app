/**
 * Cloudinary Media Storage Utility for Qubink
 * Configured with cloud name: dughdt8sf & upload preset: qubink_uploads
 */

export const CLOUDINARY_CONFIG = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dughdt8sf',
  apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '653356226116288',
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'qubink_uploads',
};

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  bytes: number;
  original_filename: string;
  resource_type: string;
}

/**
 * Upload a File or Blob directly to Cloudinary using unsigned upload preset
 */
export async function uploadToCloudinary(
  file: File | Blob,
  folder: string = 'qubink_documents'
): Promise<{ success: boolean; url?: string; publicId?: string; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', folder);

    // Auto-determine resource type (raw for pdfs/docs, image for photos)
    const isImage = file.type.startsWith('image/');
    const resourceType = isImage ? 'image' : 'raw';

    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/upload`;

    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Cloudinary upload failed: ${res.statusText}`);
    }

    const data: CloudinaryUploadResponse = await res.json();
    return {
      success: true,
      url: data.secure_url,
      publicId: data.public_id,
    };
  } catch (err: any) {
    console.error('Cloudinary upload error:', err);
    return {
      success: false,
      error: err.message || 'Failed to upload media to Cloudinary',
    };
  }
}
