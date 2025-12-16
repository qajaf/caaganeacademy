import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Trash2,
  Calendar,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface AvailableSlot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  created_at: string;
}

interface Booking {
  id: string;
  slot_id: string;
  user_id: string;
  status: string;
  notes: string | null;
  created_at: string;
  slot?: AvailableSlot;
  profile?: {
    full_name: string;
    email: string;
  };
}

const AdminBookings = () => {
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    slot_date: "",
    start_time: "",
    end_time: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [{ data: slotsData }, { data: bookingsData }] = await Promise.all([
        supabase
          .from("available_slots")
          .select("*")
          .order("slot_date", { ascending: true })
          .order("start_time", { ascending: true }),
        supabase
          .from("bookings")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      // Get profile info for each booking
      const bookingsWithProfiles = await Promise.all(
        (bookingsData || []).map(async (booking) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("user_id", booking.user_id)
            .maybeSingle();
          
          const slot = slotsData?.find(s => s.id === booking.slot_id);
          
          return { ...booking, profile, slot };
        })
      );

      setSlots(slotsData || []);
      setBookings(bookingsWithProfiles);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
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
      const { error } = await supabase.from("available_slots").insert({
        slot_date: formData.slot_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        is_booked: false,
      });

      if (error) throw error;

      toast({ title: "Success", description: "Time slot created successfully" });
      setDialogOpen(false);
      setFormData({ slot_date: "", start_time: "", end_time: "" });
      fetchData();
    } catch (error) {
      console.error("Error creating slot:", error);
      toast({
        title: "Error",
        description: "Failed to create time slot",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteSlot = async (id: string) => {
    if (!confirm("Are you sure you want to delete this time slot?")) return;

    try {
      const { error } = await supabase.from("available_slots").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "Time slot deleted successfully" });
      fetchData();
    } catch (error) {
      console.error("Error deleting slot:", error);
      toast({
        title: "Error",
        description: "Failed to delete time slot",
        variant: "destructive",
      });
    }
  };

  const updateBookingStatus = async (bookingId: string, status: "pending" | "confirmed" | "completed" | "cancelled") => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId);

      if (error) throw error;
      toast({ title: "Success", description: `Booking ${status}` });
      fetchData();
    } catch (error) {
      console.error("Error updating booking:", error);
      toast({
        title: "Error",
        description: "Failed to update booking",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-accent/10 text-accent border-accent/20",
      confirmed: "bg-primary/10 text-primary border-primary/20",
      completed: "bg-success/10 text-success border-success/20",
      cancelled: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return styles[status] || styles.pending;
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Maamulka Ballamaha</h1>
          <p className="text-muted-foreground">Samee waqtiyo cusub oo arag ballamaha</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Waqti Cusub
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ku dar Waqti Cusub</DialogTitle>
              <DialogDescription>
                Samee waqti cusub oo ardaydu qabsan karaan
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="slot-date">Taariikhda *</Label>
                <Input
                  id="slot-date"
                  type="date"
                  value={formData.slot_date}
                  onChange={(e) => setFormData({ ...formData, slot_date: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time">Waqtiga Billowga *</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end-time">Waqtiga Dhamaadka *</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Samee Waqtiga"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Available Slots */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Waqtiyada La Heli Karo</h2>
        {slots.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Ma jiraan waqtiyo. Ku dar mid cusub.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slots.map((slot, index) => (
              <motion.div
                key={slot.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-card rounded-xl border p-4 ${
                  slot.is_booked ? "border-accent/30 bg-accent/5" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">
                      {format(new Date(slot.slot_date), "MMM dd, yyyy")}
                    </span>
                  </div>
                  {slot.is_booked ? (
                    <Badge className="bg-accent/10 text-accent">Booked</Badge>
                  ) : (
                    <Badge className="bg-success/10 text-success">Available</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <Clock className="w-4 h-4" />
                  <span>{slot.start_time} - {slot.end_time}</span>
                </div>
                {!slot.is_booked && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSlot(slot.id)}
                    className="w-full text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Bookings */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Ballamaha Ardayda</h2>
        {bookings.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Ma jiraan ballamaha weli.</p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ardayga</TableHead>
                  <TableHead>Taariikhda</TableHead>
                  <TableHead>Waqtiga</TableHead>
                  <TableHead>Xaalada</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.profile?.full_name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">{booking.profile?.email || ""}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {booking.slot?.slot_date
                        ? format(new Date(booking.slot.slot_date), "MMM dd, yyyy")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {booking.slot?.start_time} - {booking.slot?.end_time || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(booking.status)}>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {booking.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateBookingStatus(booking.id, "confirmed")}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Confirm
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateBookingStatus(booking.id, "cancelled")}
                              className="text-destructive"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </>
                        )}
                        {booking.status === "confirmed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateBookingStatus(booking.id, "completed")}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Complete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookings;
