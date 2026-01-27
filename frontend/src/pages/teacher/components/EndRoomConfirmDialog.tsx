import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface EndRoomConfirmDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isEnding?: boolean;
}

export const EndRoomConfirmDialog = ({
  isOpen,
  onCancel,
  onConfirm,
  isEnding = false,
}: EndRoomConfirmDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle size={20} />
            End Room Confirmation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to end this room? This action cannot be undone.
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• All students will be disconnected</li>
            <li>• Active polls will be stopped</li>
            <li>• Room will be permanently closed</li>
          </ul>
          <div className="flex gap-3 justify-end">
            <Button
              onClick={onCancel}
              variant="outline"
              disabled={isEnding}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              variant="destructive"
              disabled={isEnding}
            >
              {isEnding ? "Ending..." : "End Room"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
