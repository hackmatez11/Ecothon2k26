import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Info, TrendingUp, AlertCircle } from "lucide-react";
import { departments } from "@/lib/departments";
import { useNavigate } from "react-router-dom";

interface GenericDashboardProps {
  title: string;
}

const GenericDashboard = ({ title }: GenericDashboardProps) => {
  const navigate = useNavigate();
  const deptData = departments.find(d => d.title === title);

  if (!deptData) return <div>Department not found</div>;

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-xl border border-white/10 ${deptData.color.replace('bg-', 'bg-')}/10 shadow-sm`}>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <deptData.icon className={`h-6 w-6 ${deptData.color.replace('bg-', 'text-')}`} />
          {deptData.title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{deptData.description}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {deptData.stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground font-medium mb-1">{s.label}</div>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full ${deptData.color}`} />
                {s.status}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deptData.features.map((feature) => (
          <Card key={feature.title} className="cursor-pointer hover:shadow-lg transition-all border-border hover:border-primary/50" onClick={() => navigate(feature.path)}>
            <CardHeader className="pb-3">
              <div className={`p-2 w-fit rounded-lg ${feature.color} bg-opacity-10`}>
                <feature.icon className={`h-5 w-5 ${feature.color.replace('bg-', 'text-')}`} />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-base mb-1.5">{feature.title}</CardTitle>
              <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">{feature.stats}</span>
                <span className="text-xs text-primary font-medium hover:underline">Open Tool →</span>
              </div>
            </CardContent>
          </Card>
        ))}
        
        <Card className="flex flex-col justify-center items-center p-8 text-center border-dashed border-2 bg-muted/20">
          <AlertCircle className="h-8 w-8 text-muted-foreground mb-3 opacity-50" />
          <h3 className="text-sm font-medium text-foreground">More Tools Coming Soon</h3>
          <p className="text-xs text-muted-foreground mt-1">New AI analysis modules are being deployed for this department.</p>
        </Card>
      </div>
    </div>
  );
};

export const AgriculturalDashboard = () => <GenericDashboard title="Agricultural Department" />;
export const WasteDashboard = () => <GenericDashboard title="Waste Department" />;
export const ForestDashboard = () => <GenericDashboard title="Forest Department" />;
export const SoilConservationDashboard = () => <GenericDashboard title="Soil Conservation Department" />;
