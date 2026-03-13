import { Mountain } from "lucide-react";
import OfficerManagement from "../OfficerManagement";

const SoilConservationOfficers = () => {
  return (
    <OfficerManagement
      department="soil_conservation"
      departmentTitle="Soil Conservation Department"
      icon={Mountain}
      color="bg-amber-500/5"
    />
  );
};

export default SoilConservationOfficers;
