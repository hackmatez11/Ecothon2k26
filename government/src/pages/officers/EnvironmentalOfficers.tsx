import { Leaf } from "lucide-react";
import OfficerManagement from "../OfficerManagement";

const EnvironmentalOfficers = () => {
  return (
    <OfficerManagement
      department="environment"
      departmentTitle="Environmental Department"
      icon={Leaf}
      color="bg-green-500/5"
    />
  );
};

export default EnvironmentalOfficers;
