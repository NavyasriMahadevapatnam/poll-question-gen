import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Clock, Circle, CheckCircle, X } from "lucide-react";
import { Poll } from "../hooks/useStudentPoll";

interface ActivePollCardProps {
  poll: Poll;
  timeLeft: number;
  selectedOption: number | null;
  onOptionSelect: (pollId: string, optionIndex: number) => void;
  onSubmit: (pollId: string) => void;
  getTimerColor: (time: number) => string;
  getTimerBg: (time: number) => string;
}

export const ActivePollCard = ({
  poll,
  timeLeft,
  selectedOption,
  onOptionSelect,
  onSubmit,
  getTimerColor,
  getTimerBg,
}: ActivePollCardProps) => {
  return (
    <Card className="overflow-hidden border-purple-200 dark:border-purple-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-xl">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Active Poll</CardTitle>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getTimerBg(timeLeft)}`}>
            <Clock className={`w-4 h-4 ${getTimerColor(timeLeft)}`} />
            <span className={`font-mono font-bold ${getTimerColor(timeLeft)}`}>
              {timeLeft}s
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
          {poll.question}
        </h3>
        <div className="space-y-3">
          {poll.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => onOptionSelect(poll._id, idx)}
              disabled={timeLeft === 0}
              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left flex items-center gap-3 ${
                selectedOption === idx
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30"
                  : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600"
              } ${timeLeft === 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {selectedOption === idx ? (
                <CheckCircle className="w-5 h-5 text-purple-600" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {option}
              </span>
            </button>
          ))}
        </div>
        <Button
          onClick={() => onSubmit(poll._id)}
          disabled={selectedOption === null || timeLeft === 0}
          className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          Submit Answer
        </Button>
      </CardContent>
    </Card>
  );
};
