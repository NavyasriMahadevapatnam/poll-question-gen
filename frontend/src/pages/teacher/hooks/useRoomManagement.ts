import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import socket from '@/lib/api/socket';
import api from '@/lib/api/api';

interface UseRoomManagementProps {
  roomCode: string;
  userEmail: string | null | undefined;
}

export const useRoomManagement = ({ roomCode, userEmail }: UseRoomManagementProps) => {
  const navigate = useNavigate();
  
  const [students, setStudents] = useState<Array<{ id?: string; name?: string }>>([]);
  const [isEndingRoom, setIsEndingRoom] = useState(false);
  const [showEndRoomConfirm, setShowEndRoomConfirm] = useState(false);

  // Join room on mount
  useEffect(() => {
    if (!roomCode) return;

    socket.emit("join-room", roomCode, userEmail);

    socket.on("room-data", (room) => {
      if (room.students) {
        setStudents(room.students);
      }
    });

    socket.on("room-updated", (room) => {
      if (room.students) {
        setStudents(room.students);
      }
    });

    return () => {
      socket.off("room-data");
      socket.off("room-updated");
      socket.emit("leave-room", roomCode, userEmail);
    };
  }, [roomCode, userEmail]);

  const endRoom = useCallback(async () => {
    try {
      setIsEndingRoom(true);
      await api.post(`/livequizzes/rooms/${roomCode}/end`);
      
      socket.emit("leave-room", roomCode, userEmail);
      
      toast.success("Room ended successfully!");
      navigate({ to: "/teacher/manage-rooms" });
    } catch (error) {
      toast.error("Failed to end room");
    } finally {
      setIsEndingRoom(false);
      setShowEndRoomConfirm(false);
    }
  }, [roomCode, userEmail, navigate]);

  const exitRoom = useCallback(() => {
    socket.emit("leave-room", roomCode, userEmail);
    navigate({ to: "/teacher/manage-rooms" });
  }, [roomCode, userEmail, navigate]);

  return {
    // State
    students,
    setStudents,
    isEndingRoom,
    setIsEndingRoom,
    showEndRoomConfirm,
    setShowEndRoomConfirm,
    
    // Actions
    endRoom,
    exitRoom,
  };
};
