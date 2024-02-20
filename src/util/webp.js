/* global riffChunks */
import '../lib/riff-chunks.min.js';

/**
 * @param {arrayBuffer} arrayBuffer - Binary data
 * @returns {boolean} - Whether the data is an animated WebP
 */
export function isAnimatedWebP (arrayBuffer) {
  try {
    const { format, subChunks } = riffChunks.riffChunks(new Uint8Array(arrayBuffer));
    return format === 'WEBP' && subChunks.some(({ chunkId }) => chunkId === 'ANIM');
  } catch (e) {
    return false;
  }
}
