// src/app/timesheet/timesheet.component.ts
import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { TimesheetFormDialogComponent } from './timesheet-form/timesheet-form.component';
import { DocumentViewDialogComponent } from './document-view/document-view.component';
import { TimesheetService } from '../app/core/services/timesheet.service';
import { AuthService } from '../app/core/services/auth.service';

interface TimesheetEntry {
  id: string;
  date: string;
  hours: number;
  description: string;
  accountId: string;
  timesheetId: string;
  document?: string;
}

@Component({
  selector: 'app-timesheet',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatTableModule],
  templateUrl: './timesheet.component.html'
})
export class TimesheetComponent implements OnInit {
  displayedColumns: string[] = ['date', 'hours', 'description', 'actions'];
  timesheetEntries: TimesheetEntry[] = [];
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
    this.timesheetEntries = timesheets
      .filter(ts => ts.id === this.currentTimesheetId)
      .flatMap(ts =>
        (ts.entries || []).map(entry => ({
          ...entry,
          timesheetId: ts.id
        }))
      );
  }

  openAddDialog(): void {
    if (!this.currentTimesheetId) return;
    const dialogRef = this.dialog.open(TimesheetFormDialogComponent, {
      width: '400px',
      data: { mode: 'add' }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result && this.currentTimesheetId) {
        await this.timesheetService.addEntry({
          date: result.date,
          hours: result.hours,
          description: result.description,
          accountId: result.accountId,
          timesheetId: this.currentTimesheetId
        });
        this.loadTimesheetEntries();
      }
    });
  }

  openEditDialog(entry: TimesheetEntry): void {
    const dialogRef = this.dialog.open(TimesheetFormDialogComponent, {
      width: '400px',
      data: { mode: 'edit', entry }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result && this.currentTimesheetId) {
        await this.timesheetService.addEntry({
          id: entry.id,
          date: result.date,
          hours: result.hours,
          description: result.description,
          accountId: result.accountId,
          timesheetId: this.currentTimesheetId
        });
        this.loadTimesheetEntries();
      }
    });
  }

  openDocumentView(entry: TimesheetEntry): void {
    this.dialog.open(DocumentViewDialogComponent, {
      width: '500px',
      data: { document: entry.document }
    });
  }
}
