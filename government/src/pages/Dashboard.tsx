import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { departments } from "@/lib/departments";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Department Dashboards</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {departments.map((dept) => (
            <Card key={dept.title} className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-transparent hover:border-l-primary" onClick={() => navigate(dept.path)}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg ${dept.color} bg-opacity-10`}>
                    <dept.icon className={`h-8 w-8 ${dept.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Department</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardTitle className="text-lg mb-2">{dept.title}</CardTitle>
                <p className="text-sm text-muted-foreground mb-4">{dept.description}</p>
                
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {dept.stats.map((stat, index) => (
                    <div key={index} className="text-center p-2 bg-muted/50 rounded-lg">
                      <div className="text-lg font-semibold text-foreground">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                      <div className="text-xs text-muted-foreground">{stat.status}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Tools & Features:</p>
                  <div className="flex flex-wrap gap-2">
                    {dept.features.map((feature, index) => (
                      <button 
                        key={index} 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(feature.path);
                        }}
                        className="text-xs px-2.5 py-1 bg-muted hover:bg-primary/20 hover:text-primary rounded-full transition-colors font-medium border border-transparent hover:border-primary/30"
                      >
                        {feature.title}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { action: "File Complaint", dept: "Industrial Regulation", color: "bg-red-500", path: "/complaints" },
              { action: "Check Air Quality", dept: "Environmental", color: "bg-green-500", path: "/environmental" },
              { action: "Report Oil Spill", dept: "Water Resources", color: "bg-blue-500", path: "/oil-spill" },
              { action: "Submit Budget", dept: "Administration", color: "bg-purple-500", path: "/budget" },
            ].map((item, index) => (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`p-3 rounded-lg ${item.color} bg-opacity-10 hover:bg-opacity-20 transition-colors text-left`}
              >
                <p className="font-medium text-sm text-foreground">{item.action}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.dept}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
