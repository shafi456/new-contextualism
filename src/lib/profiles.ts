/**
 * Finds the photographs chosen for governance profiles. The editorial
 * interface stores a path to a file in src/assets/uploads; a path that matches
 * no file there fails the build, so a broken photograph cannot ship.
 */
import type { ImageMetadata } from 'astro';

const uploads = import.meta.glob<{ default: ImageMetadata }>('/src/assets/uploads/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}', {
  eager: true,
});

export function profilePhoto(stored: string): ImageMetadata {
  const file = stored.split('/').pop();
  const found = uploads[`/src/assets/uploads/${file}`];
  if (!found) throw new Error(`Profile photograph not found, or not a JPG, PNG, WebP or AVIF file: ${stored}`);
  return found.default;
}
