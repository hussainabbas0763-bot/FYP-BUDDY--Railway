import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

const SocketContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const SOCKET_BASE_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL;

export const SocketProvider = ({ children }) => {
  const { user } = useSelector((store) => store.auth);
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    // Only create socket if user is authenticated
    if (!user?._id || !SOCKET_BASE_URL) {
      if (socketRef.current) {
        console.log('[GLOBAL SOCKET] Disconnecting - user logged out');
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Don't create a new socket if one already exists
    if (socketRef.current?.connected) {
      console.log('[GLOBAL SOCKET] Socket already connected');
      return;
    }

    console.log('[GLOBAL SOCKET] Creating new socket connection');
    const socket = io(SOCKET_BASE_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("[GLOBAL SOCKET] Connected");
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on("disconnect", (reason) => {
      console.log("[GLOBAL SOCKET] Disconnected:", reason);
      setIsConnected(false);
      if (reason === "io server disconnect") {
        socket.connect();
      }
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("[GLOBAL SOCKET] Reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on("reconnect_error", (error) => {
      console.error("[GLOBAL SOCKET] Reconnection error:", error);
      setConnectionError("Reconnecting...");
    });

    socket.on("reconnect_failed", () => {
      console.error("[GLOBAL SOCKET] Reconnection failed");
      setConnectionError("Unable to reconnect. Please refresh the page.");
    });

    socket.on("connect_error", (error) => {
      console.error("[GLOBAL SOCKET] Connection error:", error);
      setConnectionError(error.message || "Unable to connect");
      setIsConnected(false);
    });

    socketRef.current = socket;

    // Cleanup only on unmount or user logout
    return () => {
      console.log('[GLOBAL SOCKET] Cleaning up socket connection');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [user?._id]); // Only recreate if user changes (login/logout)

  const value = {
    socket: socketRef.current,
    isConnected,
    connectionError,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
