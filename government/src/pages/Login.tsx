import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TreePine, Shield } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [department, setDepartment] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-12 w-12 rounded-full gov-gradient flex items-center justify-center">
              <TreePine className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Government Login</CardTitle>
          <p className="text-sm text-muted-foreground">National Environmental Monitoring & Action Platform</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="moe">Ministry of Environment</SelectItem>
                  <SelectItem value="pcb">Pollution Control Board</SelectItem>
                  <SelectItem value="wrd">Water Resources Department</SelectItem>
                  <SelectItem value="fd">Forest Department</SelectItem>
                  <SelectItem value="udd">Urban Development Department</SelectItem>
                  <SelectItem value="wma">Waste Management Authority</SelectItem>
                  <SelectItem value="ccd">Climate Change Department</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Officer ID</Label>
              <Input placeholder="Enter Officer ID" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" placeholder="Enter Password" />
            </div>
            <Button type="submit" className="w-full">
              <Shield className="mr-2 h-4 w-4" /> Login
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to Home</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
