import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Trophy, CheckCircle, X } from "lucide-react";
import { Poll } from "../hooks/useStudentPoll";
import { StatusBadge } from "./StatusBadge";

interface PollHistoryCardProps {
  poll: Poll;
  userAnswer: number;
  status: 'correct' | 'incorrect' | 'unanswered';
}

export const PollHistoryCard = ({
  poll,
  userAnswer,
  status,
}: PollHistoryCardProps) => {
  return (
    <Card className="border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{poll.question}</CardTitle>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {poll.options.map((option, idx) => {
            const isUserAnswer = userAnswer === idx;
            const isCorrect = poll.correctOptionIndex === idx;
            
            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border flex items-center justify-between ${
                  isCorrect
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30"
                    : isUserAnswer
                    ? "border-red-500 bg-red-50 dark:bg-red-900/30"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {option}
                </span>
                <div className="flex items-center gap-2">
                  {isUserAnswer && !isCorrect && (
                    <X className="w-5 h-5 text-red-600" />
                  )}
                  {isCorrect && (
                    <div className="flex items-center gap-1">
                      {isUserAnswer && <Trophy className="w-5 h-5 text-emerald-600" />}
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
