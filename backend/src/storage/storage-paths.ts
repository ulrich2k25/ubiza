import { isAbsolute, join, relative, resolve, sep } from 'path';

const PUBLIC_UPLOADS_PREFIX = 'uploads';

export function getUploadsRoot(): string {
  const configuredRoot = process.env.UPLOADS_DIR?.trim();

  return configuredRoot
    ? resolve(configuredRoot)
    : join(process.cwd(), PUBLIC_UPLOADS_PREFIX);
}

export function uploadUrlToFilePath(fileUrl: string): string {
  const normalizedUrl = fileUrl.replace(/\\/g, '/').replace(/^\/+/, '');

  const relativeUploadPath = normalizedUrl.startsWith(
    `${PUBLIC_UPLOADS_PREFIX}/`,
  )
    ? normalizedUrl.slice(PUBLIC_UPLOADS_PREFIX.length + 1)
    : normalizedUrl;

  const uploadsRoot = getUploadsRoot();
  const resolvedPath = resolve(uploadsRoot, relativeUploadPath);
  const relativePath = relative(uploadsRoot, resolvedPath);

  if (
    relativePath === '..' ||
    relativePath.startsWith(`..${sep}`) ||
    isAbsolute(relativePath)
  ) {
    throw new Error('Chemin de fichier invalide.');
  }

  return resolvedPath;
}
