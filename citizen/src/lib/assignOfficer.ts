import { supabase } from "./supabase";
import { sendAssignmentEmail } from "../../../government/src/lib/emailService";

// Maps citizen-side department keys to officer table department values
const DEPT_MAP: Record<string, string> = {
  environment: "environment",
  water: "water_resources",
  pollution: "industrial_regulation",
  agriculture: "agricultural",
  waste: "waste",
  forest: "forest",
  soil: "soil_conservation",
};

interface Officer {
  id: string;
  name: string;
  email: string;
  designation: string;
  work_domain: string;
}

/**
 * Called right after a complaint is inserted.
 * Picks the best-matching active officer from the department and updates the complaint.
 */
export async function assignOfficerToComplaint(
  complaintId: string,
  department: string,
  description: string,
  aiAnalysis: string
): Promise<string | null> {
  try {
    const mappedDept = DEPT_MAP[department] ?? department;

    const { data: officers, error } = await supabase
      .from("officers")
      .select("id, name, email, designation, work_domain")
      .eq("department", mappedDept)
      .eq("is_active", true);

    if (error || !officers || officers.length === 0) {
      console.warn(`No officers found for department: ${mappedDept}`);
      return null;
    }

    const picked = pickBestOfficer(officers, description, aiAnalysis);

    const { error: updateError } = await supabase
      .from("complaints")
      .update({
        assigned_officer_id: picked.id,
        assigned_officer_name: picked.name,
        assignment_reason: `Auto-assigned based on work domain: ${picked.work_domain}`,
        status: "assigned",
      })
      .eq("id", complaintId);

    if (updateError) {
      console.error("Failed to update complaint with officer:", updateError.message);
      return null;
    }

    // Send email notification to the assigned officer
    await sendAssignmentEmail({
      officer_name: picked.name,
      officer_email: picked.email,
      complaint_id: complaintId,
      description: description,
      location: "Not specified", // Citizen app doesn't always have simple location string here
      severity: "medium", // Default or extract if possible
      assignment_reason: `Auto-assigned based on work domain: ${picked.work_domain}`,
    });

    return picked.name;
  } catch (err) {
    console.error("assignOfficerToComplaint error:", err);
    return null;
  }
}

/** Score officers by keyword overlap with complaint text, return best match */
function pickBestOfficer(officers: Officer[], description: string, aiAnalysis: string): Officer {
  const text = `${description} ${aiAnalysis}`.toLowerCase();

  let best = officers[0];
  let bestScore = -1;

  for (const officer of officers) {
    const words = officer.work_domain.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const score = words.filter(w => text.includes(w)).length;
    if (score > bestScore) {
      bestScore = score;
      best = officer;
    }
  }

  return best;
}
