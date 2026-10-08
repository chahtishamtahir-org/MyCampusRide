/**
 * Resolves an asset path or URL to a valid loadable URL.
 * Handles Cloudinary absolute URLs (http/https) as well as legacy local relative server paths.
 *
 * @param {string} path - URL or relative file path
 * @returns {string|undefined} Full valid URL or undefined if no path provided
 */
export const getAssetUrl = (path) => {
  if (!path || typeof path !== 'string') return undefined;

  // If already an absolute URL (e.g. Cloudinary: https://res.cloudinary.com/...)
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Relative backend path fallback
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${baseUrl}/${cleanPath}`;
};

export default getAssetUrl;
