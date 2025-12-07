import React, { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PhoneOff, Phone, Video } from "lucide-react";

const IncomingCallDialog = ({
    incomingCall,
    setIncomingCall,
    acceptRing,
    declineRing,
    getChatAvatar,
    getChatTitle,
}) => {
    const ringtoneRef = useRef(null);

    useEffect(() => {
        if (incomingCall && ringtoneRef.current) {
            // Play ringtone when incoming call
            ringtoneRef.current.play().catch(err => {
                console.log("Could not play ringtone:", err);
            });
        } else if (!incomingCall && ringtoneRef.current) {
            // Stop ringtone when call ends or is accepted/declined
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
        }

        return () => {
            if (ringtoneRef.current) {
                ringtoneRef.current.pause();
                ringtoneRef.current.currentTime = 0;
            }
        };
    }, [incomingCall]);

    const handleAccept = () => {
        if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
        }
        acceptRing(incomingCall?.from, incomingCall?.roomKey, incomingCall?.isAudioOnly);
    };

    const handleDecline = () => {
        if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
        }
        declineRing(incomingCall?.from, incomingCall?.roomKey);
    };

    return (
        <>
            <audio
                ref={ringtoneRef}
                loop
                preload="auto"
            >
                <source src="https://www.soundjay.com/phone/sounds/telephone-ring-04.mp3" type="audio/mpeg" />
            </audio>
            <Dialog open={!!incomingCall} onOpenChange={(open) => { 
                if (!open) {
                    if (ringtoneRef.current) {
                        ringtoneRef.current.pause();
                        ringtoneRef.current.currentTime = 0;
                    }
                    setIncomingCall(null); 
                }
            }}>
                <DialogContent className="w-[90%] max-w-[380px] sm:max-w-md rounded-3xl bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-2 border-gray-200 dark:border-gray-700 shadow-2xl">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Incoming Call</DialogTitle>
                        <DialogDescription>Incoming {incomingCall?.isAudioOnly ? 'audio' : 'video'} call from {getChatTitle(incomingCall?.chat)}</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center py-6 sm:py-8 px-4 sm:px-6">
                        {/* Call type indicator */}
                        <div className="mb-4">
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${incomingCall?.isAudioOnly ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                                {incomingCall?.isAudioOnly ? (
                                    <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                                ) : (
                                    <Video className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                )}
                                <span className={`text-sm font-medium ${incomingCall?.isAudioOnly ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'}`}>
                                    {incomingCall?.isAudioOnly ? 'Audio Call' : 'Video Call'}
                                </span>
                            </div>
                        </div>

                        {/* Avatar with pulse animation */}
                        <div className="relative mb-6">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-ping opacity-20"></div>
                            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 p-1 shadow-2xl">
                                <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-gray-800">
                                    <Avatar className="w-full h-full">
                                        {getChatAvatar(incomingCall?.chat)}
                                        <AvatarFallback className="text-3xl bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                                            {incomingCall?.chat?.participant?.username?.[0]?.toUpperCase() || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            </div>
                        </div>

                        {/* Caller info */}
                        <h3 className="text-xl sm:text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">
                            {getChatTitle(incomingCall?.chat) || "Incoming Call"}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8 animate-pulse">
                            Calling...
                        </p>

                        {/* Action buttons */}
                        <div className="flex items-center gap-6 sm:gap-8">
                            <div className="flex flex-col items-center gap-2">
                                <button 
                                    onClick={handleDecline} 
                                    className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-red-600 hover:bg-red-700 transition-all duration-200 flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95"
                                    aria-label="Decline call"
                                >
                                    <PhoneOff className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                                </button>
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Decline</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <button 
                                    onClick={handleAccept} 
                                    className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-green-600 hover:bg-green-700 transition-all duration-200 flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 animate-pulse"
                                    aria-label="Accept call"
                                >
                                    <Phone className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                                </button>
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Accept</span>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default IncomingCallDialog;
