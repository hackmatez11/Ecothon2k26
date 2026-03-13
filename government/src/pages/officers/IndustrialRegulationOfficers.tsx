import { Factory } from "lucide-react";
import OfficerManagement from "../OfficerManagement";

const IndustrialRegulationOfficers = () => {
  return (
    <OfficerManagement
      department="industrial_regulation"
      departmentTitle="Industrial Regulation Department"
      icon={Factory}
      color="bg-orange-500/5"
    />
  );
};

export default IndustrialRegulationOfficers;
