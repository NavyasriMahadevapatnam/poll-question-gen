import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import socket from '@/lib/api/socket';

type PollAnswer = {
  userId: string;
  answerIndex: number;
  answeredAt: string;
};

export type Poll = {
  _id: string;
  question: string;
  options: string[];
  roomCode: string;
  creatorId: string;
  createdAt: string;
  timer: number;
  correctOptionIndex?: number;
  answers?: PollAnswer[];
};

type RoomDetails = {
  roomCode: string;
  creatorId: string;
  teacherName?: string;
  createdAt: string;
  room?: {
    roomCode: string;
    name: string;
    teacherId: string;
    teacherName: string;
    createdAt: string;
    status: 'active' | 'ended';
    polls: Poll[];
  };
};

interface UseStudentPollProps {
  roomCode: string;
  userId: string | undefined;
  email: string | undefined;
}

export const useStudentPoll = ({ roomCode, userId, email }: UseStudentPollProps) => {
  const [joinedRoom, setJoinedRoom] = useState(false);
  const [livePolls, setLivePolls] = useState<Poll[]>([]);
  const [roomDetails, setRoomDetails] = useState<RoomDetails | null>(null);
  const [allRoomPolls, setAllRoomPolls] = useState<Poll[]>([]);
  const [answeredPolls, setAnsweredPolls] = useState<Record<string, number>>({});
  const [pollTimers, setPollTimers] = useState<Record<string, number>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number | null>>({});

  // Join room
  const joinRoom = useCallback(() => {
    if (!roomCode) return;
    socket.emit('join-room', roomCode, email);
    setJoinedRoom(true);
    toast.success("Joined room!");
  }, [roomCode, email]);

  // Leave room
  const leaveRoom = useCallback(() => {
    if (!roomCode) return;
    socket.emit("leave-room", roomCode, email);
    setJoinedRoom(false);
    setLivePolls([]);
    setAnsweredPolls({});
    setRoomDetails(null);
    setAllRoomPolls([]);
    localStorage.removeItem("activeRoomCode");
    localStorage.removeItem("joinedRoom");
    toast.info("Left the room.");
  }, [roomCode, email]);

  // Submit answer
  const submitAnswer = useCallback(async (pollId: string, selectedOption: number) => {
    if (!userId) {
      toast.error("You must be logged in to answer");
      return;
    }

    try {
      socket.emit("poll-answer", {
        pollId,
        userId,
        answerIndex: selectedOption,
      });

      setAnsweredPolls(prev => ({
        ...prev,
        [pollId]: selectedOption
      }));

      toast.success("Answer submitted!");
    } catch (error) {
      toast.error("Failed to submit answer");
    }
  }, [userId]);

  // Setup socket listeners
  useEffect(() => {
    if (!roomCode) return;

    // Room data listeners
    socket.on("room-data", (room: RoomDetails) => {
      setRoomDetails(room);
    });

    socket.on("room-updated", (room: RoomDetails) => {
      setRoomDetails(room);
    });

    // Poll listeners
    socket.on("new-poll", (poll: Poll) => {
      setLivePolls(prev => [...prev, poll]);
      toast("New poll received!");
    });

    socket.on("poll-ended", (data: { pollId: string }) => {
      toast.info("Poll has ended");
      setLivePolls(prev => prev.filter(p => p._id !== data.pollId));
      setPollTimers(prev => {
        const updated = { ...prev };
        delete updated[data.pollId];
        return updated;
      });
    });

    socket.on("room-ended", () => {
      toast.error("Room has been ended by the teacher");
      leaveRoom();
    });

    socket.on('live-poll-results', (data: { pollId: string; responses: Record<string, number> }) => {
      // Handle live poll results if needed
      console.log('Live poll results:', data);
    });

    // Poll timer
    const timerInterval = setInterval(() => {
      setPollTimers(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(pollId => {
          if (updated[pollId] > 0) {
            updated[pollId]--;
          }
        });
        return updated;
      });
    }, 1000);

    return () => {
      socket.off("room-data");
      socket.off("room-updated");
      socket.off('new-poll');
      socket.off('room-ended');
      socket.off('poll-ended');
      socket.off('live-poll-results');
      clearInterval(timerInterval);
    };
  }, [roomCode, leaveRoom]);

  // Initialize poll timers when new polls arrive
  useEffect(() => {
    livePolls.forEach(poll => {
      if (pollTimers[poll._id] === undefined && poll.timer) {
        setPollTimers(prev => ({
          ...prev,
          [poll._id]: poll.timer
        }));
      }
    });
  }, [livePolls, pollTimers]);

  return {
    joinedRoom,
    livePolls,
    roomDetails,
    allRoomPolls,
    answeredPolls,
    pollTimers,
    selectedOptions,
    setSelectedOptions,
    setAllRoomPolls,
    joinRoom,
    leaveRoom,
    submitAnswer,
  };
};
