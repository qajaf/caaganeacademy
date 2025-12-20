import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Book,
  Volume2,
  Upload,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DictionaryEntry {
  id: string;
  word: string;
  pronunciation_url: string | null;
  meaning: string;
  example_sentence: string | null;
  example_sentence_meaning: string | null;
  created_at: string;
}

const AdminDictionary = () => {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DictionaryEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<DictionaryEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    word: "",
    pronunciation_url: "",
    meaning: "",
    example_sentence: "",
    example_sentence_meaning: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEntries();
  }, []);

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
        description: "Failed to load dictionary entries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingEntry) {
        const { error } = await supabase
          .from("dictionary")
          .update({
            word: formData.word,
            pronunciation_url: formData.pronunciation_url || null,
            meaning: formData.meaning,
            example_sentence: formData.example_sentence || null,
            example_sentence_meaning: formData.example_sentence_meaning || null,
          })
          .eq("id", editingEntry.id);

        if (error) throw error;
        toast({ title: "Success", description: "Erayga waa la cusbooneysiiyay" });
      } else {
        const { error } = await supabase.from("dictionary").insert({
          word: formData.word,
          pronunciation_url: formData.pronunciation_url || null,
          meaning: formData.meaning,
          example_sentence: formData.example_sentence || null,
          example_sentence_meaning: formData.example_sentence_meaning || null,
        });

        if (error) throw error;
        toast({ title: "Success", description: "Eray cusub ayaa lagu daray" });
      }

      setDialogOpen(false);
      setEditingEntry(null);
      resetForm();
      fetchEntries();
    } catch (error) {
      console.error("Error saving entry:", error);
      toast({
        title: "Error",
        description: "Failed to save entry",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entryToDelete) return;

    try {
      const { error } = await supabase
        .from("dictionary")
        .delete()
        .eq("id", entryToDelete.id);

      if (error) throw error;
      toast({ title: "Success", description: "Erayga waa la tirtiray" });
      setEntryToDelete(null);
      fetchEntries();
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete entry",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (entry: DictionaryEntry) => {
    setEditingEntry(entry);
    setFormData({
      word: entry.word,
      pronunciation_url: entry.pronunciation_url || "",
      meaning: entry.meaning,
      example_sentence: entry.example_sentence || "",
      example_sentence_meaning: entry.example_sentence_meaning || "",
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      word: "",
      pronunciation_url: "",
      meaning: "",
      example_sentence: "",
      example_sentence_meaning: "",
    });
  };

  const handleAudioUpload = async (file: File) => {
    setUploadingAudio(true);
    try {
      const fileName = `pronunciation-${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('course-files')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage.from('course-files').getPublicUrl(fileName);
      setFormData({ ...formData, pronunciation_url: urlData.publicUrl });
      toast({ title: "Success", description: "Audio uploaded successfully" });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to upload audio", variant: "destructive" });
    } finally {
      setUploadingAudio(false);
    }
  };

  const playAudio = (url: string) => {
    const audio = new Audio(url);
    audio.play();
  };

  const filteredEntries = entries.filter(
    (entry) =>
      entry.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.meaning.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Dictionary</h1>
          <p className="text-muted-foreground">Maamul ereybixinta iyo macneyaasha</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingEntry(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bounce-hover">
              <Plus className="w-4 h-4" />
              Eray Cusub
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingEntry ? "Wax ka Badal Erayga" : "Eray Cusub"}</DialogTitle>
              <DialogDescription>
                {editingEntry ? "Wax ka badal macluumaadka erayga" : "Ku dar eray cusub dictionary-ga"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="word">Erayga (Word) *</Label>
                <Input
                  id="word"
                  value={formData.word}
                  onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                  placeholder="e.g., Hello"
                  required
                />
              </div>
              <div>
                <Label htmlFor="meaning">Macnaha *</Label>
                <Textarea
                  id="meaning"
                  value={formData.meaning}
                  onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                  placeholder="Macnaha erayga"
                  rows={2}
                  required
                />
              </div>
              <div>
                <Label>Dhawaaqa (Audio)</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={audioInputRef}
                    className="hidden"
                    accept="audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAudioUpload(file);
                    }}
                  />
                  <Input
                    value={formData.pronunciation_url}
                    readOnly
                    placeholder="Upload audio file"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => audioInputRef.current?.click()}
                    disabled={uploadingAudio}
                  >
                    {uploadingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  </Button>
                  {formData.pronunciation_url && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => playAudio(formData.pronunciation_url)}
                    >
                      <Volume2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="example_sentence">Jumla Tusaale (Example Sentence)</Label>
                <Textarea
                  id="example_sentence"
                  value={formData.example_sentence}
                  onChange={(e) => setFormData({ ...formData, example_sentence: e.target.value })}
                  placeholder="e.g., Hello, how are you?"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="example_sentence_meaning">Macnaha Jumlada</Label>
                <Textarea
                  id="example_sentence_meaning"
                  value={formData.example_sentence_meaning}
                  onChange={(e) => setFormData({ ...formData, example_sentence_meaning: e.target.value })}
                  placeholder="Macnaha jumlada Soomaali"
                  rows={2}
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editingEntry ? (
                  "Kaydi Isbedelka"
                ) : (
                  "Ku dar Erayga"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Search */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 relative"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Raadi eray... (word ama macna)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
      >
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 card-hover">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Book className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Dhammaan Ereybixinta</p>
            <p className="text-2xl font-bold">{entries.length}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 card-hover">
          <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
            <Volume2 className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Kuwa Dhawaaqa leh</p>
            <p className="text-2xl font-bold">{entries.filter(e => e.pronunciation_url).length}</p>
          </div>
        </div>
      </motion.div>

      {entries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-2xl border border-border p-12 text-center"
        >
          <Book className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Ma jiraan Ereyba</h2>
          <p className="text-muted-foreground mb-4">Ku dar eray cusub dictionary-ga</p>
          <Button onClick={() => setDialogOpen(true)} className="bounce-hover">
            <Plus className="w-4 h-4 mr-2" />
            Ku dar Eray
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Erayga</TableHead>
                <TableHead>Macnaha</TableHead>
                <TableHead>Jumla</TableHead>
                <TableHead>Dhawaaq</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry, index) => (
                <motion.tr
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-border last:border-0"
                >
                  <TableCell className="font-semibold text-primary">{entry.word}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">{entry.meaning}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {entry.example_sentence || "-"}
                  </TableCell>
                  <TableCell>
                    {entry.pronunciation_url ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => playAudio(entry.pronunciation_url!)}
                        className="wiggle-hover"
                      >
                        <Volume2 className="w-4 h-4 text-secondary" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(entry)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEntryToDelete(entry)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!entryToDelete} onOpenChange={() => setEntryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ma hubtaa inaad tirtireyso?</AlertDialogTitle>
            <AlertDialogDescription>
              Erayga "{entryToDelete?.word}" waa la tirtiri doonaa. 
              Tani waa mid aan laga noqon karin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ka noqo</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Haa, Tirtir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDictionary;
