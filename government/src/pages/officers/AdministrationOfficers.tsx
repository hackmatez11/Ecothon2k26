import { ClipboardList } from "lucide-react";
import OfficerManagement from "../OfficerManagement";

const AdministrationOfficers = () => {
  return (
    <OfficerManagement
      department="administration"
      departmentTitle="Administration Department"
      icon={ClipboardList}
      color="bg-purple-500/5"
    />
  );
};

export default AdministrationOfficers;
