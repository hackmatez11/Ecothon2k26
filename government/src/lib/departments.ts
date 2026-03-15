import { 
  Leaf, Droplets, Factory, ClipboardList, 
  Brain, PieChart, Mountain, Ship, 
  MessageCircle, Mic, MessageSquare, Wallet, MapPin, Users, Trees, Trash2, ScanSearch
} from "lucide-react";
export interface Feature {
  title: string;
  description: string;
  icon: any;
  color: string;
  path: string;
  stats: string;
}

export interface Department {
  title: string;
  description: string;
  icon: any;
  color: string;
  path: string;
  stats: { label: string; value: string; status: string }[];
  features: Feature[];
}

export const departments: Department[] = [
  {
    title: "Environmental Department",
    description: "Monitor air quality, pollution sources, and environmental health",
    icon: Leaf,
    color: "bg-green-500",
    path: "/environmental",
    stats: [
      { label: "Current AQI", value: "185", status: "Unhealthy" },
      { label: "Active Alerts", value: "12", status: "High priority" },
      { label: "Monitoring Sites", value: "89", status: "All active" }
    ],
    features: [
      {
        title: "Pollution Prediction",
        description: "AI-powered pollution forecasting and trend analysis",
        icon: Brain,
        color: "bg-blue-500",
        path: "/pollution-prediction",
        stats: "95% Accuracy"
      },
      {
        title: "Pollution Sources",
        description: "Track and analyze pollution source contributions",
        icon: PieChart,
        color: "bg-purple-500",
        path: "/pollution-sources",
        stats: "28 Sources"
      },
      {
        title: "Industrial Detection",
        description: "Detect kilns and industrial emitters from satellite imagery using AI",
        icon: ScanSearch,
        color: "bg-red-500",
        path: "/industrial-detection",
        stats: "AI Powered"
      },
      {
        title: "Oil Spill Detection",
        description: "Detect oil spills using Sentinel-1 SAR satellite imagery",
        icon: Ship,
        color: "bg-orange-500",
        path: "/oil-spill-detection",
        stats: "SAR · CDSE"
      },
      {
        title: "Officer Management",
        description: "Manage department officers and their responsibilities",
        icon: Users,
        color: "bg-indigo-500",
        path: "/officers/environmental",
        stats: "Manage Team"
      }
    ]
  },
  {
    title: "Water Resources Department",
    description: "Manage water quality monitoring and oil spill detection",
    icon: Droplets,
    color: "bg-blue-500",
    path: "/water-resources",
    stats: [
      { label: "Water Quality Index", value: "78%", status: "Good" },
      { label: "Active Spills", value: "3", status: "This month" },
      { label: "Monitoring Points", value: "156", status: "All active" }
    ],
    features: [
      {
        title: "Water Quality",
        description: "Real-time water quality monitoring and analysis",
        icon: Droplets,
        color: "bg-blue-500",
        path: "/water-quality",
        stats: "78% Quality"
      },
      {
        title: "Oil Spill Detection",
        description: "Detect and respond to oil spill incidents",
        icon: Ship,
        color: "bg-red-500",
        path: "/oil-spill",
        stats: "32 Detected"
      },
      {
        title: "Water Analysis",
        description: "AI-powered image analysis for water pollution",
        icon: Brain,
        color: "bg-indigo-500",
        path: "/water-analysis",
        stats: "Instant Analysis"
      },
      {
        title: "Officer Management",
        description: "Manage department officers and their responsibilities",
        icon: Users,
        color: "bg-cyan-500",
        path: "/officers/water-resources",
        stats: "Manage Team"
      }
    ]
  },
  {
    title: "Industrial Regulation Department",
    description: "Regulate industrial compliance and handle complaints",
    icon: Factory,
    color: "bg-orange-500",
    path: "/industrial-regulation",
    stats: [
      { label: "Regulated Industries", value: "57", status: "All monitored" },
      { label: "Compliance Rate", value: "91%", status: "+3% this month" },
      { label: "Active Complaints", value: "342", status: "28 today" }
    ],
    features: [
      {
        title: "Industrial Pollution",
        description: "Monitor and regulate industrial pollution sources",
        icon: Factory,
        color: "bg-orange-500",
        path: "/industrial-pollution",
        stats: "57 Industries"
      },
      {
        title: "Complaints",
        description: "Manage and track pollution complaints",
        icon: MessageCircle,
        color: "bg-blue-500",
        path: "/citizen-complaints/pollution",
        stats: "342 Active"
      },
      {
        title: "Voice Complaint",
        description: "Voice-based complaint registration system",
        icon: Mic,
        color: "bg-green-500",
        path: "/voice-complaint",
        stats: "89 Today"
      },
      {
        title: "Officer Management",
        description: "Manage department officers and their responsibilities",
        icon: Users,
        color: "bg-amber-500",
        path: "/officers/industrial-regulation",
        stats: "Manage Team"
      }
    ]
  },
  {
    title: "Administration Department",
    description: "Handle administrative tasks, budget, and communication",
    icon: ClipboardList,
    color: "bg-purple-500",
    path: "/administration",
    stats: [
      { label: "Active Tasks", value: "302", status: "89 in progress" },
      { label: "Budget Utilization", value: "92%", status: "Of allocated" },
      { label: "Staff Members", value: "156", status: "12 departments" }
    ],
    features: [
      {
        title: "Task Management",
        description: "Track and manage departmental tasks and projects",
        icon: ClipboardList,
        color: "bg-blue-500",
        path: "/task-management",
        stats: "302 Tasks"
      },
      {
        title: "Communication",
        description: "Internal communication and coordination system",
        icon: MessageSquare,
        color: "bg-green-500",
        path: "/communication",
        stats: "156 Messages"
      },
      {
        title: "Budget Planning",
        description: "Budget allocation and financial planning",
        icon: Wallet,
        color: "bg-purple-500",
        path: "/budget",
        stats: "$2.4M Budget"
      },
      {
        title: "Officer Management",
        description: "Manage department officers and their responsibilities",
        icon: Users,
        color: "bg-violet-500",
        path: "/officers/administration",
        stats: "Manage Team"
      }
    ]
  },
  {
    title: "Agricultural Department",
    description: "Monitor crop health, pesticide use, and farming impact",
    icon: Leaf,
    color: "bg-yellow-600",
    path: "/agricultural",
    stats: [
      { label: "Crop Yield", value: "+12%", status: "Above avg" },
      { label: "Pesticide Alerts", value: "4", status: "Low risk" },
      { label: "Irrigation Sites", value: "245", status: "Operational" }
    ],
    features: [
      {
        title: "Citizen Complaints",
        description: "Address agricultural and farming-related issues",
        icon: MessageCircle,
        color: "bg-yellow-500",
        path: "/citizen-complaints/agriculture",
        stats: "Active issues"
      },
      {
        title: "Officer Management",
        description: "Manage department officers and their responsibilities",
        icon: Users,
        color: "bg-yellow-600",
        path: "/officers/agricultural",
        stats: "Manage Team"
      }
    ]
  },
  {
    title: "Waste Department",
    description: "Manage urban waste and illegal dumping reports",
    icon: ClipboardList,
    color: "bg-red-600",
    path: "/waste",
    stats: [
      { label: "Waste Collected", value: "45t", status: "Daily avg" },
      { label: "Illegal Sites", value: "23", status: "Under cleanup" },
      { label: "Recycling Rate", value: "34%", status: "+5% increase" }
    ],
    features: [
      {
        title: "Citizen Complaints",
        description: "Handle illegal dumping and waste disposal reports",
        icon: MessageCircle,
        color: "bg-red-500",
        path: "/citizen-complaints/waste",
        stats: "Active issues"
      },
      {
        title: "Site Transformation",
        description: "Generate AI plans for site cleanup and beautification",
        icon: MapPin,
        color: "bg-emerald-500",
        path: "/site-transformation",
        stats: "AI Planning"
      },
      {
        title: "Officer Management",
        description: "Manage department officers and their responsibilities",
        icon: Users,
        color: "bg-red-600",
        path: "/officers/waste",
        stats: "Manage Team"
      }
    ]
  },
  {
    title: "Forest Department",
    description: "Protect wildlife, forests, and biodiversity",
    icon: Mountain,
    color: "bg-emerald-600",
    path: "/forest",
    stats: [
      { label: "Forest Cover", value: "24%", status: "Target: 33%" },
      { label: "Active Patrols", value: "12", status: "24/7" },
      { label: "Wildlife Sightings", value: "45", status: "Increased" }
    ],
    features: [
      {
        title: "Citizen Complaints",
        description: "Report deforestation or wildlife incidents",
        icon: MessageCircle,
        color: "bg-emerald-500",
        path: "/citizen-complaints/forest",
        stats: "Active issues"
      },
      {
        title: "Officer Management",
        description: "Manage department officers and their responsibilities",
        icon: Users,
        color: "bg-emerald-600",
        path: "/officers/forest",
        stats: "Manage Team"
      }
    ]
  },
  {
    title: "Soil Conservation Department",
    description: "Monitor soil health and prevent degradation",
    icon: Mountain,
    color: "bg-amber-700",
    path: "/soil-conservation",
    stats: [
      { label: "Soil Health Index", value: "72", status: "Fair" },
      { label: "Erosion Zones", value: "18", status: "Critical" },
      { label: "Restore Projects", value: "34", status: "Active" }
    ],
    features: [
      {
        title: "Citizen Complaints",
        description: "Address soil erosion and contamination reports",
        icon: MessageCircle,
        color: "bg-amber-500",
        path: "/citizen-complaints/soil",
        stats: "Active issues"
      },
      {
        title: "Officer Management",
        description: "Manage department officers and their responsibilities",
        icon: Users,
        color: "bg-amber-700",
        path: "/officers/soil-conservation",
        stats: "Manage Team"
      }
    ]
  }
];
