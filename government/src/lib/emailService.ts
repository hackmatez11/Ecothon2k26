import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

interface EmailParams {
  officer_name: string;
  officer_email: string;
  complaint_id: string;
  description: string;
  location: string;
  severity: string;
  assignment_reason: string;
  [key: string]: string;
}

/**
 * Sends an email notification to an officer when a complaint is assigned to them.
 * This service uses EmailJS and requires valid credentials in .env
 */
export async function sendAssignmentEmail(params: EmailParams): Promise<boolean> {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn('EmailJS credentials missing. Email notification skipped.');
    return false;
  }

  try {
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      params,
      PUBLIC_KEY
    );

    if (response.status === 200) {
      console.log('Assignment email sent successfully to:', params.officer_email);
      return true;
    } else {
      console.error('Failed to send assignment email:', response.text);
      return false;
    }
  } catch (error) {
    console.error('Error sending assignment email:', error);
    return false;
  }
}
