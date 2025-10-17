// src/app/core/models/timesheet.model.ts
export interface Timesheet {
  id: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  entries: TimesheetEntry[];
  totalHours: number;
  totalCost: number;
  rejectionReason?: string;
  owner: string;
}

export interface TimesheetEntry {
  id: string;
  date: string;
  startTime?: string; // e.g., "09:00"
  endTime?: string; // e.g., "12:00"
  hours: number;
  description: string;
  accountId: string;
  timesheetId: string;
  document?: string;
}

export interface Account {
  id: string;
  name: string;
}