import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Search,
  Loader2,
  Shield,
  ShieldCheck,
  ShieldX,
  Crown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface UserWithRole {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
}

const AdminRoles = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [userToChange, setUserToChange] = useState<{user: UserWithRole, newRole: "admin" | "student"} | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .order("full_name", { ascending: true });

      if (profilesError) throw profilesError;

      // Fetch roles for all users
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles = (profiles || []).map((profile) => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        return {
          ...profile,
          role: userRole?.role || "student",
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId: string, newRole: "admin" | "student") => {
    setUpdating(userId);
    try {
      // Check if role exists for user
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert([{ user_id: userId, role: newRole }]);

        if (error) throw error;
      }

      // Update local state
      setUsers(users.map(u => 
        u.user_id === userId ? { ...u, role: newRole } : u
      ));

      toast({
        title: "Success",
        description: `Role updated to ${newRole}`,
      });
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
      setUserToChange(null);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const admins = users.filter(u => u.role === "admin");
  const students = users.filter(u => u.role === "student");

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
        className="mb-8"
      >
        <h1 className="text-3xl font-display font-bold mb-2">Admin Roles</h1>
        <p className="text-muted-foreground">U dhiib ama ka saar xuquuqda admin</p>
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
          placeholder="Raadi user... (magaca ama email)"
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
            <Crown className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Admins</p>
            <p className="text-2xl font-bold">{admins.length}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 card-hover">
          <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Students</p>
            <p className="text-2xl font-bold">{students.length}</p>
          </div>
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl border border-border overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Magaca</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user, index) => (
              <motion.tr
                key={user.user_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="border-b border-border last:border-0"
              >
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  {user.role === "admin" ? (
                    <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
                      <Crown className="w-3 h-3" /> Admin
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <Shield className="w-3 h-3" /> Student
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {user.role === "admin" ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setUserToChange({ user, newRole: "student" })}
                      disabled={updating === user.user_id}
                      className="gap-1"
                    >
                      {updating === user.user_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <ShieldX className="w-4 h-4" />
                          Ka saar Admin
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setUserToChange({ user, newRole: "admin" })}
                      disabled={updating === user.user_id}
                      className="gap-1"
                    >
                      {updating === user.user_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          Ka dhig Admin
                        </>
                      )}
                    </Button>
                  )}
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </motion.div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!userToChange} onOpenChange={() => setUserToChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ma hubtaa?</AlertDialogTitle>
            <AlertDialogDescription>
              {userToChange?.newRole === "admin" ? (
                <>Waxaad u dhiibeysaa <strong>{userToChange?.user.full_name}</strong> xuquuqda admin. 
                Wuxuu awood u yeelan doonaa in uu maamulo dhammaan websiteka.</>
              ) : (
                <>Waxaad ka saareysa <strong>{userToChange?.user.full_name}</strong> xuquuqda admin.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ka noqo</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToChange && updateRole(userToChange.user.user_id, userToChange.newRole)}
              className={userToChange?.newRole === "admin" ? "" : "bg-destructive hover:bg-destructive/90"}
            >
              Haa, Samee
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminRoles;
