import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { assignComplaintToOfficer } from "@/lib/officerAssignment";
import { toast } from "sonner";

/**
 * Background component that monitors for new complaints and auto-assigns them to officers
 */
export function ComplaintAssignmentMonitor() {
  useEffect(() => {
    // Subscribe to new complaints
    const channel = supabase
      .channel("complaint-assignments")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "complaints",
        },
        async (payload) => {
          const complaint = payload.new;
          
          // Only process if not already assigned
          if (complaint.assigned_officer_id) {
            return;
          }

          console.log("New complaint detected, assigning to officer...", complaint);

          try {
            const assignment = await assignComplaintToOfficer({
              id: complaint.id,
              description: complaint.description,
              department: complaint.department,
              severity: complaint.severity,
              ai_analysis: complaint.ai_analysis,
              location: complaint.location,
            });

            if (assignment) {
              toast.success(
                `Complaint assigned to ${assignment.officerName}`,
                {
                  description: assignment.reason,
                  duration: 5000,
                }
              );
            } else {
              toast.warning(
                "Complaint received but no officers available",
                {
                  description: "Please assign manually from the complaints dashboard",
                  duration: 5000,
                }
              );
            }
          } catch (error) {
            console.error("Error in auto-assignment:", error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return null; // This is a background component with no UI
}
