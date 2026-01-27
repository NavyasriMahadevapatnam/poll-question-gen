import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Trash2 } from "lucide-react";

interface PollOption {
  text: string;
}

interface PollCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  pollQuestion: string;
  onPollQuestionChange: (value: string) => void;
  options: PollOption[];
  onOptionsChange: (options: PollOption[]) => void;
  onCreatePoll: () => void;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
  isCreatingPoll?: boolean;
}

export const PollCreationModal = ({
  isOpen,
  onClose,
  pollQuestion,
  onPollQuestionChange,
  options,
  onOptionsChange,
  onCreatePoll,
  onAddOption,
  onRemoveOption,
  isCreatingPoll = false,
}: PollCreationModalProps) => {
  if (!isOpen) return null;

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...options];
    updatedOptions[index] = { text: value };
    onOptionsChange(updatedOptions);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto bg-white dark:bg-gray-800">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-white">
              Create New Poll
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={isCreatingPoll}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Poll Question */}
          <div className="space-y-2">
            <Label
              htmlFor="poll-question"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Poll Question
            </Label>
            <Input
              id="poll-question"
              type="text"
              value={pollQuestion}
              onChange={(e) => onPollQuestionChange(e.target.value)}
              placeholder="Enter your poll question..."
              className="w-full"
              disabled={isCreatingPoll}
            />
          </div>

          {/* Poll Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Answer Options
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddOption}
                disabled={isCreatingPoll}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Option
              </Button>
            </div>

            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                    disabled={isCreatingPoll}
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveOption(index)}
                      disabled={isCreatingPoll}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex justify-end gap-3 w-full">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isCreatingPoll}
            >
              Cancel
            </Button>
            <Button
              onClick={onCreatePoll}
              disabled={
                !pollQuestion.trim() ||
                options.some((opt) => !opt.text.trim()) ||
                isCreatingPoll
              }
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isCreatingPoll ? "Creating..." : "Create Poll"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
