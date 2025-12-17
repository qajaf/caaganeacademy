import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, Plus, Trash2, Edit, Sparkles, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";

interface Note {
  id: string;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

const StudentNotes = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [formData, setFormData] = useState({ title: "", content: "" });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
    if (user) {
      fetchNotes();
    }
  }, [user, loading, navigate]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("student_notes")
        .select("*")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      if (editingNote) {
        const { error } = await supabase
          .from("student_notes")
          .update({
            title: formData.title || null,
            content: formData.content,
          })
          .eq("id", editingNote.id);

        if (error) throw error;
        toast({ title: "Waad ku guuleysatay!", description: "Note-ka waa la cusboonaysiiyay" });
      } else {
        const { error } = await supabase.from("student_notes").insert({
          title: formData.title || null,
          content: formData.content,
          user_id: user.id,
        });

        if (error) throw error;
        toast({ title: "Waad ku guuleysatay!", description: "Note-ka cusub waa la sameeyay" });
      }

      setDialogOpen(false);
      setEditingNote(null);
      setFormData({ title: "", content: "" });
      fetchNotes();
    } catch (error) {
      console.error("Error saving note:", error);
      toast({ title: "Error", description: "Wax qalad ah ayaa dhacay", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (id: string) => {
    if (!confirm("Ma hubtaa inaad tirtirto note-kan?")) return;

    try {
      const { error } = await supabase.from("student_notes").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Waad ku guuleysatay!", description: "Note-ka waa la tirtiray" });
      fetchNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({ title: "Error", description: "Wax qalad ah ayaa dhacay", variant: "destructive" });
    }
  };

  const openEditDialog = (note: Note) => {
    setEditingNote(note);
    setFormData({ title: note.title || "", content: note.content });
    setDialogOpen(true);
  };

  const askAiForHelp = async () => {
    if (!formData.content.trim()) {
      toast({ title: "Fadlan qor wax si AI uu kaa caawiyo", variant: "destructive" });
      return;
    }
    
    setAiLoading(true);
    try {
      const response = await supabase.functions.invoke('ai-tutor', {
        body: { 
          message: `Waxaan qoray notes-kan, fadlan i caawin si aan u hagaajiyo ama u ballaariyoo: "${formData.content}". Ka jawaab Somali.` 
        }
      });

      if (response.error) throw response.error;
      
      const aiSuggestion = response.data?.reply || response.data?.message;
      if (aiSuggestion) {
        setFormData({ ...formData, content: formData.content + "\n\n--- AI Suggestion ---\n" + aiSuggestion });
        toast({ title: "AI waa ku caawiyay!", description: "Eeg qoraalka hoose" });
      }
    } catch (error) {
      console.error("AI error:", error);
      toast({ title: "Error", description: "AI-ga kama helin caawimo", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">My Notes</h1>
            <p className="text-muted-foreground">Qor notes-kaaga gaarka ah. AI ayaa ku caawini kara.</p>
          </div>
          <Button onClick={() => {
            setEditingNote(null);
            setFormData({ title: "", content: "" });
            setDialogOpen(true);
          }} className="gap-2">
            <Plus className="w-4 h-4" />
            Note Cusub
          </Button>
        </div>

        {loadingNotes ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : notes.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ma jiraan Notes</h2>
            <p className="text-muted-foreground mb-4">Samee note cusub si aad u bilaawato</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Samee Note Cusub
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notes.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl border border-border p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold truncate flex-1">
                    {note.title || "Untitled Note"}
                  </h3>
                  <div className="flex items-center gap-1 ml-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(note)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteNote(note.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
                  {note.content}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(note.updated_at).toLocaleDateString('so-SO')}
                </p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Note Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingNote(null);
            setFormData({ title: "", content: "" });
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingNote ? "Wax ka Badal Note" : "Note Cusub"}</DialogTitle>
              <DialogDescription>
                Qor notes-kaaga gaarka ah. AI ayaa ku caawini kara.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  placeholder="Cinwaanka (optional)"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <Textarea
                  placeholder="Qor notes-kaaga halkan..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={askAiForHelp}
                  disabled={aiLoading}
                  className="gap-2"
                >
                  {aiLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  AI ku Caawin
                </Button>
                <div className="flex-1" />
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingNote ? "Kaydi" : "Samee"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StudentNotes;
