import * as fs from 'fs/promises';
import { injectable } from 'inversify';
import { logger } from '#root/shared/utils/logger.js';

@injectable()
export class CleanupService {
  /**
   * Asynchronously deletes a list of files or directories.
   * It logs errors for individual deletions but does not throw an error
   * if a specific file/directory deletion fails, attempting to clean up all provided paths.
   *
   * @param paths An array of strings, where each string is a path to a file or directory.
   *              Null or undefined entries in the array are ignored.
   */
  public async cleanup(paths: (string | null | undefined)[]): Promise<void> {
    if (!paths || paths.length === 0) {
      logger.info('CleanupService: No paths provided for cleanup.');
      return;
    }

    logger.info('CleanupService: Starting cleanup', {
      pathCount: paths.filter((p) => p).length,
      paths: paths.filter((p) => p),
    });

    for (const path of paths) {
      if (path) {
        // Check if path is not null or undefined
        try {
          // Check if path exists before attempting to delete.
          // fsp.stat will throw if path doesn't exist.
          await fs.stat(path);

          // Determine if it's a file or directory for logging, though unlink works for files
          // For directories, rmdir would be needed. The original performCleanup used unlink.
          // Let's assume for now these are files, or unlink-compatible items.
          // If directories need to be removed, this logic might need fsp.rm with { recursive: true }
          // The original performCleanup in GenAIVideoController(old).ts used unlink for ytdlpOutputPath (file),
          // processedAudioPath (file), and tempTranscriptDir (directory).
          // fsp.unlink will fail on directories unless they are empty.
          // For robustness, especially with `tempTranscriptDir`, using fsp.rm is better.

          const stats = await fs.lstat(path); // Use lstat to avoid following symlinks, though stat is often fine.
          if (stats.isDirectory()) {
            await fs.rm(path, { recursive: true, force: true });
            logger.info('Successfully deleted directory', { path });
          } else {
            await fs.unlink(path);
            logger.info('Successfully deleted file', { path });
          }
        } catch (error: any) {
          // Common errors:
          // - ENOENT: file or directory does not exist. This is fine, maybe already cleaned up.
          // - EPERM/EACCES: permissions error.
          // - EISDIR: trying to unlink a directory (use rmdir or rm instead).
          if (error.code === 'ENOENT') {
            logger.info('Path not found, presumed already cleaned up', { path });
          } else {
            logger.error('Error deleting path', error, {
              path,
              code: error.code,
            });
            // Do not re-throw; attempt to clean up other paths.
          }
        }
      }
    }
    logger.info('CleanupService: Finished cleanup process.');
  }
}
