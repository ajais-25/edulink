import { useCallback, useRef, useState, useEffect } from "react";
import api from "@/lib/axios";

interface VideoProgress {
  watchedDuration: number;
  totalDuration: number;
  lastWatchedPosition: number;
  isCompleted: boolean;
}

interface UseVideoProgressOptions {
  courseId: string;
  moduleId: string;
  lessonId: string;
  videoDuration: number;
  onComplete?: () => void;
  saveInterval?: number;
}

interface UseVideoProgressReturn {
  isLoading: boolean;
  isSaving: boolean;
  initialPosition: number;
  progress: VideoProgress | null;

  currentPositionRef: React.RefObject<number>;
  watchedDurationRef: React.RefObject<number>;
  totalDurationRef: React.RefObject<number>;

  handlePlay: () => void;
  handlePause: () => void;
  handleEnded: () => void;
  handleSeek: (seekedTime: number) => void;
  saveProgress: () => Promise<void>;
}

export function useVideoProgress({
  courseId,
  moduleId,
  lessonId,
  videoDuration,
  onComplete,
  saveInterval = 10,
}: UseVideoProgressOptions): UseVideoProgressReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [initialPosition, setInitialPosition] = useState(0);
  const [progress, setProgress] = useState<VideoProgress | null>(null);

  const currentPositionRef = useRef(0);
  const watchedDurationRef = useRef(0);
  const totalDurationRef = useRef(videoDuration);
  const lastSaveTimeRef = useRef(0);
  const isPlayingRef = useRef(false);
  const hasCompletedRef = useRef(false);
  const saveIntervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  useEffect(() => {
    currentPositionRef.current = 0;
    watchedDurationRef.current = 0;
    totalDurationRef.current = videoDuration;
    lastSaveTimeRef.current = 0;
    isPlayingRef.current = false;
    hasCompletedRef.current = false;
    isSavingRef.current = false;
    setInitialPosition(0);
    setProgress(null);

    if (saveIntervalIdRef.current) {
      clearInterval(saveIntervalIdRef.current);
      saveIntervalIdRef.current = null;
    }

    const fetchProgress = async () => {
      if (!courseId || !moduleId || !lessonId) return;

      try {
        setIsLoading(true);
        const res = await api.get(
          `/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/video-progress`
        );

        if (res.data.success && res.data.data) {
          const videoProgress = res.data.data;
          console.log("Fetched video progress:", videoProgress);
          console.log(
            "Setting initialPosition to:",
            videoProgress.lastWatchedPosition || 0
          );
          setInitialPosition(videoProgress.lastWatchedPosition || 0);
          watchedDurationRef.current = videoProgress.watchedDuration || 0;
          currentPositionRef.current = videoProgress.lastWatchedPosition || 0;
          hasCompletedRef.current = videoProgress.isCompleted || false;

          setProgress({
            watchedDuration: videoProgress.watchedDuration,
            totalDuration: videoProgress.totalDuration,
            lastWatchedPosition: videoProgress.lastWatchedPosition,
            isCompleted: videoProgress.isCompleted || false,
          });
        }
      } catch (error: any) {
        if (error.response?.status !== 404) {
          console.error("Error fetching video progress:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();

    return () => {
      if (saveIntervalIdRef.current) {
        clearInterval(saveIntervalIdRef.current);
      }
    };
  }, [courseId, moduleId, lessonId]);

  const saveProgress = useCallback(async () => {
    if (!courseId || !moduleId || !lessonId) return;
    if (isSavingRef.current) return;

    const currentWatched = watchedDurationRef.current;
    const currentPosition = currentPositionRef.current;
    const duration = totalDurationRef.current;

    if (currentWatched <= 0 || duration <= 0) return;

    try {
      isSavingRef.current = true;
      const res = await api.patch(
        `/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/video-progress`,
        {
          watchedDuration: Math.round(currentWatched),
          lastWatchedPosition: Math.round(currentPosition),
          totalDuration: Math.round(duration),
        }
      );

      if (res.data.success) {
        lastSaveTimeRef.current = Date.now();

        if (res.data.data.isCompleted && !hasCompletedRef.current) {
          hasCompletedRef.current = true;
          onComplete?.();
        }

        setProgress({
          watchedDuration: currentWatched,
          totalDuration: duration,
          lastWatchedPosition: currentPosition,
          isCompleted: res.data.data.isCompleted,
        });
      }
    } catch (error) {
      console.error("Error saving video progress:", error);
    } finally {
      isSavingRef.current = false;
    }
  }, [courseId, moduleId, lessonId, onComplete]);

  const handlePlay = useCallback(() => {
    isPlayingRef.current = true;

    if (!saveIntervalIdRef.current) {
      saveIntervalIdRef.current = setInterval(() => {
        if (isPlayingRef.current) {
          saveProgress();
        }
      }, saveInterval * 1000);
    }
  }, [saveProgress, saveInterval]);

  const handlePause = useCallback(() => {
    isPlayingRef.current = false;

    if (saveIntervalIdRef.current) {
      clearInterval(saveIntervalIdRef.current);
      saveIntervalIdRef.current = null;
    }

    saveProgress();
  }, [saveProgress]);

  const handleEnded = useCallback(() => {
    isPlayingRef.current = false;

    if (saveIntervalIdRef.current) {
      clearInterval(saveIntervalIdRef.current);
      saveIntervalIdRef.current = null;
    }

    watchedDurationRef.current = totalDurationRef.current;

    saveProgress();
  }, [saveProgress]);

  const handleSeek = useCallback(
    (seekedTime: number) => {
      currentPositionRef.current = seekedTime;

      // Update watched duration if user seeks beyond current watched point
      if (seekedTime > watchedDurationRef.current) {
        watchedDurationRef.current = seekedTime;
      }

      // Save progress immediately when user seeks
      saveProgress();
    },
    [saveProgress]
  );

  return {
    isLoading,
    isSaving,
    initialPosition,
    progress,
    currentPositionRef,
    watchedDurationRef,
    totalDurationRef,
    handlePlay,
    handlePause,
    handleEnded,
    handleSeek,
    saveProgress,
  };
}
