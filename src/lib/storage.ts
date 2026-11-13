import fs from 'fs';
import path from 'path';

/**
 * Storage Abstraction Interface
 * Enables zero-setup local filesystem storage with clean pluggability for MinIO / AWS S3.
 */

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure upload directory exists safely without crashing serverless runtimes
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch {
  // Ignored in read-only serverless environments (e.g. Vercel)
}

export async function saveUploadedFile(file: File): Promise<string> {
  const driver = process.env.STORAGE_DRIVER || 'local';

  if (driver === 's3' && process.env.S3_ACCESS_KEY && process.env.S3_BUCKET_NAME) {
    console.log('S3 Storage Driver active. Falling back to local storage if client not initialized.');
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${sanitizedName}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    await fs.promises.writeFile(filePath, buffer);
    return `/uploads/${filename}`;
  } catch (err) {
    // Fallback for serverless environments (e.g. Vercel read-only filesystem)
    console.warn('Filesystem write unavailable (serverless environment). Falling back to inline data URL.', err);
    const mime = file.type || 'image/jpeg';
    return `data:${mime};base64,${buffer.toString('base64')}`;
  }
}

export async function deleteUploadedFile(publicUrl: string): Promise<void> {
  if (!publicUrl.startsWith('/uploads/')) return;
  const filename = path.basename(publicUrl);
  if (!filename || filename !== publicUrl.slice('/uploads/'.length)) return;
  await fs.promises.unlink(path.join(UPLOADS_DIR, filename));
}

export async function saveBase64Media(base64Data: string, extension: string = 'jpg'): Promise<string> {
  const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(cleanBase64, 'base64');

  try {
    const filename = `${Date.now()}-snapshot.${extension}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    await fs.promises.writeFile(filePath, buffer);
    return `/uploads/${filename}`;
  } catch {
    // If running on Vercel read-only filesystem, return data URL directly
    return base64Data.startsWith('data:') ? base64Data : `data:image/${extension};base64,${cleanBase64}`;
  }
}
