import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import { injectable } from 'inversify';
import { InternalServerError } from 'routing-controllers';
import { fileURLToPath } from 'url';
import { logger } from '#root/shared/utils/logger.js';
import { ApiError } from '#core/errors/ApiError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

@injectable()
export class AudioService {
  /**
   * Extracts audio from a video file, converts it to 16kHz, 1-channel WAV format.
   * @param videoPath Path to the input video file.
   * @returns Promise<string> Path to the processed audio file.
   * @throws InternalServerError if FFmpeg processing fails.
   */
  public async extractAudio(videoPath: string): Promise<string> {
    if (!fs.existsSync(videoPath)) {
      logger.error('Input video file not found', undefined, { videoPath });
      throw ApiError.notFound(`Input video file not found: ${videoPath}`);
    }

    const tempAudioDir = path.join(__dirname, '..', 'temp_audio'); // Ensure this aligns with actual project structure if __dirname is services/
    await fsp.mkdir(tempAudioDir, { recursive: true });

    const processedAudioFileName = `${Date.now()}_${path.basename(videoPath, path.extname(videoPath))}_processed.wav`;
    const processedAudioPath = path.join(tempAudioDir, processedAudioFileName);

    logger.info('Standardizing audio', {
      inputPath: videoPath,
      outputPath: processedAudioPath,
      format: '16kHz, 1-channel WAV',
    });

    return new Promise<string>((resolve, reject) => {
      ffmpeg(videoPath)
        .toFormat('wav')
        .audioFrequency(16000)
        .audioChannels(1)
        .on('error', (ffmpegErr: Error) => {
          logger.error('FFmpeg standardization failed', ffmpegErr, {
            videoPath,
            processedAudioPath,
          });
          reject(ApiError.internal(`FFmpeg audio standardization failed: ${ffmpegErr.message}`));
        })
        .on('end', async () => {
          logger.info('FFmpeg standardization finished', { processedAudioPath });

          // Clean up the original video file downloaded by VideoService, as it's now processed.
          // The videoPath is likely a temporary file from yt-dlp.
          try {
            await fsp.unlink(videoPath);
            logger.info('Cleaned up intermediate video file', { videoPath });
          } catch (unlinkErr: any) {
            // Log error but don't fail the whole process if cleanup fails
            logger.warn('Error deleting intermediate video file', {
              videoPath,
              error: unlinkErr.message,
            });
          }

          resolve(processedAudioPath);
        })
        .save(processedAudioPath);
    });
  }
}
