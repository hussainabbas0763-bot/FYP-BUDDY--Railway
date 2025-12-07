import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useSocket } from '../contexts/SocketContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Phone, Video } from 'lucide-react';
import userImg from '@/assets/user.jpg';
import toast from 'react-hot-toast';

const GlobalCallHandler = () => {
  const { socket, isConnected } = useSocket();
  const { user } = useSelector((store) => store.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const ringtoneRef = React.useRef(null);

  // Create ringtone audio element
  useEffect(() => {
    const audio = new Audio('https://www.soundjay.com/phone/sounds/telephone-ring-04.mp3');
    audio.loop = true;
    audio.preload = 'auto';
    ringtoneRef.current = audio;
    
    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    if (!socket || !isConnected || !user?._id) return;

    const handleIncomingCall = (payload) => {
      const { from, roomKey, peers, isAudioOnly, caller } = payload || {};
      if (!from || !roomKey) return;

      console.log('[GLOBAL CALL HANDLER] Incoming call from', from, 'in room', roomKey);

      // Check if we're already on the TeamChat page
      const isOnTeamChatPage = location.pathname.includes('/team-chat');
      
      if (isOnTeamChatPage) {
        // If on TeamChat page, let the page component handle it
        console.log('[GLOBAL CALL HANDLER] On TeamChat page, letting page handle the call');
        return;
      }

      // Play ringtone
      if (ringtoneRef.current) {
        ringtoneRef.current.play().catch(err => {
          console.log("Could not play ringtone:", err);
        });
        
        // Stop ringtone after 30 seconds (when toast expires)
        setTimeout(() => {
          if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
          }
        }, 30000);
      }

      // Show toast notification for incoming call
      const callerName = caller?.username || 'Someone';
      const callType = isAudioOnly ? 'Audio' : 'Video';
      
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-2xl rounded-2xl pointer-events-auto flex ring-2 ring-white cursor-pointer hover:shadow-3xl transition-all hover:scale-105`}
          onClick={() => {
            // Stop ringtone when user answers
            if (ringtoneRef.current) {
              ringtoneRef.current.pause();
              ringtoneRef.current.currentTime = 0;
            }
            toast.dismiss(t.id);
            // Store call info and navigate to TeamChat
            console.log('[GLOBAL CALL HANDLER] Storing call data:', payload);
            sessionStorage.setItem('incomingCall', JSON.stringify(payload));
            sessionStorage.setItem('openRoomKey', roomKey);
            const role = user?.role;
            console.log('[GLOBAL CALL HANDLER] Navigating to TeamChat for role:', role);
            if (role === 'student') {
              navigate('/student/team-chat');
            } else if (role === 'supervisor') {
              navigate('/supervisor/team-chat');
            }
          }}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-white">
                    <AvatarImage src={caller?.profilePic || userImg} alt={callerName} />
                    <AvatarFallback className="bg-white text-purple-600 font-bold">
                      {callerName[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
                    {isAudioOnly ? (
                      <Phone className="w-3 h-3 text-green-600" />
                    ) : (
                      <Video className="w-3 h-3 text-blue-600" />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">
                  Incoming {callType} Call
                </p>
                <p className="text-sm text-white/90 truncate">
                  {callerName}
                </p>
                <p className="text-xs text-white/70 mt-1">
                  Tap to answer
                </p>
              </div>
              <div className="flex-shrink-0">
                <Phone className="w-6 h-6 text-white animate-bounce" />
              </div>
            </div>
          </div>
        </div>
      ), {
        duration: 30000, // 30 seconds
        position: 'top-right',
      });
    };

    const handleNewMessage = (message) => {
      if (!message || !message.roomKey) return;

      // Check if we're on the TeamChat page
      const isOnTeamChatPage = location.pathname.includes('/team-chat');
      
      if (isOnTeamChatPage) {
        // If on TeamChat page, let the page component handle it
        console.log('[GLOBAL CALL HANDLER] On TeamChat page, letting page handle the message');
        return;
      }

      // Only show notification if message is from someone else
      if (message.sender?.id !== user?._id) {
        const senderName = message.sender?.username || 'Someone';
        
        toast.custom((t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 cursor-pointer hover:shadow-xl transition-shadow`}
            onClick={() => {
              toast.dismiss(t.id);
              // Store the room key and navigate to TeamChat
              sessionStorage.setItem('openRoomKey', message.roomKey);
              const role = user?.role;
              if (role === 'student') {
                navigate('/student/team-chat');
              } else if (role === 'supervisor') {
                navigate('/supervisor/team-chat');
              }
            }}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={message.sender?.profilePic || userImg} alt={senderName} />
                    <AvatarFallback>{senderName[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {senderName}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    New message
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200 dark:border-gray-700">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toast.dismiss(t.id);
                }}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        ), {
          duration: 5000,
          position: 'top-right',
        });
      }
    };

    socket.on('rtc:ring', handleIncomingCall);
    socket.on('chat:new-message', handleNewMessage);

    return () => {
      socket.off('rtc:ring', handleIncomingCall);
      socket.off('chat:new-message', handleNewMessage);
    };
  }, [socket, isConnected, user?._id, location.pathname, navigate, user?.role]);

  return null;
};

export default GlobalCallHandler;
