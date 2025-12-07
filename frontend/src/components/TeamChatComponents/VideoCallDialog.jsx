import React, { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Video, VideoOff, Mic, MicOff, X, Minimize2, Maximize2, UserPlus } from "lucide-react";
import userImg from "@/assets/user.jpg";

const VideoPlayer = ({ stream, videoRef, onStreamLoaded, ...props }) => {
    const internalRef = useRef(null);

    useEffect(() => {
        if (videoRef) {
            if (typeof videoRef === 'function') {
                videoRef(internalRef.current);
            } else {
                videoRef.current = internalRef.current;
            }
        }
    }, [videoRef]);

    useEffect(() => {
        const video = internalRef.current;
        if (video && stream) {
            video.srcObject = stream;
            video.play().catch(() => { });
            
            // Call onStreamLoaded when video metadata is loaded
            const handleLoadedMetadata = () => {
                if (onStreamLoaded) {
                    onStreamLoaded(video);
                }
            };
            video.addEventListener('loadedmetadata', handleLoadedMetadata);
            
            return () => {
                video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            };
        }
    }, [stream, onStreamLoaded]);

    return (
        <video
            ref={internalRef}
            autoPlay
            playsInline
            {...props}
        />
    );
};

// Helper function to detect if a remote stream is a screen share
const isRemoteScreenShare = (stream) => {
    if (!stream) return false;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return false;
    
    // Check track label (common indicators)
    const label = videoTrack.label.toLowerCase();
    if (label.includes('screen') || label.includes('window') || label.includes('monitor') || 
        label.includes('display') || label.includes('chrome') || label.includes('firefox') ||
        label.includes('electron')) {
        return true;
    }
    
    // Check track settings (screen shares typically have different dimensions/aspect ratios)
    try {
        const settings = videoTrack.getSettings?.();
        if (settings) {
            const { width, height } = settings;
            if (width && height) {
                // Screen shares often have larger dimensions
                if (width >= 1920 || height >= 1080) {
                    return true;
                }
                // Check for common screen aspect ratios (16:9, 16:10, 21:9, etc.)
                const aspectRatio = width / height;
                // Screen shares typically have wider aspect ratios or exact monitor ratios
                if (aspectRatio >= 1.6 && (width >= 1280 || height >= 720)) {
                    return true;
                }
            }
        }
    } catch (e) {
        // getSettings might not be supported
    }
    
    // Check content hint
    if (videoTrack.contentHint === 'detail' || videoTrack.contentHint === 'text') {
        return true;
    }
    
    // Check track kind and constraints
    if (videoTrack.kind === 'video' && videoTrack.readyState === 'live') {
        const constraints = videoTrack.getConstraints?.();
        if (constraints && (constraints.displaySurface || constraints.logicalSurface)) {
            return true;
        }
    }
    
    return false;
};

const VideoCallDialog = ({
    isVideoCallOpen,
    endVideoCall,
    isConnecting,
    remoteStreams,
    activeChat,
    isAudioOnly,
    user,
    micEnabled,
    cameraEnabled,
    toggleMic,
    toggleCamera,
    localVideoRef,
    remoteVideoRef,
    localStream,
    cameraStream,
    isScreenSharing,
    toggleScreenShare,
    group,
    addParticipantToCall,
    maximizedPeerId,
    setMaximizedPeerId,
    getChatAvatar,
    getChatTitle,
    firstRemoteEntry,
    isCallMinimized,
    setIsCallMinimized,
    participantsMap = {},
    callDuration = 0,
}) => {
    const [detectedScreenShares, setDetectedScreenShares] = React.useState(new Set());
    
    // Format call duration as HH:MM:SS or MM:SS
    const formatDuration = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hrs > 0) {
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    // Helper function to get participant info by peerId
    const getParticipantInfo = (peerId) => {
        const participant = participantsMap[String(peerId)];
        return {
            username: participant?.username || "Participant",
            profilePic: participant?.profilePic || null,
        };
    };
    
    // Monitor remote streams for screen sharing detection
    useEffect(() => {
        const checkScreenShares = () => {
            const screenSharers = new Set();
            Object.entries(remoteStreams).forEach(([peerId, stream]) => {
                const isScreenShare = isRemoteScreenShare(stream);
                if (isScreenShare) {
                    screenSharers.add(peerId);
                    console.log(`[Screen Share Detection] Detected screen share from peer: ${peerId}`);
                    
                    // Log track details for debugging
                    const videoTrack = stream.getVideoTracks()[0];
                    if (videoTrack) {
                        console.log(`[Screen Share Detection] Track label: ${videoTrack.label}`);
                        const settings = videoTrack.getSettings?.();
                        if (settings) {
                            console.log(`[Screen Share Detection] Track dimensions: ${settings.width}x${settings.height}`);
                        }
                    }
                }
            });
            
            // Only update state if there's a change
            const hasChanged = screenSharers.size !== detectedScreenShares.size || 
                               Array.from(screenSharers).some(id => !detectedScreenShares.has(id));
            
            if (hasChanged) {
                console.log(`[Screen Share Detection] Updated detected screen shares:`, Array.from(screenSharers));
                setDetectedScreenShares(screenSharers);
            }
        };
        
        // Initial check
        checkScreenShares();
        
        // Recheck periodically to catch late-detected screen shares
        const interval = setInterval(checkScreenShares, 1000);
        
        return () => clearInterval(interval);
    }, [remoteStreams, detectedScreenShares]);
    
    return (
        <Dialog open={isVideoCallOpen && !isCallMinimized} onOpenChange={(open) => { if (!open) endVideoCall(); }}>
            <DialogContent fullScreen={true} showCloseButton={false} className="p-0 bg-white dark:bg-gray-900">
                <DialogHeader className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10">
                    <DialogTitle className="text-base sm:text-lg text-white">{isAudioOnly ? "Audio Call" : "Video Call"}</DialogTitle>
                    <DialogDescription className="sr-only">Video call interface</DialogDescription>
                </DialogHeader>
                {/* Call Timer */}
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 bg-black/70 px-3 py-1.5 rounded-md">
                    <p className="text-white text-sm font-medium">{formatDuration(callDuration)}</p>
                </div>
                <div className="flex flex-col h-full w-full">
                    {!isConnecting && Object.entries(remoteStreams).length === 0 ? (
                        <div className="flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white h-full w-full">
                            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-700 mb-6 flex items-center justify-center border-4 border-purple-500 shadow-2xl">
                                <Avatar className="w-full h-full">
                                    {getChatAvatar(activeChat)}
                                    <AvatarFallback className="text-4xl">
                                        {activeChat?.participant?.username?.[0] || "U"}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <p className="text-xl font-semibold mb-2">{getChatTitle(activeChat)}</p>
                            <p className="text-sm text-gray-400 mb-8">Calling...</p>
                            <div className="flex items-center gap-3 sm:gap-4">
                                {!isAudioOnly && (
                                    <div className="flex flex-col items-center gap-1.5">
                                        <button 
                                            onClick={toggleCamera} 
                                            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${cameraEnabled ? "bg-gray-700 hover:bg-gray-600 hover:scale-105" : "bg-red-500 hover:bg-red-600 hover:scale-105"}`}>
                                            {cameraEnabled ? <Video className="w-6 h-6 sm:w-7 sm:h-7 text-white" /> : <VideoOff className="w-6 h-6 sm:w-7 sm:h-7 text-white" />}
                                        </button>
                                        <span className="text-xs text-gray-400 font-medium">{cameraEnabled ? "Camera" : "Camera Off"}</span>
                                    </div>
                                )}
                                <div className="flex flex-col items-center gap-1.5">
                                    <button 
                                        onClick={toggleMic} 
                                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${micEnabled ? "bg-gray-700 hover:bg-gray-600 hover:scale-105" : "bg-red-500 hover:bg-red-600 hover:scale-105"}`}>
                                        {micEnabled ? <Mic className="w-6 h-6 sm:w-7 sm:h-7 text-white" /> : <MicOff className="w-6 h-6 sm:w-7 sm:h-7 text-white" />}
                                    </button>
                                    <span className="text-xs text-gray-400 font-medium">{micEnabled ? "Mute" : "Unmute"}</span>
                                </div>
                                {(() => {
                                    // Get candidates from the active chat room instead of the user's group
                                    const roomParticipants = Array.isArray(activeChat?.participants) ? activeChat.participants : [];
                                    const candidates = Array.isArray(group?.members) && group.members.length
                                        ? group.members.filter(m => roomParticipants.some(p => String(p._id || p.id || p) === String(m._id || m.id)))
                                        : (Array.isArray(group?.participants) ? group.participants.filter(m => roomParticipants.some(p => String(p._id || p.id || p) === String(m._id || m.id))) : []);
                                    const isGroupCall = activeChat?.type === "group" || activeChat?.type === "public";
                                    // Check if supervisor is in the room
                                    const isSupervisorInRoom = group?.supervisor?._id && roomParticipants.some(p => String(p._id || p.id || p) === String(group.supervisor._id));
                                    return isGroupCall && candidates?.length ? (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <button 
                                                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-gray-700 hover:bg-gray-600 transition-all duration-200 shadow-lg hover:scale-105">
                                                        <UserPlus className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                                                    </button>
                                                    <span className="text-xs text-gray-400 font-medium">Add</span>
                                                </div>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-56 sm:w-64 bg-gray-800 border-gray-700">
                                                <div className="space-y-1">
                                                    {candidates.filter((m) => (m._id || m.id) !== user?._id).map((m) => (
                                                        <button key={m._id || m.id} onClick={() => addParticipantToCall(m._id || m.id)} className="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded text-white hover:bg-gray-700 transition-colors">
                                                            {m.username}
                                                        </button>
                                                    ))}
                                                    {isSupervisorInRoom && (
                                                        <button onClick={() => addParticipantToCall(group.supervisor._id)} className="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded text-white hover:bg-gray-700 transition-colors">
                                                            {group.supervisor.username} (Supervisor)
                                                        </button>
                                                    )}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    ) : null;
                                })()}
                                <div className="flex flex-col items-center gap-1.5">
                                    <button 
                                        onClick={() => setIsCallMinimized(true)} 
                                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-gray-700 hover:bg-gray-600 transition-all duration-200 shadow-lg hover:scale-105">
                                        <Minimize2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                                    </button>
                                    <span className="text-xs text-gray-400 font-medium">Minimize</span>
                                </div>
                                <div className="flex flex-col items-center gap-1.5">
                                    <button 
                                        onClick={endVideoCall} 
                                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 transition-all duration-200 shadow-lg hover:scale-105">
                                        <X className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                                    </button>
                                    <span className="text-xs text-gray-400 font-medium">End Call</span>
                                </div>
                            </div>
                        </div>
                    ) : isAudioOnly ? (
                        // Audio-only interface - show avatars instead of video
                        <div className="relative h-full w-full flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
                            <div className="flex-1 flex items-center justify-center p-8">
                                <div className="flex flex-col items-center gap-8">
                                    {/* Participants avatars */}
                                    <div className="flex items-center justify-center gap-6 flex-wrap">
                                        {/* Local user avatar */}
                                        <div className="flex flex-col items-center">
                                            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-700 mb-3 flex items-center justify-center border-4 border-purple-500 shadow-lg">
                                                <Avatar className="w-full h-full">
                                                    <AvatarImage src={user?.profilePic || userImg} />
                                                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-3xl">
                                                        {user?.username?.[0]?.toUpperCase() || "Y"}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>
                                            <p className="text-white text-base font-semibold">{user?.username || "You"}</p>
                                            <div className="flex items-center gap-1 mt-2">
                                                {micEnabled ? (
                                                    <Mic className="w-4 h-4 text-green-400" />
                                                ) : (
                                                    <MicOff className="w-4 h-4 text-red-400" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Remote participants avatars */}
                                        {Object.entries(remoteStreams).map(([peerId, stream]) => {
                                            const participantInfo = getParticipantInfo(peerId);
                                            return (
                                                <div key={peerId} className="flex flex-col items-center">
                                                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-700 mb-3 flex items-center justify-center border-4 border-blue-500 shadow-lg">
                                                        <Avatar className="w-full h-full">
                                                            <AvatarImage src={participantInfo.profilePic || userImg} />
                                                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-3xl">
                                                                {participantInfo.username?.[0]?.toUpperCase() || "P"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </div>
                                                    <p className="text-white text-base font-semibold">
                                                        {participantInfo.username}
                                                    </p>
                                                    <div className="flex items-center gap-1 mt-2">
                                                        <Mic className="w-4 h-4 text-green-400" />
                                                    </div>
                                                    <audio
                                                        ref={(el) => {
                                                            if (el && stream) {
                                                                if (el.srcObject !== stream) el.srcObject = stream;
                                                                el.play().catch(() => { });
                                                            }
                                                        }}
                                                        autoPlay
                                                        playsInline
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Call status */}
                                    <div className="text-center">
                                        <p className="text-gray-400 text-sm">Audio Call in progress...</p>
                                    </div>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="p-4 sm:p-6 bg-gradient-to-t from-gray-900 via-gray-900/95 to-gray-900/90 backdrop-blur-sm">
                                <div className="flex justify-center items-center gap-3 sm:gap-4 max-w-2xl mx-auto">
                                    <div className="flex flex-col items-center gap-1.5">
                                        <button
                                            onClick={toggleMic}
                                            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${micEnabled ? "bg-gray-700 hover:bg-gray-600 hover:scale-105" : "bg-red-500 hover:bg-red-600 hover:scale-105"}`}
                                            aria-label="Toggle Mute">
                                            {micEnabled ? <Mic className="w-6 h-6 sm:w-7 sm:h-7 text-white" /> : <MicOff className="w-6 h-6 sm:w-7 sm:h-7 text-white" />}
                                        </button>
                                        <span className="text-xs text-gray-400 font-medium">{micEnabled ? "Mute" : "Unmute"}</span>
                                    </div>
                                    {(() => {
                                        // Get candidates from the active chat room instead of the user's group
                                        const roomParticipants = Array.isArray(activeChat?.participants) ? activeChat.participants : [];
                                        const candidates = Array.isArray(group?.members) && group.members.length
                                            ? group.members.filter(m => roomParticipants.some(p => String(p._id || p.id || p) === String(m._id || m.id)))
                                            : (Array.isArray(group?.participants) ? group.participants.filter(m => roomParticipants.some(p => String(p._id || p.id || p) === String(m._id || m.id))) : []);
                                        const isGroupCall = activeChat?.type === "group" || activeChat?.type === "public";
                                        // Check if supervisor is in the room
                                        const isSupervisorInRoom = group?.supervisor?._id && roomParticipants.some(p => String(p._id || p.id || p) === String(group.supervisor._id));
                                        return isGroupCall && candidates?.length ? (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <button 
                                                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-gray-700 hover:bg-gray-600 transition-all duration-200 shadow-lg hover:scale-105"
                                                            aria-label="Add Participant">
                                                            <UserPlus className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                                                        </button>
                                                        <span className="text-xs text-gray-400 font-medium">Add</span>
                                                    </div>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-56 sm:w-64 bg-gray-800 border-gray-700">
                                                    <div className="space-y-1">
                                                        {candidates.filter((m) => (m._id || m.id) !== user?._id).map((m) => (
                                                            <button key={m._id || m.id} onClick={() => addParticipantToCall(m._id || m.id)} className="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded text-white hover:bg-gray-700 transition-colors">
                                                                {m.username}
                                                            </button>
                                                        ))}
                                                        {isSupervisorInRoom && (
                                                            <button onClick={() => addParticipantToCall(group.supervisor._id)} className="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded text-white hover:bg-gray-700 transition-colors">
                                                                {group.supervisor.username} (Supervisor)
                                                            </button>
                                                        )}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        ) : null;
                                    })()}
                                    <div className="flex flex-col items-center gap-1.5">
                                        <button
                                            onClick={() => setIsCallMinimized(true)}
                                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-gray-700 hover:bg-gray-600 transition-all duration-200 shadow-lg hover:scale-105"
                                            aria-label="Minimize">
                                            <Minimize2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                                        </button>
                                        <span className="text-xs text-gray-400 font-medium">Minimize</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1.5">
                                        <button
                                            onClick={endVideoCall}
                                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 transition-all duration-200 shadow-lg hover:scale-105"
                                            aria-label="End Call">
                                            <X className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                                        </button>
                                        <span className="text-xs text-gray-400 font-medium">End Call</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Video call interface
                        <div className="relative h-full w-full flex flex-col bg-black overflow-hidden">
                            <div className="flex-1 p-2 sm:p-3 md:p-4 overflow-y-auto">
                                {Object.keys(remoteStreams).length === 1 && !maximizedPeerId ? (
                                    <div className="relative h-full">
                                        <div className="relative rounded-xl overflow-hidden bg-gray-900 h-full">
                                            <VideoPlayer
                                                videoRef={remoteVideoRef}
                                                stream={firstRemoteEntry ? firstRemoteEntry[1] : null}
                                                className="w-full h-full object-contain bg-black"
                                            />
                                            <div className="absolute bottom-2 left-2 bg-black/70 px-3 py-1.5 rounded-md text-white text-sm font-medium">
                                                {firstRemoteEntry ? getParticipantInfo(firstRemoteEntry[0]).username : "Participant"}
                                            </div>
                                        </div>
                                        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-24 sm:w-40 md:w-56 lg:w-64 aspect-video rounded-lg sm:rounded-xl overflow-hidden bg-gray-900 border border-gray-800 shadow-lg">
                                            <VideoPlayer
                                                videoRef={localVideoRef}
                                                stream={isScreenSharing ? localStream : (cameraStream || localStream)}
                                                muted
                                                className="w-full h-full object-contain bg-black"
                                            />
                                            <div className="absolute bottom-2 left-2 bg-black/70 px-3 py-1.5 rounded-md text-white text-sm font-medium">
                                                {user?.username || "You"} {isScreenSharing && "(Screen)"}
                                            </div>
                                        </div>
                                    </div>
                                ) : (() => {
                                    // Calculate total participants
                                    const totalParticipants = Object.keys(remoteStreams).length + 1; // +1 for local
                                    
                                    // Detect if anyone is screen sharing
                                    const localSharing = isScreenSharing;
                                    const remoteSharerPeerId = Array.from(detectedScreenShares)[0]; // Get first detected screen sharer
                                    
                                    // Apply split layout if: 3-4 participants, someone is sharing, and no manual maximize
                                    const useSplitLayout = !maximizedPeerId && (totalParticipants === 3 || totalParticipants === 4) && (localSharing || remoteSharerPeerId);
                                    
                                    if (useSplitLayout) {
                                        // Split layout: shared screen large, others stacked
                                        return (
                                            <div className="flex flex-col md:flex-row gap-2 sm:gap-3 md:gap-4 h-full">
                                                {/* Large shared screen tile */}
                                                <div className="flex-[2] flex items-center justify-center min-h-[60%] md:min-h-0">
                                                    {localSharing ? (
                                                        <div className="relative rounded-xl overflow-hidden bg-gray-900 w-full h-full">
                                                            <VideoPlayer
                                                                videoRef={localVideoRef}
                                                                stream={localStream}
                                                                muted
                                                                className="w-full h-full object-contain bg-black"
                                                            />
                                                            <div className="absolute bottom-2 left-2 bg-black/70 px-3 py-1.5 rounded-md text-white text-sm font-medium">
                                                                {user?.username || "You"} (Screen)
                                                            </div>
                                                            <button
                                                                onClick={() => setMaximizedPeerId('local')}
                                                                className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors"
                                                            >
                                                                <div className="w-4 h-4 border-2 border-white rounded-sm" />
                                                            </button>
                                                        </div>
                                                    ) : remoteSharerPeerId ? (
                                                        <div className="relative rounded-xl overflow-hidden bg-gray-900 w-full h-full">
                                                            <VideoPlayer
                                                                stream={remoteStreams[remoteSharerPeerId]}
                                                                className="w-full h-full object-contain bg-black"
                                                            />
                                                            <div className="absolute bottom-2 left-2 bg-black/70 px-3 py-1.5 rounded-md text-white text-sm font-medium">
                                                                {getParticipantInfo(remoteSharerPeerId).username} (Screen)
                                                            </div>
                                                            <button
                                                                onClick={() => setMaximizedPeerId(remoteSharerPeerId)}
                                                                className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors"
                                                            >
                                                                <div className="w-4 h-4 border-2 border-white rounded-sm" />
                                                            </button>
                                                        </div>
                                                    ) : null}
                                                </div>
                                                
                                                {/* Small tiles column for other participants */}
                                                <div className="flex-[1] flex flex-row md:flex-col gap-2 sm:gap-3 md:gap-4 overflow-x-auto md:overflow-x-hidden">
                                                    {!localSharing && (
                                                        <div className="relative rounded-lg sm:rounded-xl overflow-hidden bg-gray-900 flex-shrink-0 w-32 sm:w-40 md:w-full md:flex-1 aspect-video md:aspect-auto">
                                                            <VideoPlayer
                                                                videoRef={localVideoRef}
                                                                stream={cameraStream || localStream}
                                                                muted
                                                                className="w-full h-full object-contain bg-black"
                                                            />
                                                            <div className="absolute bottom-2 left-2 bg-black/70 px-3 py-1.5 rounded-md text-white text-sm font-medium">
                                                                {user?.username || "You"}
                                                            </div>
                                                            <button
                                                                onClick={() => setMaximizedPeerId('local')}
                                                                className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors"
                                                            >
                                                                <div className="w-4 h-4 border-2 border-white rounded-sm" />
                                                            </button>
                                                        </div>
                                                    )}
                                                    {Object.entries(remoteStreams).map(([peerId, stream]) => {
                                                        // Skip the remote sharer in the small tiles column
                                                        if (peerId === remoteSharerPeerId) return null;
                                                        
                                                        return (
                                                            <div key={peerId} className="relative rounded-lg sm:rounded-xl overflow-hidden bg-gray-900 flex-shrink-0 w-32 sm:w-40 md:w-full md:flex-1 aspect-video md:aspect-auto">
                                                                <VideoPlayer
                                                                    stream={stream}
                                                                    className="w-full h-full object-contain bg-black"
                                                                />
                                                                <div className="absolute bottom-2 left-2 bg-black/70 px-3 py-1.5 rounded-md text-white text-sm font-medium">
                                                                    {getParticipantInfo(peerId).username}
                                                                </div>
                                                                <button
                                                                    onClick={() => setMaximizedPeerId(peerId)}
                                                                    className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors"
                                                                >
                                                                    <div className="w-4 h-4 border-2 border-white rounded-sm" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    }
                                    
                                    // Default grid layout
                                    return (
                                        <div className={`grid gap-2 sm:gap-3 md:gap-4 h-full ${maximizedPeerId ? 'grid-cols-1' :
                                            Object.keys(remoteStreams).length === 0 ? 'grid-cols-1' :
                                                Object.keys(remoteStreams).length === 1 ? 'grid-cols-1 md:grid-cols-2' :
                                                    Object.keys(remoteStreams).length <= 3 ? 'grid-cols-1 sm:grid-cols-2' :
                                                        'grid-cols-2 lg:grid-cols-3'
                                            }${((Object.keys(remoteStreams).length + 1) >= 3 && (Object.keys(remoteStreams).length + 1) <= 4) ? ' sm:grid-cols-2 sm:grid-rows-2' : ''}`}> 
                                            <div className={`relative rounded-lg sm:rounded-xl overflow-hidden bg-gray-900 h-full ${maximizedPeerId === 'local' ? 'fixed inset-2 sm:inset-4 z-50' : maximizedPeerId ? 'hidden' : ''}`}>
                                                <VideoPlayer
                                                    videoRef={localVideoRef}
                                                    stream={isScreenSharing ? localStream : (cameraStream || localStream)}
                                                    muted
                                                    className="w-full h-full object-contain bg-black"
                                                />
                                                <div className="absolute bottom-2 left-2 bg-black/70 px-3 py-1.5 rounded-md text-white text-sm font-medium">
                                                    {user?.username || "You"} {isScreenSharing && "(Screen)"}
                                                </div>
                                                <button
                                                    onClick={() => setMaximizedPeerId(maximizedPeerId === 'local' ? null : 'local')}
                                                    className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors"
                                                >
                                                    {maximizedPeerId === 'local' ? <X className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-white rounded-sm" />}
                                                </button>
                                            </div>
                                            {Object.entries(remoteStreams).map(([peerId, stream]) => (
                                                <div key={peerId} className={`relative rounded-lg sm:rounded-xl overflow-hidden bg-gray-900 h-full ${maximizedPeerId === peerId ? 'fixed inset-2 sm:inset-4 z-50' : maximizedPeerId ? 'hidden' : ''}`}>
                                                    <VideoPlayer
                                                        stream={stream}
                                                        className="w-full h-full object-contain bg-black"
                                                    />
                                                    <div className="absolute bottom-2 left-2 bg-black/70 px-3 py-1.5 rounded-md text-white text-sm font-medium">
                                                        {getParticipantInfo(peerId).username} {detectedScreenShares.has(peerId) && "(Screen)"}
                                                    </div>
                                                    <button
                                                        onClick={() => setMaximizedPeerId(maximizedPeerId === peerId ? null : peerId)}
                                                        className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors"
                                                    >
                                                        {maximizedPeerId === peerId ? <X className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-white rounded-sm" />}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Controls */}
                            <div className="p-4 sm:p-6 bg-gradient-to-t from-gray-900 via-gray-900/95 to-gray-900/90 backdrop-blur-sm">
                                <div className="flex justify-center items-center gap-3 sm:gap-4 max-w-2xl mx-auto">
                                    {!isAudioOnly && (
                                        <div className="flex flex-col items-center gap-1.5">
                                            <button
                                                onClick={toggleCamera}
                                                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${cameraEnabled ? "bg-gray-700 hover:bg-gray-600 hover:scale-105" : "bg-red-500 hover:bg-red-600 hover:scale-105"}`}
                                                aria-label="Toggle Video">
                                                {cameraEnabled ? <Video className="w-6 h-6 sm:w-7 sm:h-7 text-white" /> : <VideoOff className="w-6 h-6 sm:w-7 sm:h-7 text-white" />}
                                            </button>
                                            <span className="text-xs text-gray-400 font-medium">{cameraEnabled ? "Camera" : "Camera Off"}</span>
                                        </div>
                                    )}
                                    <div className="flex flex-col items-center gap-1.5">
                                        <button
                                            onClick={toggleMic}
                                            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${micEnabled ? "bg-gray-700 hover:bg-gray-600 hover:scale-105" : "bg-red-500 hover:bg-red-600 hover:scale-105"}`}
                                            aria-label="Toggle Mute">
                                            {micEnabled ? <Mic className="w-6 h-6 sm:w-7 sm:h-7 text-white" /> : <MicOff className="w-6 h-6 sm:w-7 sm:h-7 text-white" />}
                                        </button>
                                        <span className="text-xs text-gray-400 font-medium">{micEnabled ? "Mute" : "Unmute"}</span>
                                    </div>
                                    {!isAudioOnly && (
                                        <div className="flex flex-col items-center gap-1.5">
                                            <button
                                                onClick={toggleScreenShare}
                                                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${isScreenSharing ? "bg-blue-600 hover:bg-blue-700 hover:scale-105" : "bg-gray-700 hover:bg-gray-600 hover:scale-105"}`}
                                                aria-label="Share Screen">
                                                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                            <span className="text-xs text-gray-400 font-medium">{isScreenSharing ? "Stop Share" : "Share"}</span>
                                        </div>
                                    )}
                                    {(() => {
                                        // Get candidates from the active chat room instead of the user's group
                                        const roomParticipants = Array.isArray(activeChat?.participants) ? activeChat.participants : [];
                                        const candidates = Array.isArray(group?.members) && group.members.length
                                            ? group.members.filter(m => roomParticipants.some(p => String(p._id || p.id || p) === String(m._id || m.id)))
                                            : (Array.isArray(group?.participants) ? group.participants.filter(m => roomParticipants.some(p => String(p._id || p.id || p) === String(m._id || m.id))) : []);
                                        const isGroupCall = activeChat?.type === "group" || activeChat?.type === "public";
                                        // Check if supervisor is in the room
                                        const isSupervisorInRoom = group?.supervisor?._id && roomParticipants.some(p => String(p._id || p.id || p) === String(group.supervisor._id));
                                        return isGroupCall && candidates?.length ? (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <button 
                                                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-gray-700 hover:bg-gray-600 transition-all duration-200 shadow-lg hover:scale-105"
                                                            aria-label="Add Participant">
                                                            <UserPlus className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                                                        </button>
                                                        <span className="text-xs text-gray-400 font-medium">Add</span>
                                                    </div>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-56 sm:w-64 bg-gray-800 border-gray-700">
                                                    <div className="space-y-1">
                                                        {candidates.filter((m) => (m._id || m.id) !== user?._id).map((m) => (
                                                            <button key={m._id || m.id} onClick={() => addParticipantToCall(m._id || m.id)} className="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded text-white hover:bg-gray-700 transition-colors">
                                                                {m.username}
                                                            </button>
                                                        ))}
                                                        {isSupervisorInRoom && (
                                                            <button onClick={() => addParticipantToCall(group.supervisor._id)} className="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded text-white hover:bg-gray-700 transition-colors">
                                                                {group.supervisor.username} (Supervisor)
                                                            </button>
                                                        )}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        ) : null;
                                    })()}
                                    <div className="flex flex-col items-center gap-1.5">
                                        <button
                                            onClick={() => setIsCallMinimized(true)}
                                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-gray-700 hover:bg-gray-600 transition-all duration-200 shadow-lg hover:scale-105"
                                            aria-label="Minimize">
                                            <Minimize2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                                        </button>
                                        <span className="text-xs text-gray-400 font-medium">Minimize</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1.5">
                                        <button
                                            onClick={endVideoCall}
                                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 transition-all duration-200 shadow-lg hover:scale-105"
                                            aria-label="End Call">
                                            <X className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                                        </button>
                                        <span className="text-xs text-gray-400 font-medium">End Call</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </DialogContent>
        </Dialog>
    );
};

// Minimized Call Popup Component
export const MinimizedCallPopup = ({
    isVideoCallOpen,
    isCallMinimized,
    setIsCallMinimized,
    endVideoCall,
    isAudioOnly,
    activeChat,
    getChatAvatar,
    getChatTitle,
    localVideoRef,
    localStream,
    cameraStream,
    isScreenSharing,
    micEnabled,
    toggleMic,
    remoteStreams,
    callDuration = 0,
}) => {
    if (!isVideoCallOpen || !isCallMinimized) return null;

    const firstRemoteEntry = Object.entries(remoteStreams)[0] || null;
    
    // Format call duration as MM:SS
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div 
            className="fixed bottom-4 right-4 z-50 bg-gray-900 rounded-2xl shadow-2xl border-2 border-gray-700 overflow-hidden cursor-pointer transition-transform hover:scale-105"
            style={{ width: '320px', height: isAudioOnly ? '120px' : '240px' }}
            onClick={() => setIsCallMinimized(false)}
        >
            {isAudioOnly ? (
                // Audio call minimized view
                <div className="w-full h-full flex items-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center border-2 border-blue-500">
                            <Avatar className="w-full h-full">
                                {getChatAvatar(activeChat)}
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                                    {activeChat?.participant?.username?.[0]?.toUpperCase() || "P"}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="flex-1">
                            <p className="text-white font-medium text-sm">{getChatTitle(activeChat)}</p>
                            <p className="text-gray-400 text-xs">{formatDuration(callDuration)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMic();
                                }}
                                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${micEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-500 hover:bg-red-600"}`}
                            >
                                {micEnabled ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-white" />}
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    endVideoCall();
                                }}
                                className="w-9 h-9 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 transition-all duration-200 shadow-md"
                            >
                                <X className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                // Video call minimized view
                <div className="relative w-full h-full">
                    {/* Remote video or placeholder */}
                    {firstRemoteEntry ? (
                        <video
                            ref={(el) => {
                                if (el && firstRemoteEntry[1]) {
                                    if (el.srcObject !== firstRemoteEntry[1]) el.srcObject = firstRemoteEntry[1];
                                    el.play().catch(() => { });
                                }
                            }}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <Avatar className="w-16 h-16">
                                {getChatAvatar(activeChat)}
                                <AvatarFallback>
                                    {activeChat?.participant?.username?.[0] || "U"}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    )}
                    
                    {/* Local video preview (small) */}
                    <div className="absolute top-2 right-2 w-16 h-16 rounded-lg overflow-hidden bg-gray-900 border border-gray-700">
                        <video
                            ref={(el) => {
                                if (el) {
                                    const stream = isScreenSharing ? localStream : (cameraStream || localStream);
                                    if (stream && el.srcObject !== stream) {
                                        el.srcObject = stream;
                                        el.play().catch(() => { });
                                    }
                                }
                            }}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                    </div>
                    
                    {/* Call Timer */}
                    <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded-md">
                        <p className="text-white text-xs font-medium">{formatDuration(callDuration)}</p>
                    </div>
                    
                    {/* Controls overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMic();
                                }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${micEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-500 hover:bg-red-600"}`}
                            >
                                {micEnabled ? <Mic className="w-3.5 h-3.5 text-white" /> : <MicOff className="w-3.5 h-3.5 text-white" />}
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    endVideoCall();
                                }}
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 transition-all duration-200 shadow-md"
                            >
                                <X className="w-3.5 h-3.5 text-white" />
                            </button>
                        </div>
                        <p className="text-white text-xs font-semibold truncate max-w-[120px]">{getChatTitle(activeChat)}</p>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsCallMinimized(false);
                            }}
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-700 hover:bg-gray-600 transition-all duration-200 shadow-md"
                        >
                            <Maximize2 className="w-3.5 h-3.5 text-white" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoCallDialog;
