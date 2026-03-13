import { Leaf } from "lucide-react";
import OfficerManagement from "../OfficerManagement";

const AgriculturalOfficers = () => {
  return (
    <OfficerManagement
      department="agricultural"
      departmentTitle="Agricultural Department"
      icon={Leaf}
      color="bg-yellow-500/5"
    />
  );
};

export default AgriculturalOfficers;
