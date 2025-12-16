import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2, Clock, Check, X, LogOut, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import ThemeToggle from "@/components/ThemeToggle";
import caaganelogo from "@/assets/caagane-academy-logo.jpg";

interface Profile {
  is_approved: boolean;
  full_name: string;
}

interface AvailableSlot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

interface Booking {
  id: string;
  status: string;
  slot_id: string;
  notes: string | null;
  created_at: string;
  available_slots: {
    slot_date: string;
    start_time: string;
    end_time: string;
  };
}

const Bookings = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("is_approved, full_name")
        .eq("user_id", user!.id)
        .maybeSingle();

      setProfile(profileData);

      if (profileData?.is_approved) {
        // Fetch available slots (not booked)
        const { data: slotsData, error: slotsError } = await supabase
          .from("available_slots")
          .select("*")
          .eq("is_booked", false)
          .gte("slot_date", new Date().toISOString().split("T")[0])
          .order("slot_date", { ascending: true })
          .order("start_time", { ascending: true });

        if (slotsError) throw slotsError;
        setAvailableSlots(slotsData || []);

        // Fetch my bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select("*, available_slots(slot_date, start_time, end_time)")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false });

        if (bookingsError) throw bookingsError;
        setMyBookings(bookingsData || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Khalad",
        description: "Ma soo dejin karin xogta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async (slot: AvailableSlot) => {
    setBooking(true);
    try {
      // Create booking
      const { error: bookingError } = await supabase.from("bookings").insert({
        user_id: user!.id,
        slot_id: slot.id,
        status: "pending",
      });

      if (bookingError) throw bookingError;

      // Mark slot as booked
      const { error: updateError } = await supabase
        .from("available_slots")
        .update({ is_booked: true })
        .eq("id", slot.id);

      if (updateError) throw updateError;

      toast({
        title: "Waad ku guuleysatay!",
        description: "Balanta waa la diiwaangeliyey",
      });

      fetchData();
    } catch (error) {
      console.error("Error booking slot:", error);
      toast({
        title: "Khalad",
        description: "Ma suuragalin balanta",
        variant: "destructive",
      });
    } finally {
      setBooking(false);
    }
  };

  const cancelBooking = async (bookingId: string, slotId: string) => {
    try {
      // Update booking status
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      if (bookingError) throw bookingError;

      // Free up the slot
      const { error: slotError } = await supabase
        .from("available_slots")
        .update({ is_booked: false })
        .eq("id", slotId);

      if (slotError) throw slotError;

      toast({
        title: "Balanta waa la buuriyey",
        description: "Balantaada waa la cancel-gareeye",
      });

      fetchData();
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast({
        title: "Khalad",
        description: "Ma suuragalin in la cancel-gareeyo",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <span className="px-2 py-1 bg-success/10 text-success text-xs rounded-full">La xaqiijiyey</span>;
      case "completed":
        return <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">Dhameystirmay</span>;
      case "cancelled":
        return <span className="px-2 py-1 bg-destructive/10 text-destructive text-xs rounded-full">La tirtiray</span>;
      default:
        return <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">Sugitaan</span>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src={caaganelogo} alt="Caagane Academy" className="w-10 h-10 rounded-xl object-cover" />
              <span className="text-xl font-display font-bold">
                <span className="text-primary">Caagane</span>
                <span className="text-secondary"> Academy</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold mb-2">Ballamaha Macalinka</h1>
          <p className="text-muted-foreground mb-8">Sii balan macalinka si aad ula hadasho</p>
        </motion.div>

        {/* Payment Notice for Unapproved Users */}
        {!profile?.is_approved && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 text-center"
          >
            <Lock className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">U baahan tahay lacag bixin</h3>
            <p className="text-muted-foreground mb-4">
              Si aad balan u qaadato macalinka, fadlan la xiriir WhatsApp: <strong>626966559</strong>
            </p>
            <p className="text-sm text-muted-foreground">Qiimaha: <strong>$7/bilaha</strong></p>
          </motion.div>
        )}

        {profile?.is_approved && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Available Slots */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-xl font-semibold mb-4">Waqtiyada La Heli Karo</h2>
              {availableSlots.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border p-8 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Ma jiraan waqtiyo bannaan hadda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="bg-card rounded-xl border border-border p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {format(parseISO(slot.slot_date), "EEEE, MMM d")}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                          </p>
                        </div>
                      </div>
                      <Button onClick={() => handleBookSlot(slot)} disabled={booking}>
                        {booking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Qaado"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* My Bookings */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-xl font-semibold mb-4">Ballamahaaga</h2>
              {myBookings.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border p-8 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Ma lihid wali balan</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-card rounded-xl border border-border p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">
                            {format(parseISO(booking.available_slots.slot_date), "EEEE, MMM d")}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {booking.available_slots.start_time.slice(0, 5)} - {booking.available_slots.end_time.slice(0, 5)}
                          </p>
                        </div>
                        {getStatusBadge(booking.status || "pending")}
                      </div>
                      {booking.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelBooking(booking.id, booking.slot_id)}
                          className="text-destructive"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;
