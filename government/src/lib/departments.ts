import { 
  Leaf, Droplets, Factory, ClipboardList, 
  Brain, PieChart, Mountain, Ship, 
  MessageCircle, Mic, MessageSquare, Wallet
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
        title: "Eco Products",
        description: "Manage and promote environmentally friendly products",
        icon: Leaf,
        color: "bg-green-500",
        path: "/eco-products",
        stats: "156 Products"
      },
      {
        title: "Soil Analysis",
        description: "Monitor soil health and contamination levels",
        icon: Mountain,
        color: "bg-orange-500",
        path: "/soil-analysis",
        stats: "45 Sites"
      }
    ]
  },
  {
    title: "Water Department",
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
      }
    ]
  },
  {
    title: "Industrial Regulation",
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
        path: "/complaints",
        stats: "342 Active"
      },
      {
        title: "Voice Complaint",
        description: "Voice-based complaint registration system",
        icon: Mic,
        color: "bg-green-500",
        path: "/voice-complaint",
        stats: "89 Today"
      }
    ]
  },
  {
    title: "Administration",
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
      }
    ]
  }
];
