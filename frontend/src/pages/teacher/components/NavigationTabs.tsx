import { Button } from "@/components/ui/button";
import { Mic, Wand2, Plus, BarChart2 } from "lucide-react";

interface NavigationTabsProps {
  activeTab: "voice" | "preview" | "poll" | "results";
  onTabChange: (tab: "voice" | "preview" | "poll" | "results") => void;
  hasGeneratedQuestions: boolean;
}

export const NavigationTabs = ({
  activeTab,
  onTabChange,
  hasGeneratedQuestions,
}: NavigationTabsProps) => {
  return (
    <div className="hidden md:flex items-center gap-2">
      <Button
        variant={activeTab === "voice" ? "default" : "outline"}
        onClick={() => onTabChange("voice")}
        className="mr-2"
      >
        <Mic className="w-4 h-4 mr-2" />
        Voice Recorder
      </Button>
      <Button
        variant={activeTab === "preview" ? "default" : "outline"}
        onClick={() => onTabChange("preview")}
        className="mr-2"
        disabled={!hasGeneratedQuestions}
      >
        <Wand2 className="w-4 h-4 mr-2" />
        Generated Questions
      </Button>
      <Button
        variant={activeTab === "poll" ? "default" : "outline"}
        onClick={() => onTabChange("poll")}
        className="mr-2"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create Live Poll
      </Button>
      <Button
        variant={activeTab === "results" ? "default" : "outline"}
        onClick={() => onTabChange("results")}
      >
        <BarChart2 className="w-4 h-4 mr-2" />
        Poll Results
      </Button>
    </div>
  );
};
