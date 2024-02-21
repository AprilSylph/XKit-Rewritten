/* global riffChunks */
import '../lib/riff-chunks.min.js';

/**
 * @param {ArrayBuffer} imageData - Binary image data
 * @returns {boolean} - Whether the data is an animated WebP
 */
export function isAnimatedWebP (imageData) {
  try {
    const { format, subChunks } = riffChunks.riffChunks(new Uint8Array(imageData));
    return format === 'WEBP' && subChunks.some(({ chunkId }) => chunkId === 'ANIM');
  } catch (e) {
    return false;
  }
}
