
// src/app/timesheet/calendar-page/calendar-page.component.ts

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import {
  CalendarEvent,
  CalendarPreviousViewDirective,
  CalendarTodayDirective,
  CalendarNextViewDirective,
  CalendarWeekViewComponent,
  CalendarDatePipe,
  provideCalendar,
  DateAdapter
} from 'angular-calendar';
import { WeekViewHourSegment } from 'calendar-utils';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { TimesheetService } from '../../app/core/services/timesheet.service';
import { FinancialService } from '../../app/core/services/financial.service';
import { TimesheetEntry, Timesheet } from '../../app/core/models/timesheet.model';
import { TimesheetFormDialogComponent } from '../timesheet-form/timesheet-form.component';
import { CustomEventTitleFormatter } from '../../app/core/services/custom-event-title-formatter.service';
import { fromEvent } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { addDays, addMinutes, endOfWeek, differenceInHours, parse, format } from 'date-fns';
import { inject } from '@angular/core';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTableModule,
    CalendarPreviousViewDirective,
    CalendarTodayDirective,
    CalendarNextViewDirective,
    CalendarWeekViewComponent,
    CalendarDatePipe
  ],
  providers: [
    provideCalendar(
      { provide: DateAdapter, useFactory: adapterFactory },
      {
        eventTitleFormatter: {
          provide: CalendarEventTitleFormatter,
          useClass: CustomEventTitleFormatter
        }
      }
    )
  ],
  templateUrl: './calendar-page.component.html',
  styleUrls: ['./calendar-page.component.scss']
})
export class CalendarPageComponent implements OnInit {
  viewDate = new Date();
  events: CalendarEvent[] = [];
  dragToCreateActive = false;
  weekStartsOn: 0 = 0;
  currentTimesheetId: string | null = null;
  subtotalsDataSource = new MatTableDataSource<{ date: string, accountId: number, accountName: string, hours: number }>();
  subtotalColumns = ['date', 'accountName', 'hours'];

  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private timesheetService = inject(TimesheetService);
  private financialService = inject(FinancialService);

  async ngOnInit() {
    this.currentTimesheetId = await this.timesheetService.createTimesheet();
    await this.loadTimesheetEntries();
    await this.loadSubtotals();
  }

  async loadTimesheetEntries() {
    const timesheets = await this.timesheetService.getTimesheets('draft');
    const entries: TimesheetEntry[] = timesheets.flatMap((ts: Timesheet) => ts.entries || []);
    this.events = await Promise.all(
      entries.map(async (entry: TimesheetEntry) => ({
        id: entry.id,
        title: `${await this.timesheetService.getAccountName(entry.accountId)}: ${entry.hours} hours - ${entry.description}`,
        start: parse(`${entry.date} ${entry.startTime}`, 'yyyy-MM-dd HH:mm', new Date()),
        end: parse(`${entry.date} ${entry.endTime}`, 'yyyy-MM-dd HH:mm', new Date()),
        meta: { entry }
      }))
    );
    this.refresh();
  }

  async loadSubtotals() {
    if (this.currentTimesheetId) {
      this.timesheetService.getDailySubtotals(this.currentTimesheetId).subscribe((subtotals: { date: string, accountId: number, accountName: string, hours: number }[]) => {
        this.subtotalsDataSource.data = subtotals;
        this.refresh();
      });
    }
  }

  startDragToCreate(segment: WeekViewHourSegment, mouseDownEvent: MouseEvent, segmentElement: HTMLElement) {
    if (!this.currentTimesheetId) return;
    
    const dragToSelectEvent: CalendarEvent = {
      id: this.events.length.toString(),
      title: 'New event',
      start: segment.date,
      meta: { tmpEvent: true }
    };
    this.events = [...this.events, dragToSelectEvent];
    const segmentPosition = segmentElement.getBoundingClientRect();
    this.dragToCreateActive = true;
    const endOfView = endOfWeek(this.viewDate, { weekStartsOn: this.weekStartsOn });

    fromEvent<MouseEvent>(document, 'mousemove')
      .pipe(
        finalize(() => {
          delete dragToSelectEvent.meta.tmpEvent;
          this.dragToCreateActive = false;
          this.openTimesheetForm(dragToSelectEvent);
          this.refresh();
        }),
        takeUntil(fromEvent(document, 'mouseup'))
      )
      .subscribe((mouseMoveEvent: MouseEvent) => {
        const minutesDiff = Math.ceil((mouseMoveEvent.clientY - segmentPosition.top) / 30) * 30;
        const daysDiff = Math.floor((mouseMoveEvent.clientX - segmentPosition.left) / segmentPosition.width);
        const newEnd = addDays(addMinutes(segment.date, minutesDiff), daysDiff);
        if (newEnd > segment.date && newEnd <= endOfView) {
          dragToSelectEvent.end = newEnd;
        }
        this.refresh();
      });
  }

  openTimesheetForm(event: CalendarEvent) {
    if (!this.currentTimesheetId) return;
    
    const dialogRef = this.dialog.open(TimesheetFormDialogComponent, {
      width: '400px',
      data: {
        mode: 'add',
        date: format(event.start, 'yyyy-MM-dd'),
        startTime: format(event.start, 'HH:mm'),
        endTime: event.end ? format(event.end, 'HH:mm') : undefined
      }
    });

    dialogRef.afterClosed().subscribe(async (result: Partial<TimesheetEntry>) => {
      if (result && result.date && result.startTime && result.endTime && result.accountId && result.description) {
        try {
          await this.timesheetService.addEntry({
            timesheetId: this.currentTimesheetId!,
            date: result.date,
            startTime: result.startTime,
            endTime: result.endTime,
            description: result.description,
            accountId: result.accountId,
            hours: differenceInHours(
              parse(`${result.date} ${result.endTime}`, 'yyyy-MM-dd HH:mm', new Date()),
              parse(`${result.date} ${result.startTime}`, 'yyyy-MM-dd HH:mm', new Date())
            )
          });
          await this.loadTimesheetEntries();
          await this.loadSubtotals();
        } catch (error: any) {
          alert(error.message);
        }
      } else {
        this.events = this.events.filter(e => e !== event);
        this.refresh();
      }
    });
  }

  handleEventClick({ event }: { event: CalendarEvent }) {
    if (!this.currentTimesheetId) return;
    const entry: TimesheetEntry = event.meta.entry;
    
    const dialogRef = this.dialog.open(TimesheetFormDialogComponent, {
      width: '400px',
      data: { mode: 'edit', entry }
    });

    dialogRef.afterClosed().subscribe(async (result: Partial<TimesheetEntry>) => {
      if (result && result.date && result.startTime && result.endTime && result.accountId && result.description) {
        try {
          await this.timesheetService.updateEntry({
            id: entry.id,
            timesheetId: this.currentTimesheetId!,
            date: result.date,
            startTime: result.startTime,
            endTime: result.endTime,
            description: result.description,
            accountId: result.accountId,
            hours: differenceInHours(
              parse(`${result.date} ${result.endTime}`, 'yyyy-MM-dd HH:mm', new Date()),
              parse(`${result.date} ${result.startTime}`, 'yyyy-MM-dd HH:mm', new Date())
            )
          });
          await this.loadTimesheetEntries();
          await this.loadSubtotals();
        } catch (error: any) {
          alert(error.message);
        }
      }
    });
  }

  private refresh() {
    this.events = [...this.events];
    this.cdr.detectChanges();
  }
}