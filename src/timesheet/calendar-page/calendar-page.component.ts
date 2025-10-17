
// src/app/timesheet/calendar-page/calendar-page.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { MatDialog } from '@angular/material/dialog';
import { TimesheetFormDialogComponent } from '../timesheet-form/timesheet-form.component';
// Update the import path below if the actual location is different
import { TimesheetService } from '../../app/core/services/timesheet.service';
import { CommonModule } from '@angular/common';
// Update the import path below if the actual location is different
import { TimesheetEntry } from '../../app/core/models/timesheet.model';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [FullCalendarModule, CommonModule],
  templateUrl: './calendar-page.component.html'
})
export class CalendarPageComponent implements OnInit {
  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    dateClick: this.handleDateClick.bind(this),
    events: [],
    eventClick: this.handleEventClick.bind(this)
  };
  currentTimesheetId: string | null = null;
  private timesheetService = inject(TimesheetService);
  private dialog = inject(MatDialog);

  async ngOnInit() {
    this.currentTimesheetId = await this.timesheetService.createTimesheet();
    this.loadTimesheetEntries();
  }

  async loadTimesheetEntries() {
    const timesheets = await this.timesheetService.getTimesheets('draft');
    const entries: TimesheetEntry[] = timesheets.flatMap((ts: any) => ts.entries || []);
    this.calendarOptions.events = await Promise.all(
      entries.map(async (entry: TimesheetEntry) => ({
        title: `${await this.timesheetService.getAccountName(entry.accountId)}: ${entry.hours} hours - ${entry.description}`,
        start: entry.startTime ? `${entry.date}T${entry.startTime}` : entry.date,
        end: entry.endTime ? `${entry.date}T${entry.endTime}` : undefined,
        extendedProps: { entry }
      }))
    );
  }

  handleDateClick(arg: { dateStr: string; view: any }) {
    if (!this.currentTimesheetId) return;
    const dialogRef = this.dialog.open(TimesheetFormDialogComponent, {
      width: '400px',
      data: { date: arg.dateStr.split('T')[0], mode: 'add' }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        await this.timesheetService.addEntry({
          date: result.date,
          startTime: result.startTime,
          endTime: result.endTime,
          hours: result.hours,
          description: result.description,
          accountId: result.accountId,
          timesheetId: this.currentTimesheetId!
        });
        this.loadTimesheetEntries();
      }
    });
  }

  handleEventClick(arg: { event: any }) {
    if (!this.currentTimesheetId) return;
    const entry: TimesheetEntry = arg.event.extendedProps.entry;
    const dialogRef = this.dialog.open(TimesheetFormDialogComponent, {
      width: '400px',
      data: { mode: 'edit', entry }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        await this.timesheetService.updateEntry({
          id: entry.id,
          date: result.date,
          startTime: result.startTime,
          endTime: result.endTime,
          hours: result.hours,
          description: result.description,
          accountId: result.accountId,
          timesheetId: this.currentTimesheetId!
        });
        this.loadTimesheetEntries();
      }
    });
  }
}