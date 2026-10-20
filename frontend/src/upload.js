// Browser-side photo upload to Cloudinary using an UNSIGNED upload preset.
// No secret is stored in the website. Restrict abuse in the Cloudinary preset itself (see DEPLOY.md).
//
// Set in Vercel / .env.local:
//   VITE_CLOUDINARY_CLOUD_NAME   e.g. "dxyz123abc"
//   VITE_CLOUDINARY_UPLOAD_PRESET e.g. "campusnest_unsigned"

const CLOUD = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim();
const PRESET = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '').trim();

export const uploadConfigured = Boolean(CLOUD && PRESET);

export const MAX_PHOTOS = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_INPUT_BYTES = 12 * 1024 * 1024; // phone photos are often 4-8 MB; we shrink them before upload
const MAX_EDGE = 1600; // px, longest side after shrinking

export class UploadError extends Error {}

/** Checks the file, then shrinks it so uploads are fast on mobile data. Returns a JPEG Blob. */
export async function prepareImage(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
        throw new UploadError('Use a JPG, PNG or WebP photo.');
    }
    if (file.size > MAX_INPUT_BYTES) {
        throw new UploadError('That photo is larger than 12 MB. Pick a smaller one.');
    }

    let bitmap;
    try {
        bitmap = await createImageBitmap(file);
    } catch {
        throw new UploadError('That file could not be read as an image.');
    }

    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; // PNG transparency becomes white instead of black in the JPEG
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob) throw new UploadError('Could not process that photo.');
    return blob;
}

/** Uploads one prepared Blob and returns its https URL. */
export async function uploadImage(blob, signal) {
    if (!uploadConfigured) throw new UploadError('Photo upload is not configured.');

    const body = new FormData();
    body.append('file', blob);
    body.append('upload_preset', PRESET);

    let res;
    try {
        res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
            method: 'POST',
            body,
            signal
        });
    } catch (err) {
        if (err?.name === 'AbortError') throw err;
        throw new UploadError('Upload failed. Check your connection and try again.');
    }

    let data = null;
    try {
        data = await res.json();
    } catch {
        /* no JSON body */
    }
    if (!res.ok || !data?.secure_url) {
        throw new UploadError(data?.error?.message || 'Upload was rejected. Try a different photo.');
    }
    return data.secure_url;
}

/**
 * Asks Cloudinary for a smaller, modern-format copy of an image (WebP/AVIF automatically).
 * Leaves any non-Cloudinary URL (e.g. the demo Unsplash photos) untouched.
 */
export function optimizedImage(url, width = 800) {
    if (typeof url !== 'string') return url;
    const marker = '/image/upload/';
    if (!url.includes('res.cloudinary.com') || !url.includes(marker)) return url;
    return url.replace(marker, `${marker}f_auto,q_auto,w_${width}/`);
}
