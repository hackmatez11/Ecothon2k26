import { Trash2 } from "lucide-react";
import OfficerManagement from "../OfficerManagement";

const WasteOfficers = () => {
  return (
    <OfficerManagement
      department="waste"
      departmentTitle="Waste Department"
      icon={Trash2}
      color="bg-red-500/5"
    />
  );
};

export default WasteOfficers;
