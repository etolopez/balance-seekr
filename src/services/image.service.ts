/**
 * Image Upload Service - Cloudinary integration
 * Handles image uploads for group background images
 * 
 * Setup:
 * 1. Sign up at https://cloudinary.com/users/register/free
 * 2. Get your Cloud Name, API Key, and create an unsigned upload preset
 * 3. Add to .env:
 *    EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
 *    EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset_name
 */

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

/**
 * Upload image to Cloudinary
 * @param imageUri - Local file URI from expo-image-picker
 * @returns Public URL of uploaded image
 */
export async function uploadImageToCloudinary(imageUri: string): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary not configured. Please set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your .env file. See IMAGE_UPLOAD_GUIDE.md for setup instructions.'
    );
  }

  // Get file name from URI
  const filename = imageUri.split('/').pop() || 'image.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  // Convert local URI to FormData for upload
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: type,
    name: filename,
  } as any);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
  // Optional: Add folder organization
  formData.append('folder', 'mastermind-groups');

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ImageService] Cloudinary error response:', errorText);
      throw new Error(`Cloudinary upload failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    // Return the secure URL (HTTPS)
    return data.secure_url;
  } catch (error: any) {
    console.error('[ImageService] Upload error:', error);
    if (error.message?.includes('Network request failed')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    throw new Error(`Failed to upload image: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Get optimized image URL with transformations
 * Useful for displaying thumbnails or resized images
 * 
 * @param publicUrl - Cloudinary public URL
 * @param width - Desired width (optional)
 * @param height - Desired height (optional)
 * @param quality - Image quality (auto, 80, 90, etc.) - default: 'auto'
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  publicUrl: string,
  options?: {
    width?: number;
    height?: number;
    quality?: string | number;
  }
): string {
  // If not a Cloudinary URL, return as-is
  if (!publicUrl || !publicUrl.includes('cloudinary.com')) {
    return publicUrl;
  }

  // If no transformations needed, return original
  if (!options || (!options.width && !options.height)) {
    return publicUrl;
  }

  try {
    // Extract the path from the URL
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split('/');
    const versionIndex = pathParts.findIndex(p => p.startsWith('v'));
    
    if (versionIndex === -1) {
      return publicUrl; // Can't parse, return original
    }

    const imagePath = pathParts.slice(versionIndex + 1).join('/');

    // Build transformation URL
    const transformations: string[] = [];
    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);
    transformations.push('c_fill'); // Fill mode (crop to fill)
    transformations.push(`q_${options.quality || 'auto'}`); // Quality
    transformations.push('f_auto'); // Auto format (WebP when supported)

    const transformString = transformations.join(',');
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformString}/${imagePath}`;
  } catch (error) {
    console.error('[ImageService] Error optimizing URL:', error);
    return publicUrl; // Return original on error
  }
}

/**
 * Delete image from Cloudinary (requires signed requests)
 * For now, images persist. To implement deletion, you'd need:
 * 1. Backend endpoint with API secret
 * 2. Signed requests
 * 
 * This is a placeholder for future implementation
 */
export async function deleteImageFromCloudinary(publicUrl: string): Promise<void> {
  // TODO: Implement deletion via backend endpoint
  // Requires API secret, so must be done server-side
  console.warn('[ImageService] Image deletion not yet implemented. Images will persist in Cloudinary.');
}

