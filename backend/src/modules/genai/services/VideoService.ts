import * as path from 'path';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import util from 'util';
import { exec } from 'child_process';
import { injectable } from 'inversify';
import { InternalServerError } from 'routing-controllers';
import { fileURLToPath } from 'url';
import { logger } from '#root/shared/utils/logger.js';
import { ApiError } from '#root/shared/classes/ApiError.js';

const execAsync = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

@injectable()
export class VideoService {
  public async downloadVideo(youtubeUrl: string): Promise<string> {
    try {
      const videoId = new URL(youtubeUrl).searchParams.get('v');
      if (!videoId) {
        logger.error('Invalid YouTube URL: Missing video ID', undefined, { youtubeUrl });
        throw ApiError.badRequest('Invalid YouTube URL: Missing video ID');
      }

      // Use a more flexible output path that allows yt-dlp to choose the extension
      const outputTemplate = path.join(__dirname, '..', 'videos', `${videoId}.%(ext)s`);

      // Ensure the videos directory exists
      const videosDirPath = path.dirname(outputTemplate);
      if (!fs.existsSync(videosDirPath)) {
        await fsp.mkdir(videosDirPath, { recursive: true });
      }

      // More robust format selection for HLS streams and separated video/audio
      // This handles the case where only separated streams are available
      const formatSelector = 'bv*[height<=720]+ba/bv*+ba/best';

      // Arguments for yt-dlp with HLS support
      const command = `yt-dlp -f "${formatSelector}" --merge-output-format mp4 --no-playlist --hls-prefer-ffmpeg -o "${outputTemplate}" "${youtubeUrl}"`;

      logger.info('Executing yt-dlp command', { command, videoId });

      // Execute the command using execAsync
      const { stdout, stderr } = await execAsync(command);

      // Log output for debugging
      if (stdout) {
        logger.debug('yt-dlp stdout', { stdout });
      }
      if (stderr) {
        logger.debug('yt-dlp stderr', { stderr });
      }

      // Find the actual downloaded file (since extension might vary)
      const files = await fsp.readdir(videosDirPath);
      const downloadedFile = files.find((file) => file.startsWith(videoId));

      if (!downloadedFile) {
        logger.error('yt-dlp completed but no file found', undefined, {
          videoId,
          filesInDirectory: files.join(', '),
        });
        throw ApiError.internal(
          'Failed to download video: Output file not found after yt-dlp execution',
        );
      }

      const finalPath = path.join(videosDirPath, downloadedFile);
      logger.info('Video downloaded successfully', { finalPath, videoId });
      return finalPath;
    } catch (error: any) {
      logger.error('Error downloading video', error, {
        youtubeUrl,
      });

      if (error instanceof ApiError) {
        throw error;
      }

      // Provide more detailed error information
      const errorMessage = error.message || 'Unknown error occurred during video download';
      throw ApiError.internal(`Failed to download video: ${errorMessage}`);
    }
  }
}
