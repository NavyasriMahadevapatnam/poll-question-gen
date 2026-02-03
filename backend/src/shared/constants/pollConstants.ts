export const SCORING = {
  /** Points awarded for correct answer */
  CORRECT_ANSWER_POINTS: 5,

  /** Points deducted for wrong answer */
  WRONG_ANSWER_PENALTY: -2,

  /** Points per correct answer in dashboard */
  DASHBOARD_CORRECT_POINTS: 20,
} as const;

export const TIME = {
  /** Milliseconds in one second */
  MS_PER_SECOND: 1000,

  /** Seconds in one minute */
  SECONDS_PER_MINUTE: 60,

  /** Milliseconds in one minute */
  MS_PER_MINUTE: 60000,
} as const;

export const POLL_CONFIG = {
  /** Default timer for polls (in seconds) */
  DEFAULT_TIMER_SECONDS: 30,

  /** Minimum timer value (in seconds) */
  MIN_TIMER_SECONDS: 5,

  /** Maximum timer value (in seconds) */
  MAX_TIMER_SECONDS: 300,
} as const;

export const SEGMENTATION = {
  /** Default number of transcript segments */
  DEFAULT_SEGMENTS: 3,

  /** Minimum lines per segment for fallback */
  MIN_LINES_PER_SEGMENT: 8,

  /** Transcript length threshold for segmentation */
  SEGMENTATION_THRESHOLD: 6000,
} as const;

export const AI_QUESTION_DEFAULTS = {
  /** Default time limit for questions (in seconds) */
  DEFAULT_TIME_LIMIT: 60,

  /** Default points for questions */
  DEFAULT_POINTS: 5,

  /** Default number of options for MCQ */
  DEFAULT_OPTIONS_COUNT: 4,
} as const;

export const ROOM = {
  /** Length of substring for room code */
  CODE_SUBSTRING_START: 2,

  /** Length of room code */
  CODE_SUBSTRING_END: 8,

  /** Base for random string generation */
  RANDOM_BASE: 36,
} as const;
