// src/app/timesheet/calendar-page/calendar-page.component.ts
import { Component, OnInit, Inject } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { MatDialog } from '@angular/material/dialog';
import { TimesheetFormDialogComponent } from '../timesheet-form/timesheet-form.component';
import { TimesheetService } from '../../app/core/services/timesheet.service';
import { CommonModule } from '@angular/common';

interface TimesheetEntry {
  id: string;
  date: string;
  hours: number;
  description: string;
  accountId: string;
  timesheetId: string;
}

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [FullCalendarModule, CommonModule],
  templateUrl: './calendar-page.component.html'
})
export class CalendarPageComponent implements OnInit {
  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, interactionPlugin],
    dateClick: this.handleDateClick.bind(this),
    events: []
  };
  currentTimesheetId: string | null = null;

  constructor(
    private dialog: MatDialog,
    @Inject(TimesheetService) private timesheetService: TimesheetService
  ) {}

  async ngOnInit() {
    this.currentTimesheetId = await this.timesheetService.createTimesheet();
    this.loadTimesheetEntries();
  }

  async loadTimesheetEntries() {
    const timesheets = await this.timesheetService.getTimesheets('draft');
    const entries: TimesheetEntry[] = timesheets.flatMap((ts: any) => ts.entries || []);
    this.calendarOptions.events = entries.map((entry: TimesheetEntry) => ({
      title: `${entry.hours} hours - ${entry.description}`,
      date: entry.date
    }));
  }

  handleDateClick(arg: { dateStr: string }) {
    if (!this.currentTimesheetId) return;
    const dialogRef = this.dialog.open(TimesheetFormDialogComponent, {
      width: '400px',
      data: { date: arg.dateStr, mode: 'add' }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        await this.timesheetService.addEntry({
          date: result.date,
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
