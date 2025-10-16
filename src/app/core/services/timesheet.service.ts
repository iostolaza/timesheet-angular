// src/app/core/services/timesheet.service.ts
import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { Timesheet, TimesheetEntry, Account } from '../models/timesheet.model';

@Injectable({
  providedIn: 'root'
})
export class TimesheetService {
  private timesheets: Timesheet[] = JSON.parse(localStorage.getItem('timesheets') || '[]');
  private accounts: Account[] = [
    { id: 'acc1', name: 'Client A' },
    { id: 'acc2', name: 'Client B' }
  ];

  async createTimesheet(): Promise<string> {
    const id = uuidv4();
    const timesheet: Timesheet = { id, status: 'draft', entries: [], totalHours: 0, totalCost: 0, owner: 'user1' };
    this.timesheets.push(timesheet);
    localStorage.setItem('timesheets', JSON.stringify(this.timesheets));
    return id;
  }

  async getTimesheets(status?: string): Promise<Timesheet[]> {
    return status ? this.timesheets.filter(t => t.status === status) : this.timesheets;
  }

  async addEntry(entry: Omit<TimesheetEntry, 'id'>): Promise<void> {
    const timesheet = this.timesheets.find(t => t.id === entry.timesheetId);
    if (!timesheet) throw new Error('Timesheet not found');
    const newEntry: TimesheetEntry = { ...entry, id: uuidv4() };
    timesheet.entries.push(newEntry);
    timesheet.totalHours = timesheet.entries.reduce((sum, e) => sum + e.hours, 0);
    localStorage.setItem('timesheets', JSON.stringify(this.timesheets));
  }

  async updateEntry(entry: TimesheetEntry): Promise<void> {
    const timesheet = this.timesheets.find(t => t.id === entry.timesheetId);
    if (!timesheet) throw new Error('Timesheet not found');
    const index = timesheet.entries.findIndex(e => e.id === entry.id);
    if (index === -1) throw new Error('Entry not found');
    timesheet.entries[index] = entry;
    timesheet.totalHours = timesheet.entries.reduce((sum, e) => sum + e.hours, 0);
    localStorage.setItem('timesheets', JSON.stringify(this.timesheets));
  }

  async submitTimesheet(timesheetId: string): Promise<void> {
    const timesheet = this.timesheets.find(t => t.id === timesheetId);
    if (!timesheet) throw new Error('Timesheet not found');
    timesheet.status = 'submitted';
    localStorage.setItem('timesheets', JSON.stringify(this.timesheets));
  }

  async approveTimesheet(timesheetId: string, entries: TimesheetEntry[]): Promise<void> {
    const timesheet = this.timesheets.find(t => t.id === timesheetId);
    if (!timesheet) throw new Error('Timesheet not found');
    timesheet.status = 'approved';
    timesheet.entries = entries;
    localStorage.setItem('timesheets', JSON.stringify(this.timesheets));
  }

  async rejectTimesheet(timesheetId: string, rejectionReason: string): Promise<void> {
    const timesheet = this.timesheets.find(t => t.id === timesheetId);
    if (!timesheet) throw new Error('Timesheet not found');
    timesheet.status = 'rejected';
    timesheet.rejectionReason = rejectionReason;
    localStorage.setItem('timesheets', JSON.stringify(this.timesheets));
  }

  async getAccounts(): Promise<Account[]> {
    return this.accounts;
  }
}