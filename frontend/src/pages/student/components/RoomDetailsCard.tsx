import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, Users, Clock, ChevronDown, ChevronUp, X } from "lucide-react";

interface RoomInfo {
  roomCode: string;
  teacherName?: string;
  createdAt: string;
  studentCount?: number;
}

interface RoomDetailsCardProps {
  roomInfo: RoomInfo;
  isExpanded: boolean;
  onToggle: () => void;
  onClose?: () => void;
}

export const RoomDetailsCard = ({
  roomInfo,
  isExpanded,
  onToggle,
  onClose,
}: RoomDetailsCardProps) => {
  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/80 to-cyan-50/80 dark:from-blue-900/20 dark:to-cyan-900/20 backdrop-blur-sm">
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-lg text-blue-700 dark:text-blue-300">
              Room Details
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-blue-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-blue-600" />
            )}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Room Code</p>
              <p className="font-semibold text-gray-800 dark:text-gray-100">
                {roomInfo.roomCode}
              </p>
            </div>
          </div>
          {roomInfo.teacherName && (
            <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Teacher</p>
                <p className="font-semibold text-gray-800 dark:text-gray-100">
                  {roomInfo.teacherName}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Created At</p>
              <p className="font-semibold text-gray-800 dark:text-gray-100">
                {new Date(roomInfo.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
