import { Trees } from "lucide-react";
import OfficerManagement from "../OfficerManagement";

const ForestOfficers = () => {
  return (
    <OfficerManagement
      department="forest"
      departmentTitle="Forest Department"
      icon={Trees}
      color="bg-emerald-500/5"
    />
  );
};

export default ForestOfficers;
