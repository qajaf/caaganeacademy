import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";

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
  const [showPlayButton, setShowPlayButton] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if YouTube video
  const isYouTube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
  
  const getYouTubeId = (url: string) => {
    if (url.includes("youtu.be")) {
      return url.split("/").pop()?.split("?")[0];
    }
    return url.split("v=")[1]?.split("&")[0];
  };

  const getYouTubeEmbed = (url: string) => {
    const videoId = getYouTubeId(url);
    // Remove controls, disable keyboard, hide info, loop, modestbranding, disable related videos
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

  // Prevent right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  useEffect(() => {
    // Hide loading after a delay for YouTube
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
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(185,50%,25%)] to-[hsl(185,50%,15%)]" />
      
      {/* Decorative animated corners */}
      <motion.div
        className="absolute top-0 left-0 w-16 h-16 md:w-24 md:h-24 border-t-4 border-l-4 border-primary/60 rounded-tl-2xl z-20 pointer-events-none"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      />
      <motion.div
        className="absolute top-0 right-0 w-16 h-16 md:w-24 md:h-24 border-t-4 border-r-4 border-[hsl(16,85%,55%)]/60 rounded-tr-2xl z-20 pointer-events-none"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-16 h-16 md:w-24 md:h-24 border-b-4 border-l-4 border-[hsl(16,85%,55%)]/60 rounded-bl-2xl z-20 pointer-events-none"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-16 h-16 md:w-24 md:h-24 border-b-4 border-r-4 border-primary/60 rounded-br-2xl z-20 pointer-events-none"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      />

      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-[hsl(185,50%,20%)] z-30"
          >
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* YouTube iframe with protection */}
      {isYouTube && (
        <div className="absolute inset-0 z-10">
          <iframe
            src={getYouTubeEmbed(videoUrl)}
            className="w-full h-full pointer-events-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            style={{ 
              border: 'none',
              pointerEvents: 'none'
            }}
          />
          {/* Overlay to prevent interaction and access to YouTube controls */}
          <div 
            className="absolute inset-0 z-10 cursor-pointer" 
            onClick={() => setShowPlayButton(!showPlayButton)}
            onContextMenu={handleContextMenu}
          />
        </div>
      )}

      {/* Center Play Button - YouTube style */}
      <AnimatePresence>
        {showPlayButton && !isLoading && (
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
              className="w-16 h-16 md:w-20 md:h-20 bg-[hsl(16,85%,55%)] hover:bg-[hsl(16,85%,50%)] rounded-full flex items-center justify-center shadow-xl transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowPlayButton(false);
                // Note: For YouTube, we'd need to use YouTube API to control playback
                // For now, this hides the overlay to allow iframe interaction briefly
              }}
            >
              <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white ml-1" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

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
              {/* Progress Bar */}
              <div className="mb-3">
                <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-[hsl(0,85%,55%)] rounded-full"
                    style={{ width: '10%' }}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    className="text-white hover:text-primary transition-colors"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6 fill-white" />
                    )}
                  </button>
                  <button className="text-white hover:text-primary transition-colors">
                    <SkipBack className="w-5 h-5" />
                  </button>
                  <button className="text-white hover:text-primary transition-colors">
                    <SkipForward className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-2 ml-2">
                    <button 
                      className="text-white hover:text-primary transition-colors"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </button>
                    {/* Red dot indicator */}
                    <div className="w-2 h-2 bg-[hsl(0,85%,55%)] rounded-full animate-pulse" />
                  </div>
                  <span className="text-white text-sm font-medium ml-2">
                    0:02 / 0:37
                  </span>
                </div>

                <button 
                  className="text-white hover:text-primary transition-colors"
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
