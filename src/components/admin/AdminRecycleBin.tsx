import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Trash2,
  RotateCcw,
  Loader2,
  BookOpen,
  Video,
  GraduationCap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface DeletedItem {
  id: string;
  item_type: string;
  item_id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item_data: any;
  deleted_at: string;
}

const AdminRecycleBin = () => {
  const [items, setItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<DeletedItem | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDeletedItems();
  }, []);

  const fetchDeletedItems = async () => {
    try {
      const { data, error } = await supabase
        .from("deleted_items")
        .select("*")
        .order("deleted_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching deleted items:", error);
      toast({
        title: "Error",
        description: "Failed to load deleted items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const restoreItem = async (item: DeletedItem) => {
    setRestoring(item.id);
    try {
      // Restore the item to its original table
      const tableName = item.item_type === "course" ? "courses" 
        : item.item_type === "playlist" ? "playlists" 
        : "lessons";

      const { error: insertError } = await supabase
        .from(tableName)
        .insert(item.item_data);

      if (insertError) throw insertError;

      // Remove from deleted_items
      const { error: deleteError } = await supabase
        .from("deleted_items")
        .delete()
        .eq("id", item.id);

      if (deleteError) throw deleteError;

      setItems(items.filter((i) => i.id !== item.id));
      toast({
        title: "Waa la soo celiyay!",
        description: `${item.item_type} waa la soo celiyay`,
      });
    } catch (error) {
      console.error("Error restoring item:", error);
      toast({
        title: "Error",
        description: "Failed to restore item",
        variant: "destructive",
      });
    } finally {
      setRestoring(null);
    }
  };

  const permanentlyDelete = async (item: DeletedItem) => {
    try {
      const { error } = await supabase
        .from("deleted_items")
        .delete()
        .eq("id", item.id);

      if (error) throw error;

      setItems(items.filter((i) => i.id !== item.id));
      setItemToDelete(null);
      toast({
        title: "Waa la tirtiray!",
        description: "Item-ka waa la tirtiray oo aan dib loo keeni karin",
      });
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case "course":
        return <GraduationCap className="w-4 h-4" />;
      case "playlist":
        return <BookOpen className="w-4 h-4" />;
      case "lesson":
        return <Video className="w-4 h-4" />;
      default:
        return <Trash2 className="w-4 h-4" />;
    }
  };

  const getItemTitle = (item: DeletedItem) => {
    return (item.item_data as { title?: string }).title || "Unknown";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">Qashinka (Recycle Bin)</h1>
        <p className="text-muted-foreground">
          Waxyaabaha la tirtiray - waxaad soo celin kartaa ama si buuxa u tirtiri kartaa
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <Trash2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Qashinka waa madhan yahay</h2>
          <p className="text-muted-foreground">Ma jiraan waxyaabo la tirtiray</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nooca</TableHead>
                <TableHead>Magaca</TableHead>
                <TableHead>Goorta la tirtiray</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-border last:border-0"
                >
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      {getItemIcon(item.item_type)}
                      {item.item_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{getItemTitle(item)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(item.deleted_at).toLocaleString("so-SO")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreItem(item)}
                        disabled={restoring === item.id}
                      >
                        {restoring === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Soo Celi
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setItemToDelete(item)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Permanent Delete Confirmation */}
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ma hubtaa inaad si buuxa u tirtireyso?</AlertDialogTitle>
            <AlertDialogDescription>
              "{getItemTitle(itemToDelete!)}" waa la tirtiri doonaa oo aan dib loo keeni karin.
              Tani waa mid aan laga noqon karin!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ka noqo</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToDelete && permanentlyDelete(itemToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Haa, Si Buuxa u Tirtir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminRecycleBin;