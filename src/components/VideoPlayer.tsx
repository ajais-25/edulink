"use client";

import { useEffect, useState, useCallback, useRef, createElement } from "react";
const ReactPlayer = require("react-player").default;
import { useVideoProgress } from "@/hooks/useVideoProgress";
import { Loader2 } from "lucide-react";

interface VideoPlayerProps {
  videoUrl: string;
  courseId: string;
  moduleId: string;
  lessonId: string;
  videoDuration: number;
  onComplete?: () => void;
}

export default function VideoPlayer({
  videoUrl,
  courseId,
  moduleId,
  lessonId,
  videoDuration,
  onComplete,
}: VideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasSeekToInitial, setHasSeekToInitial] = useState(false);
  const [mounted, setMounted] = useState(false);

  const {
    isLoading,
    initialPosition,
    progress,
    currentPositionRef,
    watchedDurationRef,
    totalDurationRef,
    handlePlay,
    handlePause,
    handleEnded,
    handleSeek,
  } = useVideoProgress({
    courseId,
    moduleId,
    lessonId,
    videoDuration,
    onComplete,
    saveInterval: 10,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (
      isReady &&
      !isLoading &&
      initialPosition > 0 &&
      !hasSeekToInitial &&
      playerRef.current
    ) {
      if (!progress?.isCompleted && initialPosition < videoDuration - 5) {
        playerRef.current.currentTime = initialPosition;
      }
      setHasSeekToInitial(true);
    }
  }, [
    isReady,
    isLoading,
    initialPosition,
    hasSeekToInitial,
    progress?.isCompleted,
    videoDuration,
  ]);

  useEffect(() => {
    setHasSeekToInitial(false);
    setIsReady(false);
  }, [lessonId]);

  const handleReady = useCallback(() => {
    setIsReady(true);
    console.log("Video player ready, URL:", videoUrl);
  }, [videoUrl]);

  const onTimeUpdateHandler = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    const currentTime = player.currentTime;
    currentPositionRef.current = currentTime;

    if (currentTime > watchedDurationRef.current) {
      watchedDurationRef.current = currentTime;
    }
  }, [currentPositionRef, watchedDurationRef]);

  const onDurationChangeHandler = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    const duration = player.duration;
    console.log("onDurationChange called:", duration);
    totalDurationRef.current = duration;
  }, [totalDurationRef]);

  const onSeekedHandler = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    const currentTime = player.currentTime;
    handleSeek(currentTime);
  }, [handleSeek]);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="flex items-center gap-2 text-white">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading progress...</span>
          </div>
        </div>
      )}

      {createElement(ReactPlayer, {
        ref: playerRef,
        src: videoUrl,
        width: "100%",
        height: "100%",
        controls: true,
        onReady: handleReady,
        onTimeUpdate: onTimeUpdateHandler,
        onDurationChange: onDurationChangeHandler,
        onPlay: handlePlay,
        onPause: handlePause,
        onEnded: handleEnded,
        onSeeked: onSeekedHandler,
        onError: (error: unknown) => {
          console.error("Video player error:", error, "URL:", videoUrl);
        },
      })}
    </div>
  );
}
