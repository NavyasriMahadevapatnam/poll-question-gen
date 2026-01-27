import { useState, useRef, useCallback } from 'react';
import { useTranscriber } from '@/hooks/useTranscriber';

export type SupportedLanguage =
  | "en-IN"
  | "en-US"
  | "hi-IN"
  | "bn-IN"
  | "te-IN"
  | "mr-IN"
  | "ta-IN"
  | "gu-IN"
  | "kn-IN"
  | "ml-IN"
  | "pa-IN"
  | "ur-IN";

export const useAudioTranscription = () => {
  // Transcription state
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [transcript, setTranscript] = useState('');
  const [transcribedTextFromExternal, setTranscribedTextFromExternal] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [language, setLanguage] = useState<SupportedLanguage>("en-IN");
  const [frequencyData, setFrequencyData] = useState<number[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [partialTranscripts, setPartialTranscripts] = useState<{ seq: number; text: string }[]>([]);

  // Refs
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioManagerKeyRef = useRef(0);

  // Transcriber hook
  const transcriber = useTranscriber();

  // Update audio level
  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.fftSize);
    analyserRef.current.getByteFrequencyData(dataArray);

    const frequencyBars = Array.from(dataArray.slice(0, 16)).map(
      (value) => (value / 255) * 100
    );
    setFrequencyData(frequencyBars);

    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  }, []);

  // Handle recording toggle
  const handleRecordingToggle = useCallback(async (isFromOnEnd?: boolean) => {
    if (isRecording && !isFromOnEnd) {
      setIsRecording(false);
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      transcriber.onInputChange();

      // Stop audio visualization
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      const textBuffer = transcribedTextFromExternal || transcript ||
        (transcriber.accumulatedChunks && transcriber.accumulatedChunks.length > 0
          ? (transcriber.accumulatedChunks ?? []).map((c) => c.text).join(" ").trim()
          : "");

      const words = textBuffer ? textBuffer.split(/\s+/).filter(Boolean) : [];

      if (words.length >= 30) {
        return textBuffer;
      }
    }
  }, [isRecording, transcript, transcribedTextFromExternal, transcriber]);

  // Reset transcription state
  const resetTranscription = useCallback(() => {
    setTranscript('');
    setLiveTranscript('');
    setTranscribedTextFromExternal('');
    setInterimTranscript('');
    setPartialTranscripts([]);
    setFrequencyData([]);
  }, []);

  return {
    // State
    isRecording,
    setIsRecording,
    liveTranscript,
    setLiveTranscript,
    transcript,
    setTranscript,
    transcribedTextFromExternal,
    setTranscribedTextFromExternal,
    isListening,
    setIsListening,
    interimTranscript,
    setInterimTranscript,
    language,
    setLanguage,
    frequencyData,
    setFrequencyData,
    isTranscribing,
    setIsTranscribing,
    partialTranscripts,
    setPartialTranscripts,
    
    // Refs
    recognitionRef,
    audioContextRef,
    analyserRef,
    animationFrameRef,
    audioManagerKeyRef,
    
    // Transcriber
    transcriber,
    
    // Actions
    updateAudioLevel,
    handleRecordingToggle,
    resetTranscription,
  };
};
