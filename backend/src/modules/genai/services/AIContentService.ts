import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { injectable } from 'inversify';
import { HttpError, InternalServerError } from 'routing-controllers';
import { questionSchemas } from '../schemas/index.js';
import { extractJSONFromMarkdown } from '../utils/extractJSONFromMarkdown.js';
import { cleanTranscriptLines } from '../utils/cleanTranscriptLines.js';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { aiConfig } from '#root/config/ai.js';
import { retryIfRetryable } from '#root/shared/utils/retry.js';
import { logger } from '#root/shared/utils/logger.js';
import { ApiError } from '#shared/index.js';
import { SEGMENTATION, AI_QUESTION_DEFAULTS } from '#root/shared/constants/pollConstants.js';

// --- Type Definitions ---
export interface TranscriptSegment {
  end_time: string;
  transcript_lines: string[];
}

export interface GeneratedQuestion {
  segmentId?: string;
  questionType?: string;
  questionText: string;
  options?: Array<{ text: string; correct?: boolean; explanation?: string }>;
  solution?: any;
  isParameterized?: boolean;
  timeLimitSeconds?: number;
  points?: number;
}

export type QuestionType = 'SOL' | 'SML' | 'OTL' | 'NAT' | 'DES';
export type QuestionSpec = Partial<Record<QuestionType, number>>;

@injectable()
export class AIContentService {
  //private readonly ollimaApiBaseUrl = 'http://localhost:11434/api';
  private readonly ollimaApiBaseUrl = `http://${aiConfig.serverIP}:${aiConfig.serverPort}/api`;
  private readonly llmApiUrl = `${this.ollimaApiBaseUrl}/generate`;

  private createProxyAgent() {
    try {
      return new SocksProxyAgent('socks5://localhost:1055');
    } catch (error) {
      logger.error('Failed to create SOCKS proxy agent', error as Error);
      return undefined;
    }
  }

  private getRequestConfig(): AxiosRequestConfig {
    const config: AxiosRequestConfig = {
      timeout: 180000, // 3 min request timeout
    };

    try {
      const isLocal =
        this.ollimaApiBaseUrl.includes('localhost') || this.ollimaApiBaseUrl.includes('127.0.0.1');
      if (aiConfig.useProxy && !isLocal) {
        const proxyAgent = this.createProxyAgent();
        if (proxyAgent) {
          logger.debug('Using SOCKS proxy for Ollama connection', {
            url: this.ollimaApiBaseUrl,
          });
          config.httpAgent = proxyAgent;
          config.httpsAgent = proxyAgent;
        } else {
          logger.warn('Failed to create proxy agent, falling back to direct connection');
        }
      } else {
        logger.debug('Direct connection to Ollama', { url: this.ollimaApiBaseUrl });
      }
    } catch (error) {
      logger.error('Error configuring request', error as Error);
    }

    return config;
  }

  // --- Segmentation Logic ---
  public async segmentTranscript(
    transcript: string,
    model = 'gemma3',
    desiredSegments = SEGMENTATION.DEFAULT_SEGMENTS,
  ): Promise<Record<string, string>> {
    if (!transcript?.trim()) {
      throw new HttpError(400, 'Transcript text is required and must be non-empty.');
    }

    logger.info('Processing transcript for segmentation', {
      transcriptLength: transcript.length,
      model,
      desiredSegments,
    });

    const prompt = `Analyze the following timed lecture transcript. Segment into meaningful subtopics (max ${desiredSegments} segments).
Format: each line as [start_time --> end_time] text OR start_time --> end_time text.
Response must be ONLY valid JSON array, no markdown, no explanation, no comments.
Use property name "transcript_lines" exactly.

Example:
[
  {
    "end_time": "01:30.000",
    "transcript_lines": ["00:00.000 --> 00:30.000 Text", "00:30.000 --> 01:30.000 More text"]
  }
]

Transcript:
${transcript}

JSON:`;

    let segments: TranscriptSegment[] = [];

    try {
      logger.info('Connecting to Ollama API for transcript segmentation', {
        url: this.llmApiUrl,
        model,
        transcriptLength: transcript.length,
      });

      const config = this.getRequestConfig();

      // Wrap Ollama API call with retry logic
      const response = await retryIfRetryable(
        () =>
          axios.post(
            this.llmApiUrl,
            {
              model,
              prompt,
              stream: false,
              options: { temperature: 0.1, top_p: 0.9 },
            },
            config,
          ),
        {
          maxRetries: 3,
          initialDelayMs: 2000,
          onRetry: (error, attempt) => {
            logger.warn('Retrying Ollama transcript segmentation', {
              attempt,
              error: error.message,
              model,
            });
          },
        },
      );

      const generatedText = response.data?.response;
      if (typeof generatedText !== 'string') {
        throw ApiError.internal('Unexpected Ollama response format.');
      }

      logger.debug('Ollama segmentation response received', {
        responseLength: generatedText.length,
      });

      let jsonToParse = '';
      try {
        const cleaned = extractJSONFromMarkdown(generatedText);
        const arrayMatch = cleaned.match(/\[[\s\S]*?\]/);
        jsonToParse = arrayMatch ? arrayMatch[0] : cleaned;

        const fixedJson = jsonToParse
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/}\s*{/g, '},{')
          .replace(/]\s*\[/g, '],[')
          .replace(/\s+/g, ' ')
          .trim();

        logger.debug('Attempting to parse segmentation JSON...');
        segments = JSON.parse(fixedJson);

        if (!Array.isArray(segments) || segments.length === 0) {
          throw new Error('Parsed segments invalid or empty.');
        }

        segments.forEach((seg, idx) => {
          if (!seg.end_time || !Array.isArray(seg.transcript_lines)) {
            throw new Error(`Invalid segment at index ${idx}`);
          }
        });

        logger.info('Successfully parsed segments from Ollama', {
          segmentCount: segments.length,
        });
      } catch (parseError: any) {
        logger.error('JSON parse failed in segmentTranscript', parseError, {
          rawTextPreview: generatedText.slice(0, 200),
        });

        // Fallback segmentation
        logger.info('Using fallback segmentation');
        const lines = transcript.split('\n').filter((line) => line.trim() !== '');
        const desiredSegments = 3;
        const minLines = 8;
        segments = [];
        if (lines.length <= minLines) {
          // Transcript is very small → single segment
          const lastLine = lines[lines.length - 1] || '';
          const timeMatch = lastLine.match(/(\d{2}:\d{2}(?::\d{2})?\.\d{3})/g);
          const endTime =
            timeMatch && timeMatch.length > 0 ? timeMatch[timeMatch.length - 1] : '00:00.000';
          segments.push({
            end_time: endTime,
            transcript_lines: lines,
          });
          logger.info('Small transcript detected, created single segment', {
            lineCount: lines.length,
          });
        } else {
          // Larger transcript → split into segments with minLines
          const linesPerSegment = Math.max(minLines, Math.ceil(lines.length / desiredSegments));
          for (let i = 0; i < lines.length; i += linesPerSegment) {
            const segmentLines = lines.slice(i, i + linesPerSegment);
            const lastLine = segmentLines[segmentLines.length - 1] || '';
            const timeMatch = lastLine.match(/(\d{2}:\d{2}(?::\d{2})?\.\d{3})/g);
            const endTime =
              timeMatch && timeMatch.length > 0
                ? timeMatch[timeMatch.length - 1]
                : `00:${String(i).padStart(2, '0')}.000`;
            segments.push({
              end_time: endTime,
              transcript_lines: segmentLines,
            });
          }
          logger.info('Created fallback segments', {
            segmentCount: segments.length,
          });
        }
      }
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        logger.error('Ollama API error in segmentTranscript', error, {
          code: error.code,
          networkError: (error as any).cause,
          config: error.config
            ? {
                url: error.config.url,
                method: error.config.method,
                timeout: error.config.timeout,
                hasProxy: !!(error.config.httpAgent || error.config.httpsAgent),
              }
            : 'No config',
        });

        if (error.code === 'ETIMEDOUT') {
          throw ApiError.serviceUnavailable(
            'Connection to Ollama server timed out. Please check network connectivity and Tailscale status.',
          );
        } else if (error.code === 'ECONNREFUSED') {
          throw ApiError.serviceUnavailable(
            'Connection to Ollama server refused. Server may be down or unreachable.',
          );
        } else {
          throw ApiError.internal(
            `Ollama API error: ${(error.response?.data as any)?.error || error.message}`,
          );
        }
      }
      logger.error('Segmentation failed', error);
      throw ApiError.internal(`Segmentation failed: ${error.message}`);
    }

    // Clean transcript lines and build final object
    const result: Record<string, string> = {};
    for (const seg of segments) {
      try {
        const clean = cleanTranscriptLines(seg.transcript_lines);
        if (clean?.trim()) {
          result[seg.end_time] = clean;
        }
      } catch (e) {
        logger.warn('Failed cleaning segment', {
          endTime: seg.end_time,
          error: e,
        });
      }
    }

    logger.info('Segmentation complete', {
      segmentCount: Object.keys(result).length,
    });
    return result;
  }

  // --- Question Generation Logic ---
  private createQuestionPrompt(
    questionType: string,
    count: number,
    transcriptContent: string,
  ): string {
    const base = `You are an AI question generator.
Based on the transcript below, generate EXACTLY ${count} question(s) of type ${questionType}.
For each question:
- Provide exactly 4 options only.
- Mark the correct option.

IMPORTANT: Generate exactly ${count} questions, no more, no less.

You must output JSON **exactly** in this shape, no nesting, no markdown:
[
  {
    "questionText": "...",
    "options": [
      { "text": "...", "correct": true, "explanation": "..." },
      { "text": "...", "correct": false, "explanation": "..." }
    ],
    "solution": "...",
    "isParameterized": false,
    "timeLimitSeconds": 60,
    "points": 5
  }
]
Do not wrap questionText inside another 'question' object. Output must be raw JSON.

Important:
- Output only JSON, no markdown, no extra text.
- Each question must have at least 4 options.
- Only one option can have "correct": true for SOL.
- Fill all fields.
- questionText must be clear and relevant to transcript.
- explanation field must explain why the option is correct/incorrect.
- Generate EXACTLY ${count} questions.

Transcript:
${transcriptContent}

`;

    const instructions: Record<string, string> = {
      SOL: `Generate ${count} single-correct MCQ as above. timeLimitSeconds:60, points:5`,
      SML: `Generate ${count} multiple-correct MCQ, 2-3 correct:true, timeLimitSeconds:90, points:8`,
      OTL: `Generate ${count} ordering question, with options in correct order, timeLimitSeconds:120, points:10`,
      NAT: `Generate ${count} numeric answer with value, timeLimitSeconds:90, points:6`,
      DES: `Generate ${count} descriptive answer, detailed solution, timeLimitSeconds:300, points:15`,
    };

    return base + (instructions[questionType] || '');
  }

  public async generateQuestions(args: {
    segments: Record<string | number, string>;
    globalQuestionSpecification: QuestionSpec[];
    model?: string;
  }): Promise<GeneratedQuestion[]> {
    const { segments, globalQuestionSpecification, model = 'gemma3' } = args;

    if (!segments || Object.keys(segments).length === 0) {
      throw new HttpError(400, 'segments must be a non-empty object.');
    }
    if (
      !globalQuestionSpecification?.length ||
      !Object.keys(globalQuestionSpecification[0] || {}).length
    ) {
      throw new HttpError(
        400,
        'globalQuestionSpecification must be a non-empty array with at least one spec.',
      );
    }

    // // DEVELOPMENT MODE: Return dummy questions while Ollama is not set up
    // console.log('[generateQuestions] Using dummy response mode');
    // return [
    //   {
    //     questionText: "What is the primary purpose of React in web development?",
    //     options: [
    //       { text: "Database management", correct: false, explanation: "React is not a database management system" },
    //       { text: "View layer and UI components", correct: true, explanation: "React is primarily used for building user interfaces" },
    //       { text: "Server-side processing", correct: false, explanation: "React is primarily client-side" },
    //       { text: "Network security", correct: false, explanation: "React is not a security tool" }
    //     ],
    //     solution: "React is a JavaScript library for building user interfaces, particularly the view layer.",
    //     isParameterized: false,
    //     timeLimitSeconds: 60,
    //     points: 5,
    //     questionType: "SOL"
    //   },
    //   {
    //     questionText: "Which feature of React helps in optimizing performance by comparing virtual DOM?",
    //     options: [
    //       { text: "Event bubbling", correct: false, explanation: "This is a general JavaScript concept" },
    //       { text: "State management", correct: false, explanation: "While important, this isn't about DOM comparison" },
    //       { text: "Reconciliation", correct: true, explanation: "React's reconciliation process compares virtual DOM trees" },
    //       { text: "CSS-in-JS", correct: false, explanation: "This is about styling, not performance optimization" }
    //     ],
    //     solution: "React uses reconciliation to efficiently update the actual DOM by comparing virtual DOM trees.",
    //     isParameterized: false,
    //     timeLimitSeconds: 60,
    //     points: 5,
    //     questionType: "SOL"
    //   }
    // ];

    const questionSpecs = globalQuestionSpecification[0];
    const allQuestions: GeneratedQuestion[] = [];
    logger.info('Generating questions', { model });

    for (const rawSegmentId in segments) {
      const segmentId = String(rawSegmentId); // normalize
      const transcript = segments[segmentId];
      if (!transcript) continue;

      for (const [type, count] of Object.entries(questionSpecs)) {
        if (typeof count === 'number' && count > 0) {
          try {
            const schema = (questionSchemas as any)[type];
            if (!schema) {
              logger.warn('No schema found for question type', { type });
            }

            const format =
              count === 1
                ? schema
                : { type: 'array', items: schema, minItems: count, maxItems: count };
            const prompt = this.createQuestionPrompt(type, count, transcript);

            logger.info('Generating questions with Ollama', {
              url: this.llmApiUrl,
              model,
              questionType: type,
              count,
              segmentId,
            });

            const config = this.getRequestConfig();

            // Wrap Ollama API call with retry logic
            const response = await retryIfRetryable(
              () =>
                axios.post(
                  this.llmApiUrl,
                  {
                    model,
                    prompt,
                    stream: false,
                    format: schema ? format : undefined,
                    options: { temperature: 0.2 },
                  },
                  config,
                ),
              {
                maxRetries: 3,
                initialDelayMs: 2000,
                maxDelayMs: 10000,
                onRetry: (error, attempt) => {
                  logger.warn('Retrying Ollama question generation', {
                    attempt,
                    error: error.message,
                    model,
                    questionType: type,
                    segmentId,
                  });
                },
              },
            );

            logger.info('Successfully received Ollama response', {
              questionType: type,
            });

            const text = response.data?.response;
            if (typeof text !== 'string') {
              logger.warn('Unexpected response type from Ollama', {
                questionType: type,
                segmentId,
              });
              continue;
            }

            const cleaned = extractJSONFromMarkdown(text);
            const parsed = JSON.parse(cleaned);
            const questions = Array.isArray(parsed) ? parsed : [parsed];

            // Process and normalize each question
            questions.forEach((q) => {
              const questionText = q.questionText || q.question?.text || '';
              const options = q.options || [];
              const solution = typeof q.solution === 'string' ? q.solution : '';

              allQuestions.push({
                questionText,
                options,
                solution,
                isParameterized: q.isParameterized ?? false,
                timeLimitSeconds: q.timeLimitSeconds ?? 60,
                points: q.points ?? 5,
                segmentId,
                questionType: type,
              });
            });
            logger.info('Generated questions for segment', {
              count: questions.length,
              questionType: type,
              segmentId,
              rawTextPreview: text.slice(0, 500),
            });
          } catch (e: any) {
            logger.error('Failed to generate questions', e, {
              questionType: type,
              segmentId,
            });
            if (axios.isAxiosError(e)) {
              logger.error('Ollama API error details in generateQuestions', e, {
                code: e.code,
                networkError: (e as any).cause,
                config: e.config
                  ? {
                      url: e.config.url,
                      method: e.config.method,
                      timeout: e.config.timeout,
                      hasProxy: !!(e.config.httpAgent || e.config.httpsAgent),
                    }
                  : 'No config',
              });

              if (e.code === 'ETIMEDOUT') {
                logger.error(
                  'Connection to Ollama server timed out. Check network and Tailscale status.',
                );
              } else if (e.code === 'ECONNREFUSED') {
                logger.error(
                  'Connection to Ollama server refused. Server may be down or unreachable.',
                );
              }
            }
          }
        }
      }
    }

    logger.info('Question generation complete', {
      totalQuestions: allQuestions.length,
    });
    return allQuestions;
  }
}
