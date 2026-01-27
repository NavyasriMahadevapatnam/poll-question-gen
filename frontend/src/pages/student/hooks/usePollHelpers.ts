import { Poll } from './useStudentPoll';

export const usePollHelpers = () => {
  const getTimerColor = (timeLeft: number) => {
    if (timeLeft > 20) return "text-emerald-500";
    if (timeLeft > 10) return "text-amber-500";
    return "text-red-500";
  };

  const getTimerBg = (timeLeft: number) => {
    if (timeLeft > 20) return "bg-emerald-500/20";
    if (timeLeft > 10) return "bg-amber-500/20";
    return "bg-red-500/20";
  };

  const getPollAnswerStatus = (
    poll: Poll,
    userId: string | undefined,
    answeredPolls: Record<string, number>
  ): 'correct' | 'incorrect' | 'unanswered' => {
    if (!userId) return 'unanswered';

    const userAnswer = answeredPolls[poll._id];
    if (userAnswer === undefined) {
      const pollAnswer = poll.answers?.find(answer => answer.userId === userId);
      if (pollAnswer) {
        return pollAnswer.answerIndex === poll.correctOptionIndex ? 'correct' : 'incorrect';
      }
      return 'unanswered';
    }

    return userAnswer === poll.correctOptionIndex ? 'correct' : 'incorrect';
  };

  return {
    getTimerColor,
    getTimerBg,
    getPollAnswerStatus,
  };
};
