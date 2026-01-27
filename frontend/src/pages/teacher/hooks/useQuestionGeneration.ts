import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api/api';

export type GeneratedQuestion = {
  question: string;
  options: string[];
  correctOptionIndex: number;
};

interface APIQuestionOption {
  text: string;
  correct: boolean;
}

interface APIQuestion {
  questionText: string;
  options: APIQuestionOption[];
}

interface UseQuestionGenerationProps {
  selectedModel: string;
  questionCount: number;
  questionSpec: string;
}

export const useQuestionGeneration = ({
  selectedModel,
  questionCount,
  questionSpec,
}: UseQuestionGenerationProps) => {
  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [queuedGeneratedQuestions, setQueuedGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [isGenerateClicked, setIsGenerateClicked] = useState(false);

  // Refs for queue processing
  const pendingTextChunksRef = useRef<string[]>([]);
  const processingQueueRef = useRef(false);
  const processedWordsRef = useRef<number>(0);
  const bufferTextRef = useRef<string>("");
  const queuedGeneratedQuestionsRef = useRef<GeneratedQuestion[]>([]);

  // Filter question options helper
  const filterQuestionOptions = useCallback((questionData: GeneratedQuestion): GeneratedQuestion => {
    const correctOption = questionData.options[questionData.correctOptionIndex];
    let newCorrectIndex = questionData.correctOptionIndex;
    let filteredOptions: string[] = [];

    if (questionData.options.length <= 4) {
      filteredOptions = [...questionData.options, ...Array(4 - questionData.options.length).fill("")];
    } else {
      // Combined filter operations into single pass for better performance
      const incorrectOptions = questionData.options
        .filter((opt, idx) => idx !== questionData.correctOptionIndex && opt.trim() !== "");

      const shuffledIncorrect = incorrectOptions
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      if (questionData.correctOptionIndex < 4) {
        filteredOptions = Array(4).fill("");
        filteredOptions[questionData.correctOptionIndex] = correctOption;

        let idx = 0;
        for (let i = 0; i < 4; i++) {
          if (i !== questionData.correctOptionIndex) {
            filteredOptions[i] = shuffledIncorrect[idx] || "";
            idx++;
          }
        }
      } else {
        newCorrectIndex = Math.floor(Math.random() * 4);
        filteredOptions = Array(4).fill("");
        filteredOptions[newCorrectIndex] = correctOption;

        let idx = 0;
        for (let i = 0; i < 4; i++) {
          if (i !== newCorrectIndex) {
            filteredOptions[i] = shuffledIncorrect[idx] || "";
            idx++;
          }
        }
      }
    }

    return {
      ...questionData,
      options: filteredOptions,
      correctOptionIndex: newCorrectIndex
    };
  }, []);

  // Process pending queue
  const processPendingQueue = useCallback(async () => {
    if (processingQueueRef.current || pendingTextChunksRef.current.length === 0) {
      return;
    }

    processingQueueRef.current = true;
    const textChunk = pendingTextChunksRef.current.shift();

    if (textChunk) {
      try {
        const response = await api.post('/genai/generate', {
          prompt: `${textChunk}\n\nInstructions:\n${questionSpec || "Generate educational quiz questions"}`,
          model: selectedModel,
          questionCount: Math.min(questionCount, 2),
          systemPrompt: "You are a question generator..."
        });

        const rawQuestions = response.data.questions || [];

        const cleanQuestions: GeneratedQuestion[] = rawQuestions.reduce((acc: GeneratedQuestion[], q: APIQuestion) => {
          if (typeof q.questionText !== 'string' || q.questionText.trim() === '') {
            return acc;
          }
          
          const options = Array.isArray(q.options) ? q.options.map((opt) => opt.text ?? '') : [];
          const correctOptionIndex = Array.isArray(q.options) ? q.options.findIndex((opt) => opt.correct) : 0;

          const validCorrectOptionIndex = correctOptionIndex >= 0 && correctOptionIndex < options.length
            ? correctOptionIndex
            : 0;

          acc.push({
            question: q.questionText,
            options: options,
            correctOptionIndex: validCorrectOptionIndex,
          });
          
          return acc;
        }, []);

        const filteredQuestions = cleanQuestions.map((q: GeneratedQuestion) => filterQuestionOptions(q));

        if (filteredQuestions.length > 0) {
          queuedGeneratedQuestionsRef.current = [...queuedGeneratedQuestionsRef.current, ...filteredQuestions];
          // Use functional setState to ensure we have latest state
          setQueuedGeneratedQuestions(prev => [...prev, ...filteredQuestions]);
        }
      } catch (err) {
        // Failed to process queued chunk
      }
    }

    processingQueueRef.current = false;
  }, [filterQuestionOptions, questionCount, questionSpec, selectedModel]);

  // Enqueue text chunk
  const enqueueTextChunk = useCallback((textChunk: string) => {
    pendingTextChunksRef.current.push(textChunk);
    processPendingQueue();
  }, [processPendingQueue]);

  // Generate questions
  const generateQuestions = useCallback(async (finalSpeechText?: string) => {
    const transcript = finalSpeechText || "";
    
    if (!transcript.trim()) {
      toast.error('No content provided to generate questions');
      return;
    }

    try {
      setIsGenerating(true);
      setIsGenerateClicked(true);

      const response = await api.post('/genai/generate', {
        prompt: `${transcript}\n\nInstructions:\n${questionSpec || "Generate educational quiz questions"}`,
        model: selectedModel,
        questionCount,
        systemPrompt: "You are a question generator..."
      });

      const rawQuestions = response.data.questions || [];
      const cleanQuestions = rawQuestions
        .filter((q: APIQuestion) => typeof q.questionText === 'string' && q.questionText.trim() !== '')
        .map((q: APIQuestion): GeneratedQuestion => {
          const options = Array.isArray(q.options) ? q.options.map((opt) => opt.text ?? '') : [];
          const correctOptionIndex = Array.isArray(q.options) ? q.options.findIndex((opt) => opt.correct) : 0;

          return {
            question: q.questionText,
            options: options,
            correctOptionIndex: correctOptionIndex >= 0 ? correctOptionIndex : 0,
          };
        });

      const filteredQuestions = cleanQuestions.map((q: GeneratedQuestion) => filterQuestionOptions(q));

      if (filteredQuestions.length > 0) {
        setGeneratedQuestions(filteredQuestions);
        setShowPreview(true);
        toast.success(`Generated ${filteredQuestions.length} questions!`);
      } else {
        toast.error('No valid questions generated');
      }
    } catch (error) {
      toast.error('Failed to generate questions');
    } finally {
      setIsGenerating(false);
    }
  }, [questionSpec, selectedModel, questionCount, filterQuestionOptions]);

  return {
    // State
    isGenerating,
    setIsGenerating,
    generatedQuestions,
    setGeneratedQuestions,
    queuedGeneratedQuestions,
    setQueuedGeneratedQuestions,
    showPreview,
    setShowPreview,
    editingQuestionIndex,
    setEditingQuestionIndex,
    isGenerateClicked,
    setIsGenerateClicked,
    
    // Refs
    pendingTextChunksRef,
    processingQueueRef,
    processedWordsRef,
    bufferTextRef,
    queuedGeneratedQuestionsRef,
    
    // Actions
    generateQuestions,
    enqueueTextChunk,
    processPendingQueue,
    filterQuestionOptions,
  };
};
