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
  const [canPlay, setCanPlay] = useState(false);
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
    console.log("Seek effect running:", {
      canPlay,
      isLoading,
      initialPosition,
      hasSeekToInitial,
      hasPlayerRef: !!playerRef.current,
      isCompleted: progress?.isCompleted,
      videoDuration,
    });

    if (
      canPlay &&
      !isLoading &&
      initialPosition > 0 &&
      !hasSeekToInitial &&
      playerRef.current
    ) {
      // Seek to initial position (allow even for completed videos so user can resume)
      console.log("Attempting to seek to:", initialPosition);
      console.log(
        "Player ref currentTime before:",
        playerRef.current.currentTime
      );
      playerRef.current.currentTime = initialPosition;
      console.log(
        "Player ref currentTime after:",
        playerRef.current.currentTime
      );
      setHasSeekToInitial(true);
    }
  }, [
    canPlay,
    isLoading,
    initialPosition,
    hasSeekToInitial,
    progress?.isCompleted,
    videoDuration,
  ]);

  useEffect(() => {
    setHasSeekToInitial(false);
    setIsReady(false);
    setCanPlay(false);
  }, [lessonId]);

  const handleReady = useCallback(() => {
    setIsReady(true);
    console.log("Video player ready, URL:", videoUrl);
  }, [videoUrl]);

  const handleCanPlay = useCallback(() => {
    setCanPlay(true);
    console.log("Video can play, URL:", videoUrl);

    // Try to seek here as a backup if progress is already loaded
    if (
      !isLoading &&
      initialPosition > 0 &&
      !hasSeekToInitial &&
      playerRef.current
    ) {
      console.log("Seeking in onCanPlay handler to:", initialPosition);
      playerRef.current.currentTime = initialPosition;
      setHasSeekToInitial(true);
    }
  }, [videoUrl, isLoading, initialPosition, hasSeekToInitial]);

  const handleLoadedMetadata = useCallback(() => {
    console.log(
      "Video metadata loaded, duration:",
      playerRef.current?.duration
    );
  }, []);

  const onTimeUpdateHandler = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    const currentTime = player.currentTime;
    if (typeof currentTime !== "number" || isNaN(currentTime)) return;

    currentPositionRef.current = currentTime;

    if (currentTime > watchedDurationRef.current) {
      watchedDurationRef.current = currentTime;
    }
  }, [currentPositionRef, watchedDurationRef]);

  const onDurationChangeHandler = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    const duration = player.duration;
    if (typeof duration !== "number" || isNaN(duration)) return;

    console.log("onDurationChange called:", duration);
    totalDurationRef.current = duration;
  }, [totalDurationRef]);

  const onSeekedHandler = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    const currentTime = player.currentTime;
    if (typeof currentTime !== "number" || isNaN(currentTime)) return;

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
        preload: "auto",
        onReady: handleReady,
        onCanPlay: handleCanPlay,
        onLoadedMetadata: handleLoadedMetadata,
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
