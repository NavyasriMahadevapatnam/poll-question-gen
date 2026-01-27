import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api/api';

export type PollResponseData = {
  responses: Record<string, number>;
  totalResponses: number;
  userResponses: Record<string, Array<{ userId: string; userName: string }>>;
  question?: string;
  options?: string[];
  timeLeft?: number;
  timer?: number;
};

export type PollResults = Record<string, PollResponseData>;

interface UsePollManagementProps {
  roomCode: string;
}

export const usePollManagement = ({ roomCode }: UsePollManagementProps) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(0);
  const [timer, setTimer] = useState<number>(30);
  const [pollResults, setPollResults] = useState<PollResults>({});
  const [livePollResults, setLivePollResults] = useState<Record<string, PollResponseData>>({});
  const [showMemberNames, setShowMemberNames] = useState<Record<string, boolean>>({});

  const [showPollModal, setShowPollModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);

  const createPoll = useCallback(async () => {
    if (!question || options.filter((opt) => opt.trim()).length < 2) {
      toast.error("Please provide a question and at least two options!");
      return;
    }

    try {
      await api.post(`/livequizzes/rooms/${roomCode}/polls`, {
        question,
        options: options.filter(opt => opt.trim()),
        correctOptionIndex,
        timer,
      });

      toast.success("Poll created!");
      setQuestion("");
      setOptions(["", "", "", ""]);
      setCorrectOptionIndex(0);
      await fetchResults();
    } catch (error) {
      toast.error("Failed to create poll");
    }
  }, [question, options, correctOptionIndex, timer, roomCode]);

  const fetchResults = useCallback(async () => {
    try {
      const res = await api.get(`/livequizzes/rooms/${roomCode}/polls/results`);
      setPollResults(res.data);
    } catch {
      toast.error("Failed to fetch results");
    }
  }, [roomCode]);

  const toggleMemberNames = useCallback((pollId: string) => {
    setShowMemberNames(prev => ({
      ...prev,
      [pollId]: !prev[pollId]
    }));
  }, []);

  return {
    // State
    question,
    setQuestion,
    options,
    setOptions,
    correctOptionIndex,
    setCorrectOptionIndex,
    timer,
    setTimer,
    pollResults,
    setPollResults,
    livePollResults,
    setLivePollResults,
    showMemberNames,
    setShowMemberNames,
    showPollModal,
    setShowPollModal,
    showResultsModal,
    setShowResultsModal,
    
    // Actions
    createPoll,
    fetchResults,
    toggleMemberNames,
  };
};
