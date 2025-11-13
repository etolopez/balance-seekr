# Image Upload Guide - Fastest & Cheapest Options

## 🏆 Recommended: Cloudinary (Best Balance)

**Free Tier:**
- 25GB storage
- 25GB bandwidth/month
- Automatic image optimization
- CDN included
- Transformations (resize, crop, etc.)

**Setup Time:** ~15 minutes
**Cost:** Free for most use cases

### Step 1: Sign Up
1. Go to https://cloudinary.com/users/register/free
2. Create a free account
3. Get your credentials from Dashboard:
   - `Cloud Name`
   - `API Key`
   - `API Secret`

### Step 2: No Package Installation Needed! ✅

The service uses React Native's built-in `fetch` API - no additional packages required!

### Step 3: Frontend Upload Service

Create `src/services/image.service.ts`:

```typescript
/**
 * Image Upload Service - Cloudinary integration
 * Handles image uploads for group background images
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
    throw new Error('Cloudinary not configured. Please set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET');
  }

  // Convert local URI to blob for upload
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'image.jpg',
  } as any);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

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
      const error = await response.text();
      throw new Error(`Cloudinary upload failed: ${error}`);
    }

    const data = await response.json();
    return data.secure_url; // Returns the public URL
  } catch (error: any) {
    console.error('[ImageService] Upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Get optimized image URL with transformations
 * @param publicUrl - Cloudinary public URL
 * @param width - Desired width (optional)
 * @param height - Desired height (optional)
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  publicUrl: string,
  width?: number,
  height?: number
): string {
  if (!publicUrl.includes('cloudinary.com')) {
    return publicUrl; // Not a Cloudinary URL, return as-is
  }

  // Extract the path from the URL
  const url = new URL(publicUrl);
  const pathParts = url.pathname.split('/');
  const versionIndex = pathParts.findIndex(p => p.startsWith('v'));
  const imagePath = pathParts.slice(versionIndex + 1).join('/');

  // Build transformation URL
  const transformations: string[] = [];
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  transformations.push('c_fill', 'q_auto', 'f_auto'); // Fill, auto quality, auto format

  const transformString = transformations.join(',');
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformString}/${imagePath}`;
}
```

### Step 4: Update Environment Variables

Add to `.env`:
```env
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

**Create Upload Preset in Cloudinary:**
1. Go to Cloudinary Dashboard → Settings → Upload
2. Click "Add upload preset"
3. Set:
   - **Preset name:** `mastermind_images` (or any name)
   - **Signing mode:** Unsigned (for client-side uploads)
   - **Folder:** `mastermind-groups` (optional, for organization)
4. Save

### Step 5: Update Groups Screen

In `src/app/(tabs)/groups.tsx`, update `pickBackgroundImage`:

```typescript
import { uploadImageToCloudinary } from '../../services/image.service';

const pickBackgroundImage = async () => {
  try {
    const ImagePicker = await import('expo-image-picker');
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant permission to access your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // Show loading
      Alert.alert('Uploading', 'Please wait while we upload your image...');
      
      // Upload to Cloudinary
      const publicUrl = await uploadImageToCloudinary(result.assets[0].uri);
      
      // Save the public URL
      setPublicGroupBackgroundImage(publicUrl);
      Alert.alert('Success', 'Image uploaded successfully!');
    }
  } catch (error: any) {
    console.error('[Groups] Error picking/uploading image:', error);
    Alert.alert('Error', error.message || 'Failed to upload image.');
  }
};
```

### Step 6: Update Backend to Store Image URL

In `backend/src/models/group.js`, add `background_image` column:

```javascript
// In initializeDatabase function, update groups table:
await query(`
  ALTER TABLE groups 
  ADD COLUMN IF NOT EXISTS background_image TEXT
`);
```

Update `createGroup` to accept `backgroundImage`:

```javascript
export async function createGroup(groupData) {
  const {
    name,
    ownerAddress,
    ownerUsername,
    joinPrice,
    paymentAddress,
    description,
    createPrice,
    createPaymentSignature,
    backgroundImage, // Add this
  } = groupData;

  const result = await query(
    `INSERT INTO groups (
      name, owner_address, owner_username, join_price, 
      payment_address, description, create_price, 
      create_payment_signature, background_image
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      name, ownerAddress, ownerUsername, joinPrice,
      paymentAddress, description, createPrice,
      createPaymentSignature, backgroundImage || null
    ]
  );
  return result.rows[0];
}
```

Update API route in `backend/src/routes/groups.js`:

```javascript
router.post('/', async (req, res) => {
  try {
    // ... existing validation ...
    
    const group = await createGroup({
      // ... existing fields ...
      backgroundImage: req.body.backgroundImage, // Add this
    });
    
    // ... rest of the code ...
  }
});
```

---

## 🚀 Alternative Options

### Option 2: Supabase Storage (If using Supabase)

**Free Tier:**
- 1GB storage
- 2GB bandwidth/month
- Good if you're already using Supabase

**Setup:**
```bash
npm install @supabase/supabase-js
```

### Option 3: Firebase Storage

**Free Tier:**
- 5GB storage
- 1GB/day downloads
- Good Google integration

**Setup:**
```bash
npm install @react-native-firebase/storage
```

### Option 4: AWS S3 (Most Control)

**Free Tier:**
- 5GB storage
- 20,000 GET requests
- Requires more setup

**Setup:**
```bash
npm install aws-sdk
```

---

## 📊 Comparison

| Service | Free Storage | Free Bandwidth | Setup Time | Best For |
|---------|-------------|----------------|------------|----------|
| **Cloudinary** | 25GB | 25GB/month | 15 min | ✅ **Recommended** |
| Supabase | 1GB | 2GB/month | 20 min | PostgreSQL users |
| Firebase | 5GB | 1GB/day | 25 min | Google ecosystem |
| AWS S3 | 5GB | 20K requests | 30 min | Enterprise |

---

## 🎯 Quick Start (Cloudinary)

1. **Sign up:** https://cloudinary.com/users/register/free
2. **Get credentials** from dashboard
3. **Create upload preset** (unsigned, for client uploads)
4. **Add to `.env`:**
   ```
   EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset_name
   ```
5. **Create `src/services/image.service.ts`** (code above)
6. **Update groups screen** to use `uploadImageToCloudinary()`
7. **Update backend** to store `backgroundImage` URL

**Total time:** ~15 minutes
**Cost:** $0 (free tier covers most use cases)

---

## 🔒 Security Note

For production, consider:
1. **Signed uploads** (requires backend endpoint)
2. **File size limits** (enforce on frontend)
3. **File type validation** (only images)
4. **Rate limiting** (prevent abuse)

The unsigned preset approach works for MVP, but signed uploads are more secure for production.

