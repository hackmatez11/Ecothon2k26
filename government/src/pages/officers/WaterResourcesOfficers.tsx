import { Droplets } from "lucide-react";
import OfficerManagement from "../OfficerManagement";

const WaterResourcesOfficers = () => {
  return (
    <OfficerManagement
      department="water_resources"
      departmentTitle="Water Resources Department"
      icon={Droplets}
      color="bg-blue-500/5"
    />
  );
};

export default WaterResourcesOfficers;
