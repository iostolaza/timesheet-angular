
// src/app/core/services/timesheet.service.ts

import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { Timesheet, TimesheetEntry, Account } from '../models/timesheet.model';
import { FinancialService } from './financial.service';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { startOfDay, endOfWeek, differenceInHours, parse } from 'date-fns';

@Injectable({
  providedIn: 'root'
})
export class TimesheetService {
  private timesheets: Timesheet[] = JSON.parse(localStorage.getItem('timesheets') || '[]');

  constructor(private financialService: FinancialService) {}

  async createTimesheet(): Promise<string> {
    const id = uuidv4();
    const timesheet: Timesheet = { id, status: 'draft', entries: [], totalHours: 0, owner: 'user1', totalCost: 0 };
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
    
    const start = parse(`${entry.date} ${entry.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
    const end = parse(`${entry.date} ${entry.endTime}`, 'yyyy-MM-dd HH:mm', new Date());
    const hours = differenceInHours(end, start);
    
    const newEntry: TimesheetEntry = { ...entry, id: uuidv4(), hours };
    timesheet.entries.push(newEntry);
    timesheet.totalHours = timesheet.entries.reduce((sum, e) => sum + e.hours, 0);
    
    const validationErrors = this.validateHours(timesheet);
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join('\n'));
    }
    
    localStorage.setItem('timesheets', JSON.stringify(this.timesheets));
  }

  async updateEntry(entry: TimesheetEntry): Promise<void> {
    const timesheet = this.timesheets.find(t => t.id === entry.timesheetId);
    if (!timesheet) throw new Error('Timesheet not found');
    const index = timesheet.entries.findIndex(e => e.id === entry.id);
    if (index === -1) throw new Error('Entry not found');
    
    const start = parse(`${entry.date} ${entry.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
    const end = parse(`${entry.date} ${entry.endTime}`, 'yyyy-MM-dd HH:mm', new Date());
    entry.hours = differenceInHours(end, start);
    
    timesheet.entries[index] = entry;
    timesheet.totalHours = timesheet.entries.reduce((sum, e) => sum + e.hours, 0);
    
    const validationErrors = this.validateHours(timesheet);
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join('\n'));
    }
    
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
    try {
      const accounts = await this.financialService.getAccounts(1).pipe(
        map(accounts => accounts.map(a => ({ id: a.id!, name: a.name })))
      ).toPromise();
      return accounts || [];
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      return [];
    }
  }

  async getAccountName(accountId: number): Promise<string> {
    return this.financialService.getAccountName(accountId);
  }

  validateHours(timesheet: Timesheet): string[] {
    const errors: string[] = [];
    
    const entriesByDate = timesheet.entries.reduce((acc, entry) => {
      const date = entry.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(entry);
      return acc;
    }, {} as Record<string, TimesheetEntry[]>);
    
    Object.entries(entriesByDate).forEach(([date, entries]) => {
      const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
      if (totalHours !== 8) {
        errors.push(`Date ${date} has ${totalHours} hours, expected 8 hours.`);
      }
    });
    
    const weekStart = startOfDay(timesheet.entries[0]?.date ? parse(timesheet.entries[0].date, 'yyyy-MM-dd', new Date()) : new Date());
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const weeklyEntries = timesheet.entries.filter(e => {
      const entryDate = parse(e.date, 'yyyy-MM-dd', new Date());
      return entryDate >= weekStart && entryDate <= weekEnd;
    });
    const weeklyHours = weeklyEntries.reduce((sum, e) => sum + e.hours, 0);
    if (weeklyHours !== 40) {
      errors.push(`Week starting ${weekStart.toISOString().split('T')[0]} has ${weeklyHours} hours, expected 40 hours.`);
    }
    
    return errors;
  }

  getDailySubtotals(timesheetId: string): Observable<{ date: string, accountId: number, accountName: string, hours: number }[]> {
    const timesheet = this.timesheets.find(t => t.id === timesheetId);
    if (!timesheet) return of([]);
    
    const subtotals = timesheet.entries.reduce((acc, entry) => {
      const key = `${entry.date}:${entry.accountId}`;
      if (!acc[key]) {
        acc[key] = { date: entry.date, accountId: entry.accountId, accountName: '', hours: 0 };
      }
      acc[key].hours += entry.hours;
      return acc;
    }, {} as Record<string, { date: string, accountId: number, accountName: string, hours: number }>);
    
    return this.financialService.getAccounts(1).pipe(
      map(accounts => {
        const accountMap = new Map(accounts.map(a => [a.id!, a.name]));
        return Object.values(subtotals).map(subtotal => ({
          ...subtotal,
          accountName: accountMap.get(subtotal.accountId) || 'Unknown'
        }));
      })
    );
  }
}