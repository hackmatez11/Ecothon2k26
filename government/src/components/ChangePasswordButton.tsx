import { useState } from "react";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDepartmentAuth } from "@/contexts/DepartmentAuthContext";
import { useToast } from "@/hooks/use-toast";

interface ChangePasswordButtonProps {
  deptPath: string;
  deptName: string;
}

export function ChangePasswordButton({ deptPath, deptName }: ChangePasswordButtonProps) {
  const { changePassword, getPassword } = useDepartmentAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setCurrent(""); setNewPass(""); setConfirm(""); setError("");
    setShowCurrent(false); setShowNew(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (current !== getPassword(deptPath)) {
      setError("Current password is incorrect.");
      return;
    }
    if (newPass.length < 3) {
      setError("New password must be at least 3 characters.");
      return;
    }
    if (newPass !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    changePassword(deptPath, newPass);
    toast({ title: "Password updated", description: `${deptName} password has been changed.` });
    setOpen(false);
    reset();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <KeyRound className="h-4 w-4" />
        Change Password
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setOpen(false); reset(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-primary/10 rounded-xl">
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle>Change Department Password</DialogTitle>
            </div>
            <DialogDescription>
              Update the access password for <span className="font-semibold text-foreground">{deptName}</span>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="current-pass">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-pass"
                  type={showCurrent ? "text" : "password"}
                  value={current}
                  onChange={(e) => { setCurrent(e.target.value); setError(""); }}
                  placeholder="Enter current password"
                  className="pr-10"
                  autoFocus
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-pass">New Password</Label>
              <div className="relative">
                <Input
                  id="new-pass"
                  type={showNew ? "text" : "password"}
                  value={newPass}
                  onChange={(e) => { setNewPass(e.target.value); setError(""); }}
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-pass">Confirm New Password</Label>
              <Input
                id="confirm-pass"
                type="password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                placeholder="Confirm new password"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" onClick={() => { setOpen(false); reset(); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={!current || !newPass || !confirm}>
                Save Password
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
