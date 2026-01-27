import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, Menu, LogOut } from "lucide-react";

interface RoomHeaderProps {
  roomCode: string;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  onExitRoom: () => void;
  onNavigateBack: () => void;
  copyToClipboard: (text: string) => void;
}

export const RoomHeader = ({
  roomCode,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onExitRoom,
  onNavigateBack,
  copyToClipboard,
}: RoomHeaderProps) => {
  return (
    <div className="fixed top-0 left-0 w-full h-16 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700 shadow-sm px-4 py-2 flex items-center justify-between z-50">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={onNavigateBack}
          title="Back to Manage Rooms"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden mr-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Room Code:{" "}
          <span
            className="font-mono bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-red-400 dark:to-blue-400 cursor-pointer hover:opacity-80"
            onClick={() => copyToClipboard(roomCode)}
            title="Click to copy"
          >
            {roomCode}
          </span>
        </h2>
      </div>

      <div className="flex items-center space-x-2">
        <ThemeToggle />
        <Button
          onClick={onExitRoom}
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Exit Room
        </Button>
      </div>
    </div>
  );
};
