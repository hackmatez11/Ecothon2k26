import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDepartmentAuth } from "@/contexts/DepartmentAuthContext";

interface DepartmentPasswordModalProps {
  open: boolean;
  departmentName: string;
  deptPath: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DepartmentPasswordModal({
  open,
  departmentName,
  deptPath,
  onSuccess,
  onCancel,
}: DepartmentPasswordModalProps) {
  const { getPassword } = useDepartmentAuth();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = getPassword(deptPath);
    if (password === correctPassword) {
      setPassword("");
      setError("");
      onSuccess();
    } else {
      setError("Incorrect password. Please try again.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setPassword("");
      setError("");
      onCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-lg">Department Access</DialogTitle>
          </div>
          <DialogDescription>
            Enter the password to access <span className="font-semibold text-foreground">{departmentName}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="dept-password">Password</Label>
            <div className="relative">
              <Input
                id="dept-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter department password"
                className={`pr-10 transition-all ${shake ? "animate-[shake_0.4s_ease-in-out]" : ""} ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!password}>
              Enter
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
