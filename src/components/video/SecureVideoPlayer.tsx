import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, Loader2 } from "lucide-react";

interface SecureVideoPlayerProps {
  videoUrl: string;
  title?: string;
  onProgress?: (currentTime: number, duration: number) => void;
}

const SecureVideoPlayer = ({ videoUrl, title, onProgress }: SecureVideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCenterPlay, setShowCenterPlay] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if YouTube video
  const isYouTube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
  
  // Check if Supabase storage video
  const isSupabaseVideo = videoUrl.includes("supabase.co/storage");

  const getYouTubeId = (url: string) => {
    if (url.includes("youtu.be")) {
      return url.split("/").pop()?.split("?")[0];
    }
    return url.split("v=")[1]?.split("&")[0];
  };

  const getYouTubeEmbed = (url: string) => {
    const videoId = getYouTubeId(url);
    return `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0&controls=0&disablekb=1&fs=0&iv_load_policy=3&loop=0&playsinline=1&enablejsapi=1`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
      setShowCenterPlay(false);
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    if (onProgress) {
      onProgress(videoRef.current.currentTime, videoRef.current.duration);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setIsLoading(false);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = percent * duration;
  };

  const handleVolumeToggle = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    videoRef.current.muted = newMuted;
  };

  const skipForward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration);
  };

  const skipBackward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    if (isYouTube) {
      const timer = setTimeout(() => setIsLoading(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isYouTube]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl group select-none"
      onContextMenu={handleContextMenu}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      style={{ 
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      }}
    >
      {/* Teal Gradient Background - matching reference */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2d6b6b] to-[#1a4a4a]" />

      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-[#1a4a4a] z-30"
          >
            <Loader2 className="w-12 h-12 text-[#ff6b35] animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Supabase Storage Video */}
      {isSupabaseVideo && (
        <video
          ref={videoRef}
          src={videoUrl}
          className="absolute inset-0 w-full h-full object-contain z-10"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            setShowCenterPlay(true);
          }}
          controlsList="nodownload nofullscreen noremoteplayback"
          disablePictureInPicture
          playsInline
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* YouTube iframe with protection */}
      {isYouTube && (
        <div className="absolute inset-0 z-10">
          <iframe
            src={getYouTubeEmbed(videoUrl)}
            className="w-full h-full pointer-events-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            style={{ border: 'none', pointerEvents: 'none' }}
          />
          <div 
            className="absolute inset-0 z-10 cursor-pointer" 
            onClick={() => setShowCenterPlay(!showCenterPlay)}
            onContextMenu={handleContextMenu}
          />
        </div>
      )}

      {/* Center Play Button - Orange/Red like reference */}
      <AnimatePresence>
        {showCenterPlay && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center z-20"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#ff6b35] to-[#e55a2b] hover:from-[#ff7a4d] hover:to-[#ff6b35] rounded-full flex items-center justify-center shadow-xl shadow-[#ff6b35]/30 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                if (isSupabaseVideo) {
                  togglePlay();
                } else {
                  setShowCenterPlay(false);
                }
              }}
            >
              <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white ml-1" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click area to toggle play/pause */}
      {isSupabaseVideo && !showCenterPlay && (
        <div 
          className="absolute inset-0 z-15 cursor-pointer"
          onClick={togglePlay}
        />
      )}

      {/* Bottom Controls Bar */}
      <AnimatePresence>
        {(showControls || !isPlaying) && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 left-0 right-0 z-30"
          >
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            
            <div className="relative px-4 pb-4 pt-8">
              {/* Progress Bar - Red like reference */}
              <div 
                className="mb-3 cursor-pointer group/progress"
                onClick={isSupabaseVideo ? handleSeek : undefined}
              >
                <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden group-hover/progress:h-2 transition-all">
                  <motion.div 
                    className="h-full bg-[#ff3333] rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    className="text-white hover:text-[#ff6b35] transition-colors"
                    onClick={togglePlay}
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6 fill-white" />
                    )}
                  </button>
                  <button 
                    className="text-white hover:text-[#ff6b35] transition-colors"
                    onClick={skipBackward}
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>
                  <button 
                    className="text-white hover:text-[#ff6b35] transition-colors"
                    onClick={skipForward}
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-2 ml-2">
                    <button 
                      className="text-white hover:text-[#ff6b35] transition-colors"
                      onClick={handleVolumeToggle}
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </button>
                    {/* Red dot indicator */}
                    <div className="w-2 h-2 bg-[#ff3333] rounded-full animate-pulse" />
                  </div>
                  <span className="text-white text-sm font-medium ml-2">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <button 
                  className="text-white hover:text-[#ff6b35] transition-colors"
                  onClick={toggleFullscreen}
                >
                  <Maximize className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invisible overlay to prevent link copying */}
      <div 
        className="absolute inset-0 z-[5]" 
        onContextMenu={handleContextMenu}
        style={{ pointerEvents: 'none' }}
      />
    </motion.div>
  );
};

export default SecureVideoPlayer;
