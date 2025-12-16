import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Users, BookOpen, Calendar, CheckCircle, Clock, TrendingUp } from "lucide-react";

interface Stats {
  totalStudents: number;
  approvedStudents: number;
  pendingStudents: number;
  totalPlaylists: number;
  totalLessons: number;
  totalBookings: number;
}

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    approvedStudents: 0,
    pendingStudents: 0,
    totalPlaylists: 0,
    totalLessons: 0,
    totalBookings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [
        { count: totalStudents },
        { count: approvedStudents },
        { count: pendingStudents },
        { count: totalPlaylists },
        { count: totalLessons },
        { count: totalBookings },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_approved", true),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_approved", false),
        supabase.from("playlists").select("*", { count: "exact", head: true }),
        supabase.from("lessons").select("*", { count: "exact", head: true }),
        supabase.from("bookings").select("*", { count: "exact", head: true }),
      ]);

      setStats({
        totalStudents: totalStudents || 0,
        approvedStudents: approvedStudents || 0,
        pendingStudents: pendingStudents || 0,
        totalPlaylists: totalPlaylists || 0,
        totalLessons: totalLessons || 0,
        totalBookings: totalBookings || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Dhammaan Ardayda",
      value: stats.totalStudents,
      icon: Users,
      color: "bg-primary/10 text-primary",
      border: "border-primary/20",
    },
    {
      title: "La Ansixiyay",
      value: stats.approvedStudents,
      icon: CheckCircle,
      color: "bg-success/10 text-success",
      border: "border-success/20",
    },
    {
      title: "Sugaya Ansixin",
      value: stats.pendingStudents,
      icon: Clock,
      color: "bg-accent/10 text-accent",
      border: "border-accent/20",
    },
    {
      title: "Playlists",
      value: stats.totalPlaylists,
      icon: BookOpen,
      color: "bg-secondary/10 text-secondary",
      border: "border-secondary/20",
    },
    {
      title: "Casharada",
      value: stats.totalLessons,
      icon: TrendingUp,
      color: "bg-primary/10 text-primary",
      border: "border-primary/20",
    },
    {
      title: "Ballamaha",
      value: stats.totalBookings,
      icon: Calendar,
      color: "bg-accent/10 text-accent",
      border: "border-accent/20",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-6 animate-pulse">
            <div className="h-12 w-12 bg-muted rounded-xl mb-4" />
            <div className="h-4 w-24 bg-muted rounded mb-2" />
            <div className="h-8 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Soo dhawoow Admin Panel - Halkan waxaad ka maamuli kartaa dhammaan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-card rounded-2xl border ${card.border} p-6 card-hover`}
          >
            <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center mb-4`}>
              <card.icon className="w-6 h-6" />
            </div>
            <p className="text-muted-foreground text-sm mb-1">{card.title}</p>
            <p className="text-3xl font-display font-bold">{card.value}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminOverview;
