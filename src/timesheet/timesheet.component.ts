// src/app/timesheet/timesheet.component.ts
import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { TimesheetFormDialogComponent } from './timesheet-form/timesheet-form.component';
import { DocumentViewDialogComponent } from './document-view/document-view.component';

interface TimesheetEntry {
  id: number;
  date: string;
  hours: number;
  description: string;
  document?: string;
}

@Component({
  selector: 'app-timesheet',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatTableModule],
  templateUrl: './timesheet.component.html',
//   styleUrls: ['./timesheet.component.css']
})
export class TimesheetComponent implements OnInit {
  displayedColumns: string[] = ['date', 'hours', 'description', 'actions'];
  timesheetEntries: TimesheetEntry[] = [
    { id: 1, date: '2025-10-14', hours: 8, description: 'Client meeting', document: 'meeting_notes.pdf' },
    { id: 2, date: '2025-10-15', hours: 6, description: 'Project development' }
  ];

  constructor(public dialog: MatDialog) {}

  ngOnInit() {}

  openAddDialog(): void {
    const dialogRef = this.dialog.open(TimesheetFormDialogComponent, {
      width: '400px',
      data: { mode: 'add' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.timesheetEntries.push({
          id: this.timesheetEntries.length + 1,
          ...result
        });
        this.timesheetEntries = [...this.timesheetEntries];
      }
    });
  }

  openEditDialog(entry: TimesheetEntry): void {
    const dialogRef = this.dialog.open(TimesheetFormDialogComponent, {
      width: '400px',
      data: { mode: 'edit', entry }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const index = this.timesheetEntries.findIndex(e => e.id === entry.id);
        this.timesheetEntries[index] = { id: entry.id, ...result };
        this.timesheetEntries = [...this.timesheetEntries];
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
