import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Loader2,
  Video,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminLessons from "./AdminLessons";

interface Playlist {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
  order_index: number;
  created_at: string;
  lessons_count?: number;
}

const AdminPlaylists = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnail_url: "",
    is_published: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;

      // Get lesson counts
      const playlistsWithCounts = await Promise.all(
        (data || []).map(async (playlist) => {
          const { count } = await supabase
            .from("lessons")
            .select("*", { count: "exact", head: true })
            .eq("playlist_id", playlist.id);
          return { ...playlist, lessons_count: count || 0 };
        })
      );

      setPlaylists(playlistsWithCounts);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      toast({
        title: "Error",
        description: "Failed to load playlists",
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
      if (editingPlaylist) {
        const { error } = await supabase
          .from("playlists")
          .update({
            title: formData.title,
            description: formData.description || null,
            thumbnail_url: formData.thumbnail_url || null,
            is_published: formData.is_published,
          })
          .eq("id", editingPlaylist.id);

        if (error) throw error;
        toast({ title: "Success", description: "Playlist updated successfully" });
      } else {
        const { error } = await supabase.from("playlists").insert({
          title: formData.title,
          description: formData.description || null,
          thumbnail_url: formData.thumbnail_url || null,
          is_published: formData.is_published,
          order_index: playlists.length,
        });

        if (error) throw error;
        toast({ title: "Success", description: "Playlist created successfully" });
      }

      setDialogOpen(false);
      setEditingPlaylist(null);
      setFormData({ title: "", description: "", thumbnail_url: "", is_published: false });
      fetchPlaylists();
    } catch (error) {
      console.error("Error saving playlist:", error);
      toast({
        title: "Error",
        description: "Failed to save playlist",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deletePlaylist = async (id: string) => {
    if (!confirm("Are you sure you want to delete this playlist? All lessons will also be deleted.")) return;

    try {
      const { error } = await supabase.from("playlists").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "Playlist deleted successfully" });
      fetchPlaylists();
    } catch (error) {
      console.error("Error deleting playlist:", error);
      toast({
        title: "Error",
        description: "Failed to delete playlist",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setFormData({
      title: playlist.title,
      description: playlist.description || "",
      thumbnail_url: playlist.thumbnail_url || "",
      is_published: playlist.is_published,
    });
    setDialogOpen(true);
  };

  if (selectedPlaylist) {
    return (
      <AdminLessons
        playlist={selectedPlaylist}
        onBack={() => setSelectedPlaylist(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Maamulka Casharada</h1>
          <p className="text-muted-foreground">Samee playlists cusub iyo casharo</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingPlaylist(null);
            setFormData({ title: "", description: "", thumbnail_url: "", is_published: false });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Playlist Cusub
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPlaylist ? "Wax ka Badal Playlist" : "Playlist Cusub"}</DialogTitle>
              <DialogDescription>
                {editingPlaylist ? "Wax ka badal macluumaadka playlist" : "Samee playlist cusub oo casharada ku kaydi"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Magaca Playlist *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Tusaale: Level 1 - Beginner"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Sharaxaad</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Sharaxaad gaaban oo ku saabsan playlist-ka"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="thumbnail">Sawirka (URL)</Label>
                <Input
                  id="thumbnail"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="published">La daabaco (Published)</Label>
                <Switch
                  id="published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editingPlaylist ? (
                  "Kaydi Isbedelka"
                ) : (
                  "Samee Playlist"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {playlists.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Ma jiraan Playlists</h2>
          <p className="text-muted-foreground mb-4">Samee playlist cusub si aad u bilaabato</p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Samee Playlist Cusub
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist, index) => (
            <motion.div
              key={playlist.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl border border-border overflow-hidden card-hover"
            >
              <div className="aspect-video bg-muted relative">
                {playlist.thumbnail_url ? (
                  <img
                    src={playlist.thumbnail_url}
                    alt={playlist.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    playlist.is_published
                      ? "bg-success text-success-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {playlist.is_published ? "Published" : "Draft"}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{playlist.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {playlist.description || "No description"}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Video className="w-4 h-4" />
                  <span>{playlist.lessons_count} casharo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedPlaylist(playlist)}
                  >
                    Casharada
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(playlist)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deletePlaylist(playlist.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPlaylists;
