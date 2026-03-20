import { HeartPulse } from "lucide-react";
import OfficerManagement from "../OfficerManagement";

const HealthCareOfficers = () => {
  return (
    <OfficerManagement
      department="healthcare"
      departmentTitle="HealthCare Department"
      icon={HeartPulse}
      color="bg-rose-500/5"
    />
  );
};

export default HealthCareOfficers;
