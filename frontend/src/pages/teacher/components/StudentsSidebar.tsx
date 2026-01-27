import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface StudentsSidebarProps {
  students: Array<{ id?: string; firstName?: string; name?: string }>;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}

export const StudentsSidebar = ({
  students,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
}: StudentsSidebarProps) => {
  return (
    <div className={`${isSidebarCollapsed ? 'w-12' : 'w-54'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out`}>
      {/* Sidebar header with title and toggle button */}
      <div className={`h-16 border-b border-gray-200 dark:border-gray-700 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'px-4'} flex-shrink-0`}>
        {!isSidebarCollapsed && (
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex-1">
            Students
          </h2>
        )}
        <Button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`transition-all ${isSidebarCollapsed ? 'p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md' : 'p-2 hover:bg-purple-100 dark:hover:bg-purple-900/50'}`}
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          variant="ghost"
          size="icon"
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          ) : (
            <ChevronLeft className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          )}
        </Button>
      </div>

      {/* Student list content */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {students.length > 0 ? (
            students.map((student: any, index: number) => {
              const studentName = student?.firstName || student?.name;
              return (
                <div
                  key={index}
                  className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2 flex-shrink-0"></div>
                  {!isSidebarCollapsed && (
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {studentName}
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No students connected yet
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
