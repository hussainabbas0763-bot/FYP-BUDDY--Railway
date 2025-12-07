import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SEO from "@/components/SEO";
import {
  Send,
  Users,
  User,
  Crown,
  MessageCircle,
  Menu,
  X,
  Globe,
  MessageSquare,
  Video,
  Phone,
  Loader2,
  Plus,
  Image,
  FileText,
  UserPlus,
  Download,
  Eye,
  Trash2,
  MoreVertical,
  Mic,
  MicOff,
  VideoOff,
} from "lucide-react";
import axios from "axios";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import userImg from "@/assets/user.jpg";
import { encryptMessage, decryptMessage } from "@/utils/encryption";
import {
  ChatHeader,
  ChatMessage,
  ChatInput,
  ChatSidebar,
  VideoCallDialog,
  IncomingCallDialog,
  MinimizedCallPopup,
} from "@/components/TeamChatComponents";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const SOCKET_BASE_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL;

export default function TeamChat() {
  const { user } = useSelector((store) => store.auth);
  const { group } = useSelector((store) => store.group);

  const [chats, setChats] = useState([]);
  const [chatMessages, setChatMessages] = useState({});
  const [activeChatId, setActiveChatId] = useState(null);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState({});
  const [olderLoading, setOlderLoading] = useState({});
  const [connectionError, setConnectionError] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [isChatsOpen, setIsChatsOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0, messageId: null, imageUrl: null });
  const [deleteMenuOpen, setDeleteMenuOpen] = useState({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const isUserAtBottomRef = useRef(true);
  const inputRef = useRef(null);
  const readTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const chatsRef = useRef([]);
  const activeChatIdRef = useRef(null);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const localVideoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const localStreamRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);
  const cameraStreamRef = useRef(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const peerConnectionsRef = useRef({});
  const pendingCandidatesRef = useRef({});
  const acceptedParticipantsRef = useRef(new Set());
  const acceptedRoomsRef = useRef(new Set());
  const isCallInitiatorRef = useRef(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const isScreenSharingRef = useRef(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callTargets, setCallTargets] = useState([]);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const firstRemoteEntry = useMemo(() => Object.entries(remoteStreams)[0] || null, [remoteStreams]);
  const remoteVideoRef = useRef(null);
  const [maximizedPeerId, setMaximizedPeerId] = useState(null);
  const micEnabledRef = useRef(true);
  const cameraEnabledRef = useRef(true);
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const callTimerRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const callNotificationIdRef = useRef(null);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) || null,
    [chats, activeChatId]
  );
  const activeMessages = Array.isArray(chatMessages[activeChatId])
    ? chatMessages[activeChatId]
    : [];
  const isActiveChatLoading = !!messagesLoading[activeChatId];
  const canSendMessage = Boolean(activeChatId) && !roomsLoading && !connectionError;

  const reorderRoomsWithSaved = useCallback((rooms) => {
    try {
      const key = `chat_order_student_${user?._id || 'anon'}`;
      const saved = localStorage.getItem(key);
      if (!saved) {
        // If no saved order, sort by unread count (unread chats first)
        return [...rooms].sort((a, b) => {
          const aUnread = a.unreadCount || 0;
          const bUnread = b.unreadCount || 0;
          if (aUnread > 0 && bUnread === 0) return -1;
          if (aUnread === 0 && bUnread > 0) return 1;
          return 0;
        });
      }
      const orderIds = JSON.parse(saved);
      if (!Array.isArray(orderIds) || !orderIds.length) {
        // If saved order is invalid, sort by unread count
        return [...rooms].sort((a, b) => {
          const aUnread = a.unreadCount || 0;
          const bUnread = b.unreadCount || 0;
          if (aUnread > 0 && bUnread === 0) return -1;
          if (aUnread === 0 && bUnread > 0) return 1;
          return 0;
        });
      }
      const indexMap = new Map(orderIds.map((id, i) => [String(id), i]));
      // Sort by saved order, but prioritize chats with unread messages
      return [...rooms].sort((a, b) => {
        const aUnread = a.unreadCount || 0;
        const bUnread = b.unreadCount || 0;
        
        // If both have unread or both don't have unread, use saved order
        if ((aUnread > 0 && bUnread > 0) || (aUnread === 0 && bUnread === 0)) {
          const ai = indexMap.has(String(a.id)) ? indexMap.get(String(a.id)) : Number.MAX_SAFE_INTEGER;
          const bi = indexMap.has(String(b.id)) ? indexMap.get(String(b.id)) : Number.MAX_SAFE_INTEGER;
          return ai - bi;
        }
        
        // Prioritize unread chats
        if (aUnread > 0 && bUnread === 0) return -1;
        if (aUnread === 0 && bUnread > 0) return 1;
        return 0;
      });
    } catch {
      return rooms;
    }
  }, [user?._id]);

  const saveChatOrder = useCallback((rooms) => {
    try {
      const key = `chat_order_student_${user?._id || 'anon'}`;
      localStorage.setItem(key, JSON.stringify(rooms.map((r) => r.id)));
    } catch { }
  }, [user?._id]);

  useEffect(() => {
    if (!isVideoCallOpen) return;
    const updateVideo = () => {
      if (!localVideoRef.current) return;
      const streamToShow = isScreenSharing ? localStream : (cameraStream || localStream);
      if (streamToShow) {
        try {
          if (localVideoRef.current.srcObject !== streamToShow) {
            localVideoRef.current.srcObject = streamToShow;
          }
          const p = localVideoRef.current.play();
          if (p && typeof p.then === "function") {
            p.catch((err) => {
              console.error("Error playing video:", err);
              setTimeout(updateVideo, 100);
            });
          }
        } catch (err) {
          console.error("Error setting video stream:", err);
          setTimeout(updateVideo, 100);
        }
      }
    };
    const timeoutId = setTimeout(updateVideo, 50);
    return () => clearTimeout(timeoutId);
  }, [isVideoCallOpen, localStream, cameraStream, isScreenSharing]);

  useEffect(() => {
    if (!isVideoCallOpen) return;
    const stream = firstRemoteEntry ? firstRemoteEntry[1] : null;
    if (remoteVideoRef.current && stream) {
      try {
        if (remoteVideoRef.current.srcObject !== stream) {
          remoteVideoRef.current.srcObject = stream;
        }
        const p = remoteVideoRef.current.play();
        if (p && typeof p.then === "function") { p.catch(() => undefined); }
      } catch { void 0; }
    }
  }, [isVideoCallOpen, firstRemoteEntry]);

  useEffect(() => {
    if (!isVideoCallOpen) return;
    const el = localVideoRef.current;
    const streamToShow = isScreenSharing ? localStream : (cameraStream || localStream);
    if (el && streamToShow) {
      try {
        if (el.srcObject !== streamToShow) {
          el.srcObject = streamToShow;
        }
        const p = el.play();
        if (p && typeof p.then === "function") { p.catch(() => undefined); }
      } catch { void 0; }
    } else if (el && !streamToShow) {
      try {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((s) => {
          setLocalStream((prev) => prev || s);
          localStreamRef.current = localStreamRef.current || s;
          setCameraStream((prev) => prev || s);
          cameraStreamRef.current = cameraStreamRef.current || s;
          try {
            if (el.srcObject !== s) { el.srcObject = s; }
            const p = el.play();
            if (p && typeof p.then === "function") { p.catch(() => undefined); }
          } catch { void 0; }
        }).catch(() => undefined);
      } catch { void 0; }
    }
  }, [isVideoCallOpen, localStream, cameraStream, isScreenSharing, isConnecting, remoteStreams]);

  // Call timer effect - Start timer only when first participant connects
  useEffect(() => {
    const hasRemoteStreams = Object.keys(remoteStreams).length > 0;
    
    if (isVideoCallOpen && hasRemoteStreams && !callTimerRef.current) {
      // Start timer when first participant connects
      console.log('[CALL TIMER] Starting timer - first participant connected');
      callStartTimeRef.current = Date.now();
      setCallDuration(0);
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else if (!isVideoCallOpen && callTimerRef.current) {
      // Stop timer when call ends
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
      callStartTimeRef.current = null;
      setCallDuration(0);
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    };
  }, [isVideoCallOpen, remoteStreams]);

  useEffect(() => {
    if (!isVideoCallOpen) return;
    const bindLater = () => {
      const el = localVideoRef.current;
      const s = isScreenSharing ? localStream : (cameraStream || localStream);
      if (el && s) {
        try {
          if (el.srcObject !== s) { el.srcObject = s; }
          const p = el.play();
          if (p && typeof p.then === "function") { p.catch(() => undefined); }
        } catch { void 0; }
      }
    };
    const id = setTimeout(bindLater, 150);
    return () => clearTimeout(id);
  }, [isConnecting]);
  useEffect(() => {
    if (!user?._id || !API_BASE_URL) return;
    let ignore = false;

    const fetchRooms = async () => {
      setRoomsLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setRoomsLoading(false);
          return;
        }
        const res = await axios.get(`${API_BASE_URL}/chat/rooms`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (ignore) return;
        const fetchedRooms = res.data?.rooms || [];
        const orderedRooms = reorderRoomsWithSaved(fetchedRooms);
        setChats(orderedRooms);
        saveChatOrder(orderedRooms);
        const onlineSet = new Set();
        const counts = {};
        fetchedRooms.forEach((room) => {
          counts[room.id] = room.unreadCount || 0;
          room.participants?.forEach((p) => {
            if (p.isOnline) {
              onlineSet.add(p.id);
            }
          });
        });
        setUnreadCounts(counts);
        setOnlineUsers(onlineSet);
        setChatMessages((prev) => {
          const next = { ...prev };
          let updated = false;
          fetchedRooms.forEach((room) => {
            if (!next[room.id]) {
              next[room.id] = [];
              updated = true;
            }
          });
          Object.keys(next).forEach((roomId) => {
            if (!fetchedRooms.some((room) => room.id === roomId)) {
              delete next[roomId];
              updated = true;
            }
          });
          return updated ? next : prev;
        });
        try {
          const openRoomKey = sessionStorage.getItem("openRoomKey");
          if (openRoomKey) {
            const exists = orderedRooms.find((r) => String(r.id) === String(openRoomKey));
            if (exists) { setActiveChatId(exists.id); }
            sessionStorage.removeItem("openRoomKey");
          }
        } catch { }
      } catch (error) {
        if (!ignore) {
          toast.error(
            error.response?.data?.message ||
            error.message ||
            "Unable to load chats"
          );
        }
      } finally {
        if (!ignore) {
          setRoomsLoading(false);
        }
      }
    };

    fetchRooms();

    return () => {
      ignore = true;
    };
  }, [user?._id, group?.groupName]);

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    micEnabledRef.current = micEnabled;
  }, [micEnabled]);

  useEffect(() => {
    cameraEnabledRef.current = cameraEnabled;
  }, [cameraEnabled]);

  useEffect(() => {
    if (!chats.length) {
      setActiveChatId(null);
      return;
    }

    if (activeChatId && chats.some((chat) => chat.id === activeChatId)) {
      return;
    }

    // Don't automatically open any chat on page load
    // User can manually select a chat from the sidebar
  }, [chats, activeChatId]);

  useEffect(() => {
    if (!user?._id || !SOCKET_BASE_URL) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const socket = io(SOCKET_BASE_URL, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
      setConnectionError(`Connection failed: ${err.message}`);
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected");
      setConnectionError(null);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        socket.connect();
      }
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("Socket reconnected after", attemptNumber, "attempts");
      setConnectionError(null);
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log("Reconnection attempt", attemptNumber);
    });

    socket.on("reconnect_error", (error) => {
      console.error("Reconnection error:", error);
      setConnectionError("Reconnecting...");
    });

    socket.on("reconnect_failed", () => {
      console.error("Reconnection failed");
      setConnectionError("Unable to reconnect. Please refresh the page.");
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setConnectionError(error.message || "Unable to connect to chat");
    });

    socket.on("chat:new-message", async (message) => {
      try {
        if (!message || !message.roomKey) {
          console.error("Invalid message received:", message);
          return;
        }

        // Get participants for decryption from current chats using ref
        const currentChats = chatsRef.current;
        const chat = currentChats.find((c) => c.id === message.roomKey);
        const participants = chat?.participants || [];
        const participantIds = participants.map((p) => String(p.id || p._id || p)).filter(Boolean);

        // Decrypt the message
        let decryptedMessage;
        try {
          decryptedMessage = await decryptMessage(
            message,
            message.roomKey,
            user?._id,
            participantIds
          );
        } catch (decryptError) {
          console.error("Error decrypting message:", decryptError);
          decryptedMessage = message;
        }

        setChatMessages((prev) => {
          const existingMessages = prev[decryptedMessage.roomKey] || [];
          // Check if message already exists to prevent duplicates
          const messageExists = existingMessages.some(
            (m) => m.id === decryptedMessage.id ||
              (m.timestamp === decryptedMessage.timestamp && m.sender?.id === decryptedMessage.sender?.id)
          );

          if (messageExists) {
            return prev;
          }

          return {
            ...prev,
            [decryptedMessage.roomKey]: [...existingMessages, decryptedMessage],
          };
        });

        const currentActiveChatId = activeChatIdRef.current;
        if (decryptedMessage.sender.id !== user?._id) {
          // Mark message as delivered since user is online and received it
          markMessagesAsDelivered(decryptedMessage.roomKey, [decryptedMessage.id]);
          
          // If chat is active, also mark as read
          if (decryptedMessage.roomKey === currentActiveChatId) {
            markMessagesAsRead(decryptedMessage.roomKey, [decryptedMessage.id]);
          } else {
            // If chat is not active, increment unread count
            setUnreadCounts((prev) => ({
              ...prev,
              [decryptedMessage.roomKey]: (prev[decryptedMessage.roomKey] || 0) + 1,
            }));
          }
        }

        setChats((prevChats) => {
          const index = prevChats.findIndex((c) => c.id === decryptedMessage.roomKey);
          if (index <= 0) return prevChats;
          const moved = prevChats[index];
          const rest = [...prevChats.slice(0, index), ...prevChats.slice(index + 1)];
          const next = [moved, ...rest];
          try { saveChatOrder(next); } catch { }
          return next;
        });
      } catch (error) {
        console.error("Error processing new message:", error);
        // Still add message even if processing fails (for backward compatibility)
        if (message && message.roomKey) {
          setChatMessages((prev) => {
            const existingMessages = prev[message.roomKey] || [];
            const messageExists = existingMessages.some(
              (m) => m.id === message.id
            );
            if (messageExists) {
              return prev;
            }
            return {
              ...prev,
              [message.roomKey]: [...existingMessages, message],
            };
          });

          setChats((prevChats) => {
            const index = prevChats.findIndex((c) => c.id === message.roomKey);
            if (index <= 0) return prevChats;
            const moved = prevChats[index];
            const rest = [...prevChats.slice(0, index), ...prevChats.slice(index + 1)];
            const next = [moved, ...rest];
            try { saveChatOrder(next); } catch { }
            return next;
          });
        }
      }
    });

    socket.on("chat:rooms", (serverRooms) => {
      if (!serverRooms || !Array.isArray(serverRooms)) return;

      const orderedRooms = reorderRoomsWithSaved(serverRooms);
      setChats(orderedRooms);
      saveChatOrder(orderedRooms);
      setRoomsLoading(false);
      const counts = {};
      const onlineSet = new Set();

      serverRooms.forEach((room) => {
        counts[room.id] = room.unreadCount || 0;
        setChatMessages((prev) => {
          if (!prev[room.id]) {
            return {
              ...prev,
              [room.id]: [],
            };
          }
          return prev;
        });
        room.participants?.forEach((p) => {
          const participantId = String(p.id || p._id || p);
          if (p.isOnline) {
            onlineSet.add(participantId);
          }
        });
      });
      setUnreadCounts(counts);
      setOnlineUsers(onlineSet);

      try {
        const openRoomKey = sessionStorage.getItem("openRoomKey");
        if (openRoomKey) {
          const exists = orderedRooms.find((r) => String(r.id) === String(openRoomKey));
          if (exists) { setActiveChatId(exists.id); }
          sessionStorage.removeItem("openRoomKey");
        }
        const incomingRaw = sessionStorage.getItem("incomingCall");
        if (incomingRaw) {
          const payload = JSON.parse(incomingRaw);
          if (payload?.roomKey) {
            const chat = orderedRooms.find((c) => String(c.id) === String(payload.roomKey)) || null;
            setIncomingCall({ from: payload.from, roomKey: payload.roomKey, chat, peers: payload.peers, isAudioOnly: payload.isAudioOnly });
          }
          sessionStorage.removeItem("incomingCall");
        }
      } catch { }
    });

    socket.on("rtc:ring", (payload) => {
      const { from, roomKey, peers, isAudioOnly } = payload || {};
      if (!from || !roomKey) return;

      // Block incoming call if user is already in a call from the same room
      const isAlreadyInSameRoom = isVideoCallOpen && String(activeChatIdRef.current) === String(roomKey);
      if (isAlreadyInSameRoom) {
        console.log(`[RTC:RING] Ignoring incoming call - already in call from same room (${roomKey})`);
        return;
      }

      const chatsList = chatsRef.current || [];
      const chat = chatsList.find((c) => String(c.id) === String(roomKey)) || null;
      setIncomingCall({ from, roomKey, chat, peers, isAudioOnly });
    });

    socket.on("rtc:ring:accept", async (payload) => {
      const { from, roomKey, peers, isAccepter } = payload || {};
      if (!from || !roomKey) return;
      if (!activeChatIdRef.current || String(roomKey) !== String(activeChatIdRef.current)) return;

      // Check if we're already in this call
      const isAlreadyInCall = isVideoCallOpen && acceptedRoomsRef.current.has(String(roomKey));

      // CRITICAL: Only process if we're the accepter OR we initiated the call and are already in it
      // This prevents auto-acceptance - users who haven't accepted should not process this event
      if (!isAccepter && !isAlreadyInCall) {
        console.log(`[RTC:RING:ACCEPT] Ignoring accept event - not accepter and not in call`);
        return;
      }

      if (isAccepter) {
        isCallInitiatorRef.current = false;
        // We're the new member joining - connect to everyone
        console.log(`[RTC:RING:ACCEPT] We are accepting the call from ${from}`);

        // Add the person who accepted our ring (caller/host)
        const fromStr = String(from);
        setCallTargets((prev) => (prev.includes(fromStr) ? prev : [...prev, fromStr]));
        acceptedParticipantsRef.current.add(fromStr);

        // Add all other participants currently in the call
        if (Array.isArray(peers) && peers.length > 0) {
          console.log(`[RTC:RING:ACCEPT] Adding ${peers.length} existing participants to call`);
          peers.forEach((peerId) => {
            const peerIdStr = String(peerId);
            if (peerIdStr !== String(user?._id) && peerIdStr !== fromStr) {
              setCallTargets((prev) => (prev.includes(peerIdStr) ? prev : [...prev, peerIdStr]));
              acceptedParticipantsRef.current.add(peerIdStr);
            }
          });
        }

        setIsConnecting(true);

        // Establish connection with the caller/host
        await createConnectionAndOffer(fromStr);

        // Establish connections with all other participants
        if (Array.isArray(peers) && peers.length > 0) {
          for (const peerId of peers) {
            const peerIdStr = String(peerId);
            if (peerIdStr !== String(user?._id) && peerIdStr !== fromStr) {
              await createConnectionAndOffer(peerIdStr);
            }
          }
        }
      } else if (isAlreadyInCall) {
        // We're already in the call - a new member just joined
        // Only connect to the new member who just joined (from)
        console.log(`[RTC:RING:ACCEPT] New participant ${from} joined our call`);
        const fromStr = String(from);
        if (fromStr !== String(user?._id) && !peerConnectionsRef.current[fromStr]) {
          setCallTargets((prev) => (prev.includes(fromStr) ? prev : [...prev, fromStr]));
          acceptedParticipantsRef.current.add(fromStr);
          setIsConnecting(true);
          await createConnectionAndOffer(fromStr);
        }
      }
    });

    socket.on("rtc:ring:decline", (payload) => {
      const { from, roomKey } = payload || {};
      if (!from || !roomKey) return;
      if (!activeChatIdRef.current || String(roomKey) !== String(activeChatIdRef.current)) return;
      setCallTargets((prev) => prev.filter((id) => id !== from));
      toast.error("Call declined");
      // Send missed call notification from the caller's perspective
      const messageType = isAudioOnly ? "audio_call" : "video_call";
      sendCallNotification(messageType, 0, "missed");
    });

    socket.on("rtc:offer", async (payload) => {
      try {
        const { from, roomKey, offer } = payload || {};
        if (!from || !roomKey) return;
        if (!activeChatIdRef.current || String(roomKey) !== String(activeChatIdRef.current)) return;
        if (!acceptedRoomsRef.current.has(String(roomKey))) return;

        // If we receive an offer, it means this participant has joined - add them if not already added
        const fromStr = String(from);
        if (fromStr !== String(user?._id)) {
          if (!acceptedParticipantsRef.current.has(fromStr)) {
            console.log(`[RTC:OFFER] Adding participant ${fromStr} to accepted list`);
            acceptedParticipantsRef.current.add(fromStr);
            setCallTargets((prev) => (prev.includes(fromStr) ? prev : [...prev, fromStr]));
          }
        }

        let pc = peerConnectionsRef.current[from];
        if (!pc) {
          pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
          peerConnectionsRef.current[from] = pc;

          // Ensure we have a valid stream with tracks - USE REFS to get current stream
          let ensuredStream = localStreamRef.current || cameraStreamRef.current;
          if (!ensuredStream) {
            console.log(`[RTC:OFFER] No local stream available, acquiring media...`);
            ensuredStream = await navigator.mediaDevices.getUserMedia({ video: !isAudioOnly, audio: true });
            setLocalStream(ensuredStream);
            localStreamRef.current = ensuredStream;
            setCameraStream(ensuredStream);
            cameraStreamRef.current = ensuredStream;

            // Attach to local video element
            setTimeout(() => {
              if (localVideoRef.current && ensuredStream) {
                try {
                  localVideoRef.current.srcObject = ensuredStream;
                  const p = localVideoRef.current.play();
                  if (p && typeof p.then === "function") {
                    p.catch((err) => {
                      console.error("Error playing video in offer handler:", err);
                      setTimeout(() => {
                        if (localVideoRef.current && ensuredStream) {
                          try {
                            localVideoRef.current.srcObject = ensuredStream;
                            localVideoRef.current.play().catch(() => { });
                          } catch { }
                        }
                      }, 200);
                    });
                  }
                } catch (err) {
                  console.error("Error setting video in offer handler:", err);
                }
              }
            }, 100);
          }

          // Verify stream has tracks before adding
          const tracks = ensuredStream.getTracks();
          if (tracks.length === 0) {
            console.error(`[RTC:OFFER] Stream has no tracks, cannot proceed`);
            return;
          }

          const videoTrack = tracks.find(t => t.kind === 'video');
          const isScreenShareStream = videoTrack && (
            videoTrack.label.toLowerCase().includes('screen') || 
            videoTrack.label.toLowerCase().includes('window') ||
            videoTrack.label.toLowerCase().includes('monitor')
          );
          
          console.log(`[RTC:OFFER] Adding ${tracks.length} tracks to peer connection for ${from} (isScreenSharing: ${isScreenSharingRef.current}, detected: ${isScreenShareStream})`);
          tracks.forEach ((t) => {
            if (pc.getSenders().find(s => s.track === t)) {
              console.log(`[RTC:OFFER] Track ${t.kind} already added, skipping`);
              return;
            }
            if (t.kind === "audio") { t.enabled = micEnabledRef.current; }
            if (t.kind === "video") { t.enabled = cameraEnabledRef.current; }
            console.log(`[RTC:OFFER] Adding ${t.kind} track (label: ${t.label})`);
            pc.addTrack(t, ensuredStream);
          });

          pc.ontrack = (event) => {
            const stream = event.streams?.[0];
            if (!stream) return;

            console.log(`[RTC:OFFER] Received remote stream from ${from} with ${stream.getTracks().length} tracks`);

            // Only add to remoteStreams if this participant has accepted the call
            if (acceptedParticipantsRef.current.has(String(from))) {
              setRemoteStreams((prev) => {
                const next = { ...prev };
                next[from] = stream;
                console.log(`[RTC:OFFER] Updated remoteStreams, now have ${Object.keys(next).length} remote streams`);
                return next;
              });
            }

            event.streams?.forEach((s) => {
              s.getTracks().forEach((track) => {
                track.onended = () => {
                  setRemoteStreams((prev) => {
                    const next = { ...prev };
                    if (next[from]) {
                      const updatedStream = new MediaStream(next[from].getTracks().filter(t => t !== track));
                      if (updatedStream.getTracks().length > 0) {
                        next[from] = updatedStream;
                      } else {
                        delete next[from];
                      }
                    }
                    return next;
                  });
                };
              });
            });
          };

          pc.oniceconnectionstatechange = () => {
            const s = pc.iceConnectionState;
            console.log(`[RTC:OFFER] ICE connection state for ${from}: ${s}`);
            if (s === "connected" || s === "completed") { setIsConnecting(false); }
          };

          pc.onicecandidate = (e) => {
            if (e.candidate && socketRef.current?.connected) {
              socketRef.current.emit("rtc:candidate", { to: from, roomKey, candidate: e.candidate });
            }
          };
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const queued = pendingCandidatesRef.current[from] || [];
        if (queued.length) {
          console.log(`[RTC:OFFER] Processing ${queued.length} queued ICE candidates for ${from}`);
          for (const c of queued) {
            try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch { }
          }
          pendingCandidatesRef.current[from] = [];
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (socketRef.current?.connected) {
          socketRef.current.emit("rtc:answer", { to: from, roomKey, answer });
        }
        setIsVideoCallOpen(true);
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    });

    socket.on("rtc:answer", async (payload) => {
      try {
        const { from, roomKey, answer } = payload || {};
        if (!from || !roomKey) return;
        if (!activeChatIdRef.current || String(roomKey) !== String(activeChatIdRef.current)) return;
        const pc = peerConnectionsRef.current[from];
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        const queued = pendingCandidatesRef.current[from] || [];
        if (queued.length) {
          for (const c of queued) {
            try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch { }
          }
          pendingCandidatesRef.current[from] = [];
        }
      } catch { }
    });

    socket.on("rtc:candidate", async (payload) => {
      try {
        const { from, roomKey, candidate } = payload || {};
        if (!from || !roomKey) return;
        if (!activeChatIdRef.current || String(roomKey) !== String(activeChatIdRef.current)) return;
        if (!candidate) return;
        const pc = peerConnectionsRef.current[from];
        if (pc && pc.remoteDescription) {
          try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch { }
        } else {
          const q = pendingCandidatesRef.current[from] || [];
          pendingCandidatesRef.current[from] = [...q, candidate];
        }
      } catch { }
    });

    socket.on("rtc:end", (payload) => {
      const { from, roomKey } = payload || {};
      if (!from || !roomKey) return;
      if (!activeChatIdRef.current || String(roomKey) !== String(activeChatIdRef.current)) return;
      const pc = peerConnectionsRef.current[from];
      if (pc) {
        pc.close();
        delete peerConnectionsRef.current[from];
      }
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[from];
        return next;
      });
    });

    socket.on("rtc:screen-share-update", (payload) => {
      const { roomKey, userId, isSharing } = payload || {};
      if (!roomKey || !userId) return;
      if (!activeChatIdRef.current || String(roomKey) !== String(activeChatIdRef.current)) return;
      
      console.log(`[RTC:SCREEN-SHARE-UPDATE] User ${userId} ${isSharing ? 'started' : 'stopped'} screen sharing`);
      
      // The screen share state is automatically detected by the VideoCallDialog component
      // through the isRemoteScreenShare function, so we don't need to do anything here
      // This event is mainly for logging and potential future enhancements
    });

    socket.on("chat:user-status", (data) => {
      if (!data || !data.userId) return;
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (data.isOnline) {
          next.add(String(data.userId));
        } else {
          next.delete(String(data.userId));
        }
        return next;
      });

      // Also update online status in chats
      setChats((prevChats) => {
        return prevChats.map((chat) => {
          if (chat.participants) {
            const updatedParticipants = chat.participants.map((p) => {
              if (String(p.id || p._id || p) === String(data.userId)) {
                return { ...p, isOnline: data.isOnline };
              }
              return p;
            });
            return { ...chat, participants: updatedParticipants };
          }
          return chat;
        });
      });
    });

    socket.on("chat:messages-read", (data) => {
      setChatMessages((prev) => {
        const next = { ...prev };
        if (next[data.roomKey]) {
          next[data.roomKey] = next[data.roomKey].map((msg) => {
            if (data.messageIds.includes(msg.id) && !msg.readBy?.includes(data.userId)) {
              return {
                ...msg,
                readBy: [...(msg.readBy || []), data.userId],
              };
            }
            return msg;
          });
        }
        return next;
      });
    });

    socket.on("chat:message-delivered", (data) => {
      setChatMessages((prev) => {
        const next = { ...prev };
        if (next[data.roomKey]) {
          next[data.roomKey] = next[data.roomKey].map((msg) => {
            if (data.messageId && msg.id === data.messageId) {
              // Single message delivery
              const newDeliveredTo = [...(msg.deliveredTo || [])];
              data.deliveredTo.forEach(userId => {
                if (!newDeliveredTo.includes(userId)) {
                  newDeliveredTo.push(userId);
                }
              });
              return {
                ...msg,
                deliveredTo: newDeliveredTo,
              };
            } else if (data.messageIds && data.messageIds.includes(msg.id)) {
              // Multiple messages delivery
              const newDeliveredTo = [...(msg.deliveredTo || [])];
              data.deliveredTo.forEach(userId => {
                if (!newDeliveredTo.includes(userId)) {
                  newDeliveredTo.push(userId);
                }
              });
              return {
                ...msg,
                deliveredTo: newDeliveredTo,
              };
            }
            return msg;
          });
        }
        return next;
      });
    });

    socket.on("chat:message-deleted", async (data) => {
      setChatMessages((prev) => {
        const next = { ...prev };
        if (next[data.roomKey]) {
          if (data.deleteForEveryone) {
            next[data.roomKey] = next[data.roomKey].map((msg) => {
              if (msg.id === data.messageId) {
                return {
                  ...msg,
                  isDeleted: true,
                  text: "This message was deleted",
                  attachments: [],
                  contactData: null,
                };
              }
              return msg;
            });
          } else {
            next[data.roomKey] = next[data.roomKey].filter(
              (msg) => msg.id !== data.messageId
            );
          }
        }
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user?._id]);

  const markMessagesAsDelivered = useCallback(
    (roomKey, messageIds) => {
      if (!socketRef.current?.connected || !messageIds?.length) return;

      socketRef.current.emit(
        "chat:mark-delivered",
        { roomKey, messageIds },
        (response) => {
          if (!response?.success) {
            console.error("Failed to mark messages as delivered");
          }
        }
      );
    },
    []
  );

  const markMessagesAsRead = useCallback(
    (roomKey, messageIds) => {
      if (!socketRef.current?.connected || !messageIds?.length) return;

      socketRef.current.emit(
        "chat:mark-read",
        { roomKey, messageIds },
        (response) => {
          if (response?.success) {
            setUnreadCounts((prev) => {
              const current = prev[roomKey] || 0;
              const newCount = Math.max(0, current - messageIds.length);
              return { ...prev, [roomKey]: newCount };
            });
          }
        }
      );
    },
    []
  );

  const fetchMessages = useCallback(
    async (roomId) => {
      if (!roomId || !API_BASE_URL) return;
      if (messagesLoading[roomId]) return;
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      setMessagesLoading((prev) => ({ ...prev, [roomId]: true }));
      try {
        const res = await axios.get(
          `${API_BASE_URL}/chat/rooms/${roomId}/messages`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Get participants for decryption
        const chat = chats.find((c) => c.id === roomId);
        const participants = chat?.participants || [];
        const participantIds = participants.map((p) => p.id || p._id || p).filter(Boolean);

        // Decrypt all messages
        const decryptedMessages = await Promise.all(
          (res.data?.messages || []).map((message) =>
            decryptMessage(message, roomId, user?._id, participantIds)
          )
        );

        setChatMessages((prev) => ({
          ...prev,
          [roomId]: decryptedMessages,
        }));
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
          error.message ||
          "Unable to load messages"
        );
      } finally {
        setMessagesLoading((prev) => ({ ...prev, [roomId]: false }));
      }
    },
    [messagesLoading, chats, user?._id]
  );

  useEffect(() => {
    if (!activeChatId) return;
    if (chatMessages[activeChatId]?.length) {
      const unreadMessages = chatMessages[activeChatId].filter(
        (msg) => msg.sender.id !== user?._id && !msg.readBy?.includes(user?._id)
      );
      if (unreadMessages.length > 0) {
        markMessagesAsRead(activeChatId, unreadMessages.map((m) => m.id));
      }
    } else {
      fetchMessages(activeChatId);
    }
  }, [activeChatId, chatMessages, fetchMessages, user?._id, markMessagesAsRead]);

  useEffect(() => {
    if (activeChatId && chatMessages[activeChatId]?.length) {
      if (readTimeoutRef.current) {
        clearTimeout(readTimeoutRef.current);
      }
      readTimeoutRef.current = setTimeout(() => {
        const unreadMessages = chatMessages[activeChatId].filter(
          (msg) => msg.sender.id !== user?._id && !msg.readBy?.includes(user?._id)
        );
        if (unreadMessages.length > 0) {
          markMessagesAsRead(
            activeChatId,
            unreadMessages.map((m) => m.id)
          );
        }
      }, 1000);
    }
    return () => {
      if (readTimeoutRef.current) {
        clearTimeout(readTimeoutRef.current);
      }
    };
  }, [activeChatId, chatMessages, user?._id, markMessagesAsRead]);

  const saveScrollPosition = () => {
    if (messagesContainerRef.current && activeChatId) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // 50px threshold

      // Update ref for real-time tracking
      isUserAtBottomRef.current = isAtBottom;

      const scrollData = {
        scrollTop,
        isAtBottom,
        timestamp: Date.now()
      };
      localStorage.setItem(`chat_scroll_${activeChatId}`, JSON.stringify(scrollData));
    }
  };

  const restoreScrollPosition = () => {
    if (messagesContainerRef.current && activeChatId) {
      const savedData = localStorage.getItem(`chat_scroll_${activeChatId}`);
      if (savedData) {
        try {
          const { scrollTop, isAtBottom } = JSON.parse(savedData);
          if (isAtBottom) {
            scrollToBottom();
            isUserAtBottomRef.current = true;
          } else {
            messagesContainerRef.current.scrollTop = scrollTop;
            isUserAtBottomRef.current = false;
          }
        } catch (e) {
          console.error('Error restoring scroll position:', e);
        }
      } else {
        // Default to bottom if no saved data
        scrollToBottom();
        isUserAtBottomRef.current = true;
      }
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      isUserAtBottomRef.current = true;
    }
  };

  // Save scroll position before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveScrollPosition();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeChatId]);

  // Restore scroll position on initial load or when switching chats
  useEffect(() => {
    if (!activeChatId || !activeMessages.length) return;

    if (isInitialLoad) {
      // On page refresh, restore saved scroll position
      const timeoutId = setTimeout(() => {
        restoreScrollPosition();
        setIsInitialLoad(false);
      }, 100);
      return () => clearTimeout(timeoutId);
    } else {
      // On new messages, scroll ONLY if user was already at bottom
      // OR if the last message is from the current user (they just sent it)
      const lastMessage = activeMessages[activeMessages.length - 1];
      const isMyMessage = lastMessage?.sender?.id === user?._id;

      if (isUserAtBottomRef.current || isMyMessage) {
        const timeoutId = setTimeout(() => {
          scrollToBottom();
        }, 100);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [activeMessages.length, activeChatId, isInitialLoad, user?._id]);

  // Save scroll position periodically while scrolling
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let scrollTimeout;
    const handleScroll = () => {
      if (container.scrollTop < 50 && activeChatId && (chatMessages[activeChatId]?.length || 0) > 0 && !olderLoading[activeChatId]) {
        const roomId = activeChatId;
        const existing = chatMessages[roomId] || [];
        const oldest = existing[0]?.createdAt || existing[0]?.timestamp;
        const token = localStorage.getItem("accessToken");
        if (oldest && token) {
          setOlderLoading((prev) => ({ ...prev, [roomId]: true }));
          const beforeHeight = container.scrollHeight;
          axios.get(`${API_BASE_URL}/chat/rooms/${roomId}/messages`, {
            params: { before: oldest, limit: 50 },
            headers: { Authorization: `Bearer ${token}` },
          }).then(async (res) => {
            const chat = chats.find((c) => c.id === roomId);
            const participants = chat?.participants || [];
            const participantIds = participants.map((p) => p.id || p._id || p).filter(Boolean);
            const decrypted = await Promise.all(
              (res.data?.messages || []).map((m) => decryptMessage(m, roomId, user?._id, participantIds))
            );
            setChatMessages((prev) => {
              const existingMsgs = prev[roomId] || [];
              const dedup = decrypted.filter((m) => !existingMsgs.some((em) => em.id === m.id));
              return { ...prev, [roomId]: [...dedup, ...existingMsgs] };
            });
            setTimeout(() => {
              const afterHeight = container.scrollHeight;
              container.scrollTop += afterHeight - beforeHeight;
            }, 0);
          }).finally(() => {
            setOlderLoading((prev) => ({ ...prev, [roomId]: false }));
          });
        }
      }
      // Update isUserAtBottomRef immediately on scroll
      const { scrollTop, scrollHeight, clientHeight } = container;
      isUserAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 50;

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        saveScrollPosition();
      }, 200);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [activeChatId]);

  const handleSendMessage = async (attachments = [], messageType = "text", contactData = null) => {
    const messageText = inputValue.trim();
    if (!messageText && !attachments.length && !contactData) return;
    if (!activeChatId) return;

    if (!socketRef.current || !socketRef.current.connected) {
      toast.error("Chat connection unavailable");
      return;
    }

    try {
      // Get participants from active chat or from chats ref
      const currentChat = activeChat || chatsRef.current.find((c) => c.id === activeChatId);
      const participants = currentChat?.participants || [];
      const participantIds = participants.map((p) => p.id || p._id || p).filter(Boolean);

      // For public chat, use empty participants to ensure consistent encryption key for all users
      // For other chats, if no participants found, use current user as fallback for key derivation
      if (participantIds.length === 0 && user?._id && currentChat?.type !== "public") {
        participantIds.push(user._id);
      }

      // Prepare message object
      const messageToEncrypt = {
        text: messageText,
        messageType,
        attachments,
        contactData,
      };

      // Encrypt the message
      const encryptedMessage = await encryptMessage(
        messageToEncrypt,
        activeChatId,
        user?._id,
        participantIds
      );

      socketRef.current.emit(
        "chat:send",
        {
          roomKey: activeChatId,
          text: encryptedMessage.text || "",
          messageType,
          attachments: encryptedMessage.attachments || [],
          contactData: encryptedMessage.contactData || null,
          isEncrypted: true,
        },
        (response) => {
          if (!response?.success) {
            toast.error(response?.message || "Failed to send message");
          } else {
            setInputValue("");
          }
        }
      );
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    }
  };

  const handleFileUpload = async (file, type) => {
    if (!file || !activeChatId) return;

    setUploading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(`${API_BASE_URL}/chat/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.success) {
        const attachment = res.data.attachment;
        handleSendMessage([attachment], type);
        setIsAttachmentMenuOpen(false);
      } else {
        toast.error("Failed to upload file");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        handleFileUpload(file, "image");
      } else {
        toast.error("Please select an image file");
      }
    }
    e.target.value = "";
  };

  const handleDocumentSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, "document");
    }
    e.target.value = "";
  };

  const handleContactShare = () => {
    if (!user?._id) {
      toast.error("User information not available");
      return;
    }

    const contactData = {
      userId: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone || "",
    };

    handleSendMessage([], "contact", contactData);
    setIsAttachmentMenuOpen(false);
  };

  const handleDeleteMessage = (messageId, deleteForEveryone = false) => {
    if (!socketRef.current?.connected) {
      toast.error("Chat connection unavailable");
      return;
    }

    socketRef.current.emit(
      "chat:delete",
      { messageId, deleteForEveryone },
      (response) => {
        if (!response?.success) {
          toast.error(response?.message || "Failed to delete message");
        }
        setDeleteMenuOpen((prev) => ({ ...prev, [messageId]: false }));
      }
    );
  };

  const handleImageDownload = (imageUrl, fileName) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = fileName || "image.jpg";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFilePreview = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleImageContextMenu = (e, messageId, imageUrl) => {
    e.preventDefault();
    setContextMenu({
      open: true,
      x: e.clientX,
      y: e.clientY,
      messageId,
      imageUrl,
    });
  };

  useEffect(() => {
    const handleClick = () => {
      setContextMenu({ open: false, x: 0, y: 0, messageId: null, imageUrl: null });
    };

    if (contextMenu.open) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu.open]);

  const handleChatSelect = (chatId) => {
    setActiveChatId(chatId);
    setIsChatsOpen(false);
    setUnreadCounts((prev) => ({ ...prev, [chatId]: 0 }));
  };

  const getChatIcon = (chat) => {
    if (chat.type === "public") return <Globe className="w-5 h-5 text-white" />;
    if (chat.type === "group") return <Users className="w-5 h-5 text-white" />;
    return <User className="w-5 h-5 text-white" />;
  };

  // Helper function to send call notification
  const sendCallNotification = async (messageType, callDurationSeconds = null, callStatus = "completed") => {
    if (!activeChatId || !socketRef.current?.connected) return null;

    return new Promise((resolve) => {
      const currentChat = activeChat || chatsRef.current.find((c) => c.id === activeChatId);
      const participants = currentChat?.participants || [];
      const participantIds = participants.map((p) => p.id || p._id || p).filter(Boolean);

      if (participantIds.length === 0 && user?._id && currentChat?.type !== "public") {
        participantIds.push(user._id);
      }

      const callText = messageType === "video_call" ? 
        (callDurationSeconds ? `Video call (${formatCallDuration(callDurationSeconds)})` : "Video call") :
        (callDurationSeconds ? `Audio call (${formatCallDuration(callDurationSeconds)})` : "Audio call");

      socketRef.current.emit(
        "chat:send",
        {
          roomKey: activeChatId,
          text: callText,
          messageType: messageType,
          attachments: [],
          contactData: null,
          isEncrypted: false,
          meta: {
            callDuration: callDurationSeconds,
            callStatus: callStatus,
          }
        },
        (response) => {
          if (response?.success) {
            resolve(response.messageId);
          } else {
            resolve(null);
          }
        }
      );
    });
  };

  const formatCallDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startVideoCall = async () => {
    try {
      if (!activeChat) {
        toast.error("No chat selected");
        return;
      }

      const stream = await getSafeUserMedia();
      setCameraStream(stream);
      cameraStreamRef.current = stream;
      setLocalStream(stream);
      localStreamRef.current = stream;
      activeChatIdRef.current = activeChatId;
      acceptedRoomsRef.current.add(String(activeChatId));

      // Add ourselves to accepted participants since we're initiating the call
      acceptedParticipantsRef.current.add(String(user?._id));
      isCallInitiatorRef.current = true;

      setIsVideoCallOpen(true);

      // Wait for dialog to open and video element to be ready
      setTimeout(() => {
        if (localVideoRef.current && stream) {
          try {
            localVideoRef.current.srcObject = stream;
            const p = localVideoRef.current.play();
            if (p && typeof p.then === "function") {
              p.catch((err) => {
                console.error("Error playing local video:", err);
                setTimeout(() => {
                  if (localVideoRef.current && stream) {
                    try {
                      localVideoRef.current.srcObject = stream;
                      localVideoRef.current.play().catch(() => { });
                    } catch { }
                  }
                }, 200);
              });
            }
          } catch (err) {
            console.error("Error setting local video:", err);
          }
        }
      }, 100);

      // Handle different chat types
      if (activeChat.type === "individual" && activeChat.participant) {
        // Individual chat - call single participant
        console.log(`[VIDEO CALL] Initiating call to ${activeChat.participant.id}`);
        socketRef.current.emit("rtc:ring", { to: activeChat.participant.id, roomKey: activeChatId });
      } else if (activeChat.type === "group" || activeChat.type === "public") {
        // Group/Public chat - call all participants except self
        const participants = activeChat.participants || [];
        const targetIds = participants
          .map(p => p.id || p._id)
          .filter(id => id && String(id) !== String(user?._id));

        if (targetIds.length === 0) {
          toast.error("No other participants in this chat");
          endVideoCall();
          return;
        }

        console.log(`[VIDEO CALL] Initiating group call to ${targetIds.length} participants`);
        // Ring all participants, passing previously rung peers so accepters can connect to everyone
        const rungIds = [];
        targetIds.forEach((targetId) => {
          socketRef.current.emit("rtc:ring", { to: targetId, roomKey: activeChatId, peers: [...rungIds] });
          rungIds.push(targetId);
        });
      } else {
        toast.error("Unable to start call for this chat type");
        endVideoCall();
      }
    } catch (err) {
      console.error("Error starting video call:", err);
      toast.error("Unable to access camera/microphone");
    }
  };

  const startAudioCall = async () => {
    try {
      if (!activeChat) {
        toast.error("No chat selected");
        return;
      }

      const stream = await getSafeUserMedia(true); // Audio only
      setLocalStream(stream);
      localStreamRef.current = stream;
      setCameraStream(stream);
      cameraStreamRef.current = stream;
      setIsAudioOnly(true);
      activeChatIdRef.current = activeChatId;
      acceptedRoomsRef.current.add(String(activeChatId));

      // Add ourselves to accepted participants since we're initiating the call
      acceptedParticipantsRef.current.add(String(user?._id));
      isCallInitiatorRef.current = true;

      setIsVideoCallOpen(true);

      // Handle different chat types
      if (activeChat.type === "individual" && activeChat.participant) {
        // Individual chat - call single participant
        console.log(`[AUDIO CALL] Initiating call to ${activeChat.participant.id}`);
        socketRef.current.emit("rtc:ring", { to: activeChat.participant.id, roomKey: activeChatId, isAudioOnly: true });
      } else if (activeChat.type === "group" || activeChat.type === "public") {
        // Group/Public chat - call all participants except self
        const participants = activeChat.participants || [];
        const targetIds = participants
          .map(p => p.id || p._id)
          .filter(id => id && String(id) !== String(user?._id));

        if (targetIds.length === 0) {
          toast.error("No other participants in this chat");
          endVideoCall();
          return;
        }

        console.log(`[AUDIO CALL] Initiating group call to ${targetIds.length} participants`);
        // Ring all participants
        targetIds.forEach(targetId => {
          socketRef.current.emit("rtc:ring", { to: targetId, roomKey: activeChatId, isAudioOnly: true });
        });
      } else {
        toast.error("Unable to start call for this chat type");
        endVideoCall();
      }
    } catch (err) {
      console.error("Error starting audio call:", err);
      toast.error("Unable to access microphone");
    }
  };

  const endVideoCall = () => {
    try {
      // Get final call duration before clearing
      const finalDuration = callDuration;
      const wasCallActive = callTimerRef.current !== null;

      // Stop call timer
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }

      // Send call notification with duration - only one notification per call
      if (finalDuration > 0 && isCallInitiatorRef.current) {
        // Call was connected and has duration
        const messageType = isAudioOnly ? "audio_call" : "video_call";
        sendCallNotification(messageType, finalDuration, "completed");
        console.log('[CALL NOTIFICATION] Call ended with duration:', finalDuration);
      }

      setCallDuration(0);
      callStartTimeRef.current = null;
      callNotificationIdRef.current = null;

      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
      if (cameraStream && cameraStream !== localStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
      setLocalStream(null);
      localStreamRef.current = null;
      setCameraStream(null);
      cameraStreamRef.current = null;
      setIsScreenSharing(false);
      setIsVideoCallOpen(false);
      setIsAudioOnly(false);
      setIsCallMinimized(false);
      isCallInitiatorRef.current = false;
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      peerConnectionsRef.current = {};
      setRemoteStreams({});
      if (socketRef.current?.connected && callTargets.length) {
        callTargets.forEach((tid) => {
          socketRef.current.emit("rtc:end", { to: tid, roomKey: activeChatId, from: user?._id });
        });
      }
      setCallTargets([]);
      acceptedParticipantsRef.current.clear();
      acceptedRoomsRef.current.delete(String(activeChatId));
      activeChatIdRef.current = null; // Clear the active chat ref to prevent auto-accept on next call
      setIsConnecting(false);
      setMicEnabled(true);
      setCameraEnabled(true);
    } catch { void 0; }
  };

  const createConnectionAndOffer = async (targetId) => {
    if (!socketRef.current?.connected || !targetId) return;
    const roomKey = activeChatIdRef.current || activeChatId;
    if (!roomKey) return;

    // Use localStreamRef (which contains screen share if active) or fall back to cameraStreamRef
    let streamToUse = localStreamRef.current || cameraStreamRef.current;
    if (!streamToUse) {
      try {
        console.log(`[CREATE OFFER] No stream available, acquiring media for ${targetId}...`);
        const s = await getSafeUserMedia(isAudioOnly);
        setCameraStream(s);
        cameraStreamRef.current = s;
        setLocalStream(s);
        localStreamRef.current = s;
        streamToUse = s;
      } catch {
        console.error(`[CREATE OFFER] Failed to acquire media for ${targetId}`);
        return;
      }
    }

    // Verify stream has tracks
    const tracks = streamToUse.getTracks();
    if (tracks.length === 0) {
      console.error(`[CREATE OFFER] Stream has no tracks for ${targetId}, cannot proceed`);
      return;
    }

    const videoTrack = tracks.find(t => t.kind === 'video');
    const isScreenShareStream = videoTrack && (
      videoTrack.label.toLowerCase().includes('screen') || 
      videoTrack.label.toLowerCase().includes('window') ||
      videoTrack.label.toLowerCase().includes('monitor')
    );
    
    console.log(`[CREATE OFFER] Creating peer connection for ${targetId} with ${tracks.length} tracks (isScreenSharing: ${isScreenSharingRef.current}, detected screen share: ${isScreenShareStream})`);

    let pc = peerConnectionsRef.current[targetId];
    if (!pc) {
      pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      peerConnectionsRef.current[targetId] = pc;

      // Add all tracks to peer connection
      tracks.forEach((t) => {
        if (pc.getSenders().find(s => s.track === t)) {
          console.log(`[CREATE OFFER] Track ${t.kind} already added to ${targetId}, skipping`);
          return;
        }
        if (t.kind === "audio") { t.enabled = micEnabledRef.current; }
        if (t.kind === "video") { t.enabled = cameraEnabledRef.current; }
        console.log(`[CREATE OFFER] Adding ${t.kind} track (label: ${t.label}) to peer connection for ${targetId}`);
        pc.addTrack(t, streamToUse);
      });

      pc.ontrack = (event) => {
        const stream = event.streams?.[0];
        if (!stream) return;

        console.log(`[CREATE OFFER] Received remote stream from ${targetId} with ${stream.getTracks().length} tracks`);

        // Only add to remoteStreams if this participant has accepted the call
        if (acceptedParticipantsRef.current.has(String(targetId))) {
          setRemoteStreams((prev) => {
            const next = { ...prev };
            next[targetId] = stream;
            console.log(`[CREATE OFFER] Updated remoteStreams for ${targetId}, now have ${Object.keys(next).length} remote streams`);
            return next;
          });
        } else {
          console.log(`[CREATE OFFER] Participant ${targetId} not in accepted list, not adding to remoteStreams`);
        }

        event.streams?.forEach((s) => {
          s.getTracks().forEach((track) => {
            track.onended = () => {
              setRemoteStreams((prev) => {
                const next = { ...prev };
                if (next[targetId]) {
                  const updatedStream = new MediaStream(next[targetId].getTracks().filter(t => t !== track));
                  if (updatedStream.getTracks().length > 0) {
                    next[targetId] = updatedStream;
                  } else {
                    delete next[targetId];
                  }
                }
                return next;
              });
            };
          });
        });
      };

      pc.oniceconnectionstatechange = () => {
        const s = pc.iceConnectionState;
        console.log(`[CREATE OFFER] ICE connection state for ${targetId}: ${s}`);
        if (s === "connected" || s === "completed") { setIsConnecting(false); }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socketRef.current.emit("rtc:candidate", { to: targetId, roomKey, candidate: e.candidate });
        }
      };
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log(`[CREATE OFFER] Sending offer to ${targetId}`);
    socketRef.current.emit("rtc:offer", { to: targetId, roomKey, offer, from: user?._id });
  };

  const toggleScreenShare = async () => {
    if (!localStream && !cameraStream) return;
    try {
      if (!isScreenSharing) {
        const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const screenTrack = display.getVideoTracks()[0];
        const audioTrack = display.getAudioTracks()[0];
        if (!screenTrack) return;
        screenTrack.enabled = cameraEnabled;
        if (audioTrack) { audioTrack.enabled = micEnabled; }

        const audioTracks = cameraStream ? cameraStream.getAudioTracks() : (localStream ? localStream.getAudioTracks() : []);
        const newStream = new MediaStream([screenTrack, ...(audioTrack ? [audioTrack] : audioTracks)]);

        Object.values(peerConnectionsRef.current).forEach(async (pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender) {
            try {
              await sender.replaceTrack(screenTrack);
            } catch (err) {
              console.error("Error replacing track:", err);
            }
          }
        });

        setLocalStream(newStream);
        localStreamRef.current = newStream;
        setIsScreenSharing(true);
        isScreenSharingRef.current = true;
        
        // Notify server about screen sharing state
        const roomKey = activeChatIdRef.current || activeChatId;
        if (socketRef.current?.connected && roomKey) {
          socketRef.current.emit("rtc:screen-share", { roomKey, isSharing: true });
        }

        screenTrack.onended = async () => {
          if (cameraStream) {
            const camTrack = cameraStream.getVideoTracks()[0];
            if (camTrack) {
              Object.values(peerConnectionsRef.current).forEach(async (pc) => {
                const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
                if (sender) {
                  try {
                    await sender.replaceTrack(camTrack);
                  } catch (err) {
                    console.error("Error replacing track:", err);
                  }
                }
              });
            }
            setLocalStream(cameraStream);
            localStreamRef.current = cameraStream;
            setIsScreenSharing(false);
            isScreenSharingRef.current = false;
            
            // Notify server about screen sharing stopped
            const roomKey = activeChatIdRef.current || activeChatId;
            if (socketRef.current?.connected && roomKey) {
              socketRef.current.emit("rtc:screen-share", { roomKey, isSharing: false });
            }
          }
        };
      } else if (cameraStream) {
        const camTrack = cameraStream.getVideoTracks()[0];
        if (camTrack) {
          Object.values(peerConnectionsRef.current).forEach(async (pc) => {
            const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
            if (sender) {
              try {
                await sender.replaceTrack(camTrack);
              } catch (err) {
                console.error("Error replacing track:", err);
              }
            }
          });
        }
        setLocalStream(cameraStream);
        localStreamRef.current = cameraStream;
        setIsScreenSharing(false);
        isScreenSharingRef.current = false;
        
        // Notify server about screen sharing stopped
        const roomKey = activeChatIdRef.current || activeChatId;
        if (socketRef.current?.connected && roomKey) {
          socketRef.current.emit("rtc:screen-share", { roomKey, isSharing: false });
        }
      }
    } catch { toast.error("Unable to share screen"); }
  };

  const addParticipantToCall = async (participantId, overrideRoomKey = null) => {
    if (!participantId) return;
    if (!localStream) {
      if (isAudioOnly) {
        await startAudioCall();
      } else {
        await startVideoCall();
      }
    }
    setCallTargets((prev) => (prev.includes(participantId) ? prev : [...prev, participantId]));
    const existingPeers = Object.keys(peerConnectionsRef.current);
    const roomKeyToUse = overrideRoomKey || activeChatId;
    if (roomKeyToUse) {
      socketRef.current.emit("rtc:ring", { to: participantId, roomKey: roomKeyToUse, peers: existingPeers, isAudioOnly });
    } else {
      console.error("No room key available for calling participant");
    }
  };

  const acceptRing = async (from, roomKey, isAudioOnly = false) => {
    try {
      let stream = localStream || cameraStream;
      if (!stream) {
        stream = await getSafeUserMedia(isAudioOnly);
        setLocalStream(stream);
        localStreamRef.current = stream;
        setCameraStream(stream);
        cameraStreamRef.current = stream;
      }
      setIsAudioOnly(isAudioOnly);
      activeChatIdRef.current = roomKey;
      setActiveChatId(roomKey);
      acceptedRoomsRef.current.add(String(roomKey));
      setIsVideoCallOpen(true);
      setIsConnecting(true);

      // Wait for dialog to open before setting video
      setTimeout(() => {
        if (localVideoRef.current && stream) {
          try {
            localVideoRef.current.srcObject = stream;
            const p = localVideoRef.current.play();
            if (p && typeof p.then === "function") {
              p.catch((err) => {
                console.error("Error playing video on accept:", err);
                setTimeout(() => {
                  if (localVideoRef.current && stream) {
                    try {
                      localVideoRef.current.srcObject = stream;
                      localVideoRef.current.play().catch(() => { });
                    } catch { }
                  }
                }, 200);
              });
            }
          } catch (err) {
            console.error("Error setting video on accept:", err);
          }
        }
      }, 100);

      // Add the caller to call targets - the caller will create the offer
      setCallTargets((prev) => (prev.includes(from) ? prev : [...prev, from]));
      acceptedParticipantsRef.current.add(String(from));

      // Pre-initialize peer connection structure to be ready for the offer
      if (!peerConnectionsRef.current[from]) {
        const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
        peerConnectionsRef.current[from] = pc;

        // Add local stream tracks to peer connection
        stream.getTracks().forEach((t) => {
          if (pc.getSenders().find(s => s.track === t)) return;
          if (t.kind === "audio") { t.enabled = micEnabledRef.current; }
          if (t.kind === "video") { t.enabled = cameraEnabledRef.current; }
          pc.addTrack(t, stream);
        });

        // Set up remote stream handler
        pc.ontrack = (event) => {
          const remoteStream = event.streams?.[0];
          if (!remoteStream) return;
          // Only add to remoteStreams if this participant has accepted the call
          if (acceptedParticipantsRef.current.has(String(from))) {
            setRemoteStreams((prev) => {
              const next = { ...prev };
              next[from] = remoteStream;
              return next;
            });
          }
          event.streams?.forEach((s) => {
            s.getTracks().forEach((track) => {
              track.onended = () => {
                setRemoteStreams((prev) => {
                  const next = { ...prev };
                  if (next[from]) {
                    const updatedStream = new MediaStream(next[from].getTracks().filter(t => t !== track));
                    if (updatedStream.getTracks().length > 0) {
                      next[from] = updatedStream;
                    } else {
                      delete next[from];
                    }
                  }
                  return next;
                });
              };
            });
          });
        };

        pc.oniceconnectionstatechange = () => {
          const s = pc.iceConnectionState;
          if (s === "connected" || s === "completed") { setIsConnecting(false); }
        };

        pc.onicecandidate = (e) => {
          if (e.candidate && socketRef.current?.connected) {
            socketRef.current.emit("rtc:candidate", { to: from, roomKey, candidate: e.candidate });
          }
        };
      }

      const existingPeersFromIncoming = Array.isArray(incomingCall?.peers)
        ? incomingCall.peers.map(String)
        : [];
      const existingPeers = existingPeersFromIncoming.length
        ? existingPeersFromIncoming
        : Object.keys(peerConnectionsRef.current);
      socketRef.current.emit("rtc:ring:accept", { to: from, roomKey, peers: existingPeers });

      setIncomingCall(null);
    } catch (err) {
      console.error("Error accepting ring:", err);
      toast.error("Unable to start media");
    }
  };

  const declineRing = (from, roomKey) => {
    socketRef.current.emit("rtc:ring:decline", { to: from, roomKey });
    setIncomingCall(null);
    // Send missed call notification from the decliner's perspective
    const messageType = incomingCall?.isAudioOnly ? "audio_call" : "video_call";
    sendCallNotification(messageType, 0, "declined");
  };

  const getSafeUserMedia = async (audioOnly = false) => {
    let videoTrack = null;
    let audioTrack = null;

    if (audioOnly) {
      // Audio-only mode: only request audio
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioTrack = audioStream.getAudioTracks()[0];
      } catch {
        throw new Error("Microphone unavailable");
      }
    } else {
      // Video call mode: request both video and audio
      try {
        const both = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
        const v = both.getVideoTracks()[0];
        const a = both.getAudioTracks()[0];
        if (v) videoTrack = v;
        if (a) audioTrack = a;
      } catch {
        try {
          const vOnly = await navigator.mediaDevices.getUserMedia({ video: true });
          const v = vOnly.getVideoTracks()[0];
          if (v) videoTrack = v;
        } catch { /* no video */ }
        try {
          const aOnly = await navigator.mediaDevices.getUserMedia({ audio: true });
          const a = aOnly.getAudioTracks()[0];
          if (a) audioTrack = a;
        } catch { /* no audio */ }
      }
    }

    if (!videoTrack && !audioTrack) {
      throw new Error("Media devices unavailable");
    }
    return new MediaStream([...(videoTrack ? [videoTrack] : []), ...(audioTrack ? [audioTrack] : [])]);
  };

  const toggleMic = () => {
    const targetStream = cameraStream || localStream;
    const tracks = targetStream ? targetStream.getAudioTracks() : [];
    const next = !micEnabled;
    tracks.forEach((t) => { t.enabled = next; });
    Object.values(peerConnectionsRef.current).forEach((pc) => {
      pc.getSenders().forEach((sender) => {
        if (sender.track && sender.track.kind === "audio") {
          sender.track.enabled = next;
        }
      });
    });
    setMicEnabled(next);
  };

  const toggleCamera = () => {
    const targetStream = cameraStream || localStream;
    const tracks = targetStream ? targetStream.getVideoTracks() : [];
    const next = !cameraEnabled;
    tracks.forEach((t) => { t.enabled = next; });
    Object.values(peerConnectionsRef.current).forEach((pc) => {
      pc.getSenders().forEach((sender) => {
        if (sender.track && sender.track.kind === "video") {
          sender.track.enabled = next;
        }
      });
    });
    setCameraEnabled(next);
  };

  const getChatAvatar = (chat) => {
    const avatarSource = chat?.avatar || chat?.participant?.profilePic;
    if (avatarSource) {
      return <AvatarImage src={avatarSource} />;
    }
    return null;
  };

  const getChatTitle = (chat) => {
    if (!chat) return "Incoming Call";
    if (chat.type === "public") return "Public Chat";
    if (chat.type === "individual" && chat.participant?.username) {
      return chat.participant.username;
    }
    return chat.name || "Chat";
  };

  // Create a mapping from peerId to participant information
  const getParticipantsMap = () => {
    const map = {};
    if (!activeChat) return map;
    
    // Get participants from activeChat or group
    const participants = activeChat.participants || group?.members || group?.participants || [];
    
    participants.forEach((participant) => {
      const participantId = String(participant.id || participant._id || participant);
      map[participantId] = {
        id: participantId,
        username: participant.username || participant.name,
        profilePic: participant.profilePic,
        ...participant
      };
    });
    
    // Also add group supervisor if exists
    if (group?.supervisor) {
      const supervisorId = String(group.supervisor._id || group.supervisor.id);
      map[supervisorId] = {
        id: supervisorId,
        username: group.supervisor.username || group.supervisor.name,
        profilePic: group.supervisor.profilePic,
        ...group.supervisor
      };
    }
    
    return map;
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!canSendMessage) return;
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diff = now - messageDate;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return messageDate.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const formatDayLabel = (date) => {
    const d = new Date(date);
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfTarget = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.floor((startOfToday - startOfTarget) / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return d.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
  };

  const shouldShowAvatar = (currentIndex) => {
    if (!Array.isArray(activeMessages) || !activeMessages.length) return false;
    if (currentIndex === 0) return true;
    const currentMsg = activeMessages[currentIndex];
    const prevMsg = activeMessages[currentIndex - 1];
    if (!currentMsg || !prevMsg) return true;
    return (
      currentMsg.sender.id !== prevMsg.sender.id ||
      new Date(currentMsg.timestamp) - new Date(prevMsg.timestamp) > 300000
    );
  };

  return (<>
    <SEO 
      title="Team Chat | FYP Buddy - Collaborate with Your Team"
      description="Communicate with your FYP team members in real-time. Share files, make video calls, and collaborate effectively on your final year project."
      keywords="team chat, FYP collaboration, project communication, team messaging, video calls"
    />
    <div className="min-h-screen mt-15">
      <div className="flex flex-col md:flex-row gap-5 p-5">
        {/* Sidebar */}
        <Sidebar portalType="student" />

        {/* Main Chat Interface */}
        <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
          {/* Header */}
          <ChatHeader
            activeChat={activeChat}
            isChatsOpen={isChatsOpen}
            setIsChatsOpen={setIsChatsOpen}
            onlineUsers={onlineUsers}
            startAudioCall={startAudioCall}
            startVideoCall={startVideoCall}
            getChatAvatar={getChatAvatar}
            getChatTitle={getChatTitle}
            getChatIcon={getChatIcon}
          />


          {/* Chat Messages Container */}
          <Card className="flex-1 flex flex-col mb-5 bg-white dark:bg-gray-800 shadow-lg rounded-2xl border-none overflow-hidden">
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 
    bg-gradient-to-b from-gray-50/50 to-white 
    dark:from-gray-900/50 dark:to-gray-800 
    max-h-[70vh]"
            >
              {roomsLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                </div>
              ) : !activeChat ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                  Click the chat to open the conversation and start messaging
                </div>
              ) : (
                <>
                  {activeMessages.length === 0 && (
                    <div className="flex flex-col h-full items-center justify-center text-center px-6">
                      <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
                        No messages yet
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Send a message to start the conversation
                      </p>
                    </div>
                  )}

                  {activeMessages.map((message, index) => {
                    const sender = message.sender || {};
                    const isCurrentUser = sender.id === user?._id;
                    const showAvatar = shouldShowAvatar(index);
                    const messageWithChat = {
                      ...message,
                      activeChat: activeChat
                    };

                    const currKey = new Date(message.timestamp || message.createdAt).toDateString();
                    const prevMsg = index > 0 ? activeMessages[index - 1] : null;
                    const prevKey = prevMsg ? new Date(prevMsg.timestamp || prevMsg.createdAt).toDateString() : null;
                    const showDateSeparator = !prevKey || currKey !== prevKey;

                    return (
                      <React.Fragment key={message.id || `${message.roomKey}-${index}`}>
                        {showDateSeparator && (
                          <div className="flex justify-center my-2">
                            <span className="px-3 py-1 rounded-full text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                              {formatDayLabel(message.timestamp || message.createdAt)}
                            </span>
                          </div>
                        )}
                        <ChatMessage
                          message={messageWithChat}
                          isCurrentUser={isCurrentUser}
                          showAvatar={showAvatar}
                          user={user}
                          deleteMenuOpen={deleteMenuOpen}
                          setDeleteMenuOpen={setDeleteMenuOpen}
                          contextMenu={contextMenu}
                          setContextMenu={setContextMenu}
                          handleDeleteMessage={handleDeleteMessage}
                          handleImageDownload={handleImageDownload}
                          handleFilePreview={handleFilePreview}
                          handleImageContextMenu={handleImageContextMenu}
                          formatTime={formatTime}
                        />
                      </React.Fragment>
                    );
                  })}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <ChatInput
              inputValue={inputValue}
              setInputValue={setInputValue}
              canSendMessage={canSendMessage}
              uploading={uploading}
              activeChat={activeChat}
              imageInputRef={imageInputRef}
              fileInputRef={fileInputRef}
              inputRef={inputRef}
              isAttachmentMenuOpen={isAttachmentMenuOpen}
              setIsAttachmentMenuOpen={setIsAttachmentMenuOpen}
              handleImageSelect={handleImageSelect}
              handleDocumentSelect={handleDocumentSelect}
              handleContactShare={handleContactShare}
              handleSendMessage={handleSendMessage}
              handleKeyPress={handleKeyPress}
              connectionError={connectionError}
              socketRef={socketRef}
            />
          </Card>

        </main>

        {/* Mobile Chats Sidebar */}
        <ChatSidebar
          chats={chats}
          activeChatId={activeChatId}
          roomsLoading={roomsLoading}
          chatMessages={chatMessages}
          unreadCounts={unreadCounts}
          onlineUsers={onlineUsers}
          handleChatSelect={handleChatSelect}
          getChatAvatar={getChatAvatar}
          getChatTitle={getChatTitle}
          getChatIcon={getChatIcon}
          isChatsOpen={isChatsOpen}
          setIsChatsOpen={setIsChatsOpen}
          isMobile={true}
        />

        {/* Desktop Chats Sidebar */}
        <ChatSidebar
          chats={chats}
          activeChatId={activeChatId}
          roomsLoading={roomsLoading}
          chatMessages={chatMessages}
          unreadCounts={unreadCounts}
          onlineUsers={onlineUsers}
          handleChatSelect={handleChatSelect}
          getChatAvatar={getChatAvatar}
          getChatTitle={getChatTitle}
          getChatIcon={getChatIcon}
          isMobile={false}
        />
      </div>
    </div>
    <VideoCallDialog
      isVideoCallOpen={isVideoCallOpen}
      endVideoCall={endVideoCall}
      isConnecting={isConnecting}
      remoteStreams={remoteStreams}
      activeChat={activeChat}
      isAudioOnly={isAudioOnly}
      user={user}
      micEnabled={micEnabled}
      cameraEnabled={cameraEnabled}
      toggleMic={toggleMic}
      toggleCamera={toggleCamera}
      localVideoRef={localVideoRef}
      remoteVideoRef={remoteVideoRef}
      localStream={localStream}
      cameraStream={cameraStream}
      isScreenSharing={isScreenSharing}
      toggleScreenShare={toggleScreenShare}
      group={group}
      addParticipantToCall={addParticipantToCall}
      maximizedPeerId={maximizedPeerId}
      setMaximizedPeerId={setMaximizedPeerId}
      getChatAvatar={getChatAvatar}
      getChatTitle={getChatTitle}
      firstRemoteEntry={firstRemoteEntry}
      isCallMinimized={isCallMinimized}
      setIsCallMinimized={setIsCallMinimized}
      participantsMap={getParticipantsMap()}
      callDuration={callDuration}
    />
    <MinimizedCallPopup
      isVideoCallOpen={isVideoCallOpen}
      isCallMinimized={isCallMinimized}
      setIsCallMinimized={setIsCallMinimized}
      endVideoCall={endVideoCall}
      isAudioOnly={isAudioOnly}
      activeChat={activeChat}
      getChatAvatar={getChatAvatar}
      getChatTitle={getChatTitle}
      localVideoRef={localVideoRef}
      localStream={localStream}
      cameraStream={cameraStream}
      isScreenSharing={isScreenSharing}
      micEnabled={micEnabled}
      toggleMic={toggleMic}
      remoteStreams={remoteStreams}
      callDuration={callDuration}
    />
    <IncomingCallDialog
      incomingCall={incomingCall}
      setIncomingCall={setIncomingCall}
      acceptRing={acceptRing}
      declineRing={declineRing}
      getChatAvatar={getChatAvatar}
      getChatTitle={getChatTitle}
    />
  </>);
}
