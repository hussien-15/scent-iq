import { createHash } from 'crypto';

export async function verifyCloudinaryConnection(): Promise<{ ok: boolean; message: string }> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return { ok: false, message: 'Persistent media credentials are incomplete.' };
  }
  try {
    const authorization = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/resources/image?max_results=1`,
      {
        headers: { Authorization: `Basic ${authorization}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(4_000),
      }
    );
    return response.ok
      ? { ok: true, message: 'Cloudinary accepted a protected read request.' }
      : {
          ok: false,
          message: 'Cloudinary rejected the protected health request. Check credentials and account access.',
        };
  } catch {
    return { ok: false, message: 'Cloudinary could not be reached during this check.' };
  }
}

export async function uploadImageToCloudinary(file: File, folder: string) {
  const result = await uploadImageAssetToCloudinary(file, folder);
  return result.url;
}

export async function uploadImageAssetToCloudinary(file: File, folder: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary is not configured yet.');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signedParameters = `folder=${folder}&overwrite=false&timestamp=${timestamp}&unique_filename=true&use_filename=false`;
  const signature = createHash('sha1').update(`${signedParameters}${apiSecret}`).digest('hex');
  const upload = new FormData();
  upload.set('file', file);
  upload.set('api_key', apiKey);
  upload.set('timestamp', String(timestamp));
  upload.set('folder', folder);
  upload.set('overwrite', 'false');
  upload.set('unique_filename', 'true');
  upload.set('use_filename', 'false');
  upload.set('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: upload,
  });
  const result = (await response.json()) as {
    secure_url?: string;
    width?: number;
    height?: number;
    bytes?: number;
    public_id?: string;
    error?: { message?: string };
  };
  if (!response.ok || !result.secure_url) {
    throw new Error(result.error?.message ?? 'Image upload failed.');
  }
  return {
    url: result.secure_url.replace('/upload/', '/upload/f_auto,q_auto,w_1600,c_limit,fl_strip_profile/'),
    width: result.width,
    height: result.height,
    bytes: result.bytes,
    publicId: result.public_id,
  };
}
