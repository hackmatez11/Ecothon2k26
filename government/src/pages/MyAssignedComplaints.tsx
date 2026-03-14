import { useEffect, useState } from 'react';
import { supabase, Complaint } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, MapPin, Clock, Mail, Loader2, Inbox, CheckCircle2, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';

const SEVERITY_CONFIG = {
  low: { label: 'Low', className: 'bg-green-500/20 text-green-300 border-green-500/30' },
  medium: { label: 'Medium', className: 'bg-yellow-500/20 text-yellow-300 border-yellow-