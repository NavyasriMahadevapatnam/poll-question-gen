import {
  JsonController,
  Post,
  Get,
  Body,
  Param,
  Authorized,
  HttpCode,
  Req,
  Res,
  Delete,
  UseBefore,
} from 'routing-controllers';
import { Request, Response } from 'express';
import multer from 'multer';
import { pollSocket } from '../utils/PollSocket.js';
import { inject, injectable } from 'inversify';
import { RoomService } from '../services/RoomService.js';
import { PollService } from '../services/PollService.js';
import { LIVE_QUIZ_TYPES } from '../types.js';
import { AIContentService } from '#root/modules/genai/services/AIContentService.js';
import { VideoService } from '#root/modules/genai/services/VideoService.js';
import { AudioService } from '#root/modules/genai/services/AudioService.js';
import { CleanupService } from '#root/modules/genai/services/CleanupService.js';
import type { QuestionSpec } from '#root/modules/genai/services/AIContentService.js';
import { OpenAPI } from 'routing-controllers-openapi';
import dotenv from 'dotenv';
import mime from 'mime-types';
import * as fsp from 'fs/promises';
import {
  CreateInMemoryPollDto,
  InMemoryPollResponse,
  InMemoryPollResult,
  SubmitInMemoryAnswerDto,
} from '../validators/LivepollValidator.js';
import { validate } from 'class-validator';
import { AiRateLimiter, UserAiRateLimiter } from '#root/shared/middleware/rateLimiter.js';
import { logger } from '#root/shared/utils/logger.js';
import { ApiError } from '#root/shared/classes/ApiError.js';
import { SEGMENTATION } from '#root/shared/constants/pollConstants.js';

dotenv.config();
const appOrigins = process.env.APP_ORIGINS;

declare module 'express-serve-static-core' {
  interface Request {
    file?: Express.Multer.File;
    files?: Express.Multer.File[];
  }
}
const upload = multer({ dest: 'uploads/' });

@injectable()
@OpenAPI({ tags: ['Rooms'] })
@JsonController('/livequizzes/rooms')
export class PollRoomController {
  constructor(
    @inject(LIVE_QUIZ_TYPES.VideoService) private videoService: VideoService,
    @inject(LIVE_QUIZ_TYPES.AudioService) private audioService: AudioService,
    //@inject(LIVE_QUIZ_TYPES.TranscriptionService) private transcriptionService: TranscriptionService,
    @inject(LIVE_QUIZ_TYPES.AIContentService) private aiContentService: AIContentService,
    @inject(LIVE_QUIZ_TYPES.CleanupService) private cleanupService: CleanupService,
    @inject(LIVE_QUIZ_TYPES.RoomService) private roomService: RoomService,
    @inject(LIVE_QUIZ_TYPES.PollService) private pollService: PollService,
  ) {}

  //@Authorized(['teacher'])
  @Post('/')
  async createRoom(@Body() body: { name: string; teacherId: string }) {
    logger.info('Creating new room', { name: body.name, teacherId: body.teacherId });
    const room = await this.roomService.createRoom(body.name, body.teacherId);
    return {
      ...room,
      inviteLink: `${appOrigins}/student/pollroom/${room.roomCode}`,
    };
  }

  //@Authorized()
  @Get('/:code')
  async getRoom(@Param('code') code: string) {
    logger.info('Fetching room', { roomCode: code });
    const room = await this.roomService.getRoomByCode(code);
    if (!room) {
      logger.warn('Room not found', { roomCode: code });
      return { success: false, message: 'Room not found' };
    }
    if (room.status !== 'active') {
      logger.info('Room is not active', { roomCode: code, status: room.status });
      return { success: false, message: 'Room is ended' };
    }
    return { success: true, room };
  }

  // 🔹 Create Poll in Room
  //@Authorized(['teacher','admin'])
  @Post('/:code/polls')
  async createPollInRoom(
    @Param('code') roomCode: string,
    @Body()
    body: {
      question: string;
      options: string[];
      correctOptionIndex: number;
      creatorId: string;
      timer?: number;
    },
  ) {
    logger.info('Creating poll in room', { roomCode, question: body.question });
    const room = await this.roomService.getRoomByCode(roomCode);
    if (!room) {
      logger.warn('Invalid room for poll creation', { roomCode });
      throw ApiError.notFound('Invalid room');
    }
    return await this.pollService.createPoll(roomCode, {
      question: body.question,
      options: body.options,
      correctOptionIndex: body.correctOptionIndex,
      timer: body.timer,
    });
  }

  //@Authorized(['teacher'])
  @Get('/teacher/:teacherId')
  async getAllRoomsByTeacher(@Param('teacherId') teacherId: string) {
    return await this.roomService.getRoomsByTeacher(teacherId);
  }
  //@Authorized(['teacher'])
  @Get('/teacher/:teacherId/active')
  async getActiveRoomsByTeacher(@Param('teacherId') teacherId: string) {
    return await this.roomService.getRoomsByTeacherAndStatus(teacherId, 'active');
  }
  //@Authorized(['teacher'])
  @Get('/teacher/:teacherId/ended')
  async getEndedRoomsByTeacher(@Param('teacherId') teacherId: string) {
    return await this.roomService.getRoomsByTeacherAndStatus(teacherId, 'ended');
  }

  //@Authorized(['teacher'])
  @Get('/:roomId/analysis')
  async getPollAnalysis(@Param('roomId') roomId: string) {
    // Fetch from service
    const analysis = await this.roomService.getPollAnalysis(roomId);
    return { success: true, data: analysis };
  }

  //@Authorized()
  @Post('/:code/polls/answer')
  async submitPollAnswer(
    @Param('code') roomCode: string,
    @Body() body: { pollId: string; userId: string; answerIndex: number },
  ) {
    logger.info('Submitting poll answer', { roomCode, pollId: body.pollId, userId: body.userId });
    await this.pollService.submitAnswer(roomCode, body.pollId, body.userId, body.answerIndex);
    const updatedResults = await this.pollService.getPollResults(roomCode);
    pollSocket.emitToRoom(roomCode, 'poll-results-updated', updatedResults);
    return { success: true };
  }

  // Fetch Results for All Polls in Room
  //@Authorized()
  @Get('/:code/polls/results')
  async getResultsForRoom(@Param('code') code: string) {
    return await this.pollService.getPollResults(code);
  }

  //@Authorized(['teacher'])
  @Post('/:code/end')
  async endRoom(@Param('code') code: string) {
    logger.info('Ending room', { roomCode: code });
    const success = await this.roomService.endRoom(code);
    if (!success) {
      logger.warn('Room not found for ending', { roomCode: code });
      throw ApiError.notFound('Room not found');
    }
    pollSocket.emitToRoom(code, 'room-ended', {});
    return { success: true, message: 'Room ended successfully' };
  }

  @Get('/youtube-audio')
  @HttpCode(200)
  async getYoutubeAudio(@Req() req: Request, @Res() res: Response) {
    const youtubeUrl = req.query.url as string;
    const tempPaths: string[] = [];
    try {
      if (!youtubeUrl) {
        logger.warn('Missing YouTube URL in request');
        return res.status(400).json({ message: 'Missing YouTube URL.' });
      }
      logger.info('Processing YouTube audio request', { youtubeUrl });

      const videoPath = await this.videoService.downloadVideo(youtubeUrl);
      tempPaths.push(videoPath);

      const audioPath = await this.audioService.extractAudio(videoPath);
      tempPaths.push(audioPath);

      const mimeType = mime.lookup(audioPath) || 'audio/mpeg';
      const audioBuffer = await fsp.readFile(audioPath);

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', audioBuffer.length);
      res.setHeader('Content-Disposition', 'inline');

      logger.info('Streaming audio to client', {
        audioPath,
        bufferSize: audioBuffer.length,
        mimeType,
      });
      return res.send(audioBuffer);
    } catch (error: any) {
      logger.error('Error in YouTube audio extraction', error, { youtubeUrl });
      await this.cleanupService.cleanup(tempPaths);
      return res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
  }

  // 🔹 AI Question Generation from transcript or YouTube
  //@Authorized(['teacher'])
  @UseBefore(AiRateLimiter, UserAiRateLimiter)
  @Post('/:code/generate-questions')
  @HttpCode(200)
  async generateQuestionsFromTranscript(@Req() req: Request, @Res() res: Response) {
    const tempPaths: string[] = [];

    await new Promise<void>((resolve, reject) => {
      upload.single('file')(req, res, (err) => (err ? reject(err) : resolve()));
    });

    try {
      const { transcript, questionSpec, model, questionCount } = req.body;

      const defaultModel = 'gemma3';
      const selectedModel = model?.trim() || defaultModel;

      // Parse questionCount with default value of 2
      const numQuestions = questionCount ? parseInt(questionCount, 10) : 2;

      logger.info('Generating questions from transcript', {
        transcriptLength: transcript.length,
        model: selectedModel,
        numQuestions,
      });

      let segments: Record<string, string>;
      if (transcript.length <= SEGMENTATION.SEGMENTATION_THRESHOLD) {
        logger.info('Small transcript detected, using full transcript without segmentation', {
          transcriptLength: transcript.length,
        });
        segments = { full: transcript };
      } else {
        logger.info('Large transcript detected, running segmentation', {
          transcriptLength: transcript.length,
          threshold: SEGMENTATION.SEGMENTATION_THRESHOLD,
        });
        segments = await this.aiContentService.segmentTranscript(transcript, selectedModel);
      }

      // ✅ Safe default questionSpec with custom count
      let safeSpec: QuestionSpec[] = [{ SOL: numQuestions }];
      if (questionSpec && typeof questionSpec === 'object' && !Array.isArray(questionSpec)) {
        safeSpec = [questionSpec];
      } else if (Array.isArray(questionSpec) && typeof questionSpec[0] === 'object') {
        safeSpec = questionSpec;
      } else {
        logger.warn('Invalid questionSpec provided, using default', {
          defaultSpec: `SOL: ${numQuestions}`,
        });
      }

      logger.info('Question generation parameters', {
        questionSpec: safeSpec,
        segmentCount: Object.keys(segments).length,
        transcriptPreview: Object.values(segments)[0]?.substring(0, 100),
      });

      const generatedQuestions = await this.aiContentService.generateQuestions({
        segments,
        globalQuestionSpecification: safeSpec,
        model: selectedModel,
      });

      logger.info('Questions generated successfully', {
        totalQuestions: generatedQuestions.length,
        requestedQuestions: numQuestions,
      });

      return res.json({
        message: 'Questions generated successfully from transcript.',
        transcriptPreview: transcript.substring(0, 200) + '...',
        segmentsCount: Object.keys(segments).length,
        totalQuestions: generatedQuestions.length,
        requestedQuestions: numQuestions,
        questions: generatedQuestions,
      });
    } catch (err: any) {
      logger.error('Error generating questions', err);
      return res
        .status(err.status || 500)
        .json({ message: err.message || 'Internal Server Error' });
    } finally {
      await this.cleanupService.cleanup(tempPaths);
    }
  }
}
