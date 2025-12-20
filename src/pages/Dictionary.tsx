import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Book,
  Loader2,
  Volume2,
  Search,
  ArrowLeft,
  BookOpen,
  LogOut,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/ThemeToggle";
import caaganelogo from "@/assets/caagane-academy-logo.jpg";

interface DictionaryEntry {
  id: string;
  word: string;
  pronunciation_url: string | null;
  meaning: string;
  example_sentence: string | null;
  example_sentence_meaning: string | null;
}

const Dictionary = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<DictionaryEntry | null>(null);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      checkApproval();
    }
  }, [user, authLoading, navigate]);

  const checkApproval = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_approved")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (profile?.is_approved) {
        setIsApproved(true);
        fetchEntries();
      } else {
        setIsApproved(false);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error checking approval:", error);
      setLoading(false);
    }
  };

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from("dictionary")
        .select("*")
        .order("word", { ascending: true });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error fetching dictionary:", error);
      toast({
        title: "Error",
        description: "Failed to load dictionary",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (url: string) => {
    const audio = new Audio(url);
    audio.play();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const filteredEntries = entries.filter(
    (entry) =>
      entry.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.meaning.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-8 text-center max-w-md"
        >
          <Book className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold mb-2">Weli laguma ogola</h2>
          <p className="text-muted-foreground mb-6">
            Fadlan sug in la ansixiyo akoonkaaga si aad u arkato dictionary-ga
          </p>
          <Button onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ka noqo Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img src={caaganelogo} alt="Caagane" className="w-full h-full object-cover" />
                </div>
                <span className="font-display font-bold text-lg hidden sm:inline">Dictionary</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-display font-bold mb-2 gradient-text">Dictionary</h1>
          <p className="text-muted-foreground">Baro ereyo cusub maalin kasta</p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-xl mx-auto mb-8 relative"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Raadi eray... (English ama Somali)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 text-lg rounded-2xl"
          />
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex justify-center gap-6 mb-8"
        >
          <div className="bg-card rounded-xl border border-border px-6 py-4 flex items-center gap-3 card-hover-glow">
            <BookOpen className="w-6 h-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Ereybixinta</p>
              <p className="text-xl font-bold">{entries.length}</p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border px-6 py-4 flex items-center gap-3 card-hover-glow">
            <Search className="w-6 h-6 text-secondary" />
            <div>
              <p className="text-sm text-muted-foreground">Natiijada</p>
              <p className="text-xl font-bold">{filteredEntries.length}</p>
            </div>
          </div>
        </motion.div>

        {/* Dictionary Grid */}
        {filteredEntries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl border border-border p-12 text-center max-w-lg mx-auto"
          >
            <Book className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ma la helin waxba</h2>
            <p className="text-muted-foreground">Isku day eray kale</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredEntries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ delay: index * 0.03, type: "spring", stiffness: 300, damping: 25 }}
                  onClick={() => setSelectedEntry(entry)}
                  className="bg-card rounded-xl border border-border p-4 cursor-pointer card-hover-glow group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-primary group-hover:text-primary/80 transition-colors">
                      {entry.word}
                    </h3>
                    {entry.pronunciation_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          playAudio(entry.pronunciation_url!);
                        }}
                        className="wiggle-hover -mt-1 -mr-2"
                      >
                        <Volume2 className="w-4 h-4 text-secondary" />
                      </Button>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-2">{entry.meaning}</p>
                  {entry.example_sentence && (
                    <p className="text-xs text-muted-foreground/70 mt-2 italic line-clamp-1">
                      "{entry.example_sentence}"
                    </p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Selected Entry Modal */}
        <AnimatePresence>
          {selectedEntry && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedEntry(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-card rounded-2xl border border-border p-6 max-w-lg w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-3xl font-display font-bold text-primary">
                    {selectedEntry.word}
                  </h2>
                  {selectedEntry.pronunciation_url && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => playAudio(selectedEntry.pronunciation_url!)}
                      className="gap-2 pulse-glow"
                    >
                      <Volume2 className="w-5 h-5" />
                      Dhageyso
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Macnaha</h4>
                    <p className="text-lg">{selectedEntry.meaning}</p>
                  </div>

                  {selectedEntry.example_sentence && (
                    <div className="bg-muted/50 rounded-xl p-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Jumla Tusaale</h4>
                      <p className="text-lg italic mb-2">"{selectedEntry.example_sentence}"</p>
                      {selectedEntry.example_sentence_meaning && (
                        <p className="text-muted-foreground">
                          → {selectedEntry.example_sentence_meaning}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-6"
                  onClick={() => setSelectedEntry(null)}
                >
                  Xir
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dictionary;
