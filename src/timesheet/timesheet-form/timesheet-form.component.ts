
// src/app/timesheet/timesheet-form/timesheet-form.component.ts

import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { TimesheetService } from '../../app/core/services/timesheet.service';
import { TimesheetEntry, Account } from '../../app/core/models/timesheet.model';

@Component({
  selector: 'app-timesheet-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    CommonModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'add' ? 'Add Timesheet Entry' : 'Edit Timesheet Entry' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="timesheetForm">
        <mat-form-field class="form-field">
          <mat-label>Date</mat-label>
          <input matInput formControlName="date" type="date" required>
          <mat-error *ngIf="timesheetForm.get('date')?.hasError('required')">Date is required</mat-error>
        </mat-form-field>
        <mat-form-field class="form-field">
          <mat-label>Start Time</mat-label>
          <input matInput formControlName="startTime" type="time" required>
          <mat-error *ngIf="timesheetForm.get('startTime')?.hasError('required')">Start time is required</mat-error>
          <mat-error *ngIf="timesheetForm.get('startTime')?.hasError('pattern')">Invalid time format</mat-error>
        </mat-form-field>
        <mat-form-field class="form-field">
          <mat-label>End Time</mat-label>
          <input matInput formControlName="endTime" type="time" required>
          <mat-error *ngIf="timesheetForm.get('endTime')?.hasError('required')">End time is required</mat-error>
          <mat-error *ngIf="timesheetForm.get('endTime')?.hasError('pattern')">Invalid time format</mat-error>
        </mat-form-field>
        <mat-form-field class="form-field">
          <mat-label>Hours</mat-label>
          <input matInput formControlName="hours" readonly>
          <mat-error *ngIf="timesheetForm.get('hours')?.hasError('required')">Hours are required</mat-error>
          <mat-error *ngIf="timesheetForm.get('hours')?.hasError('min')">Hours must be positive</mat-error>
        </mat-form-field>
        <mat-form-field class="form-field">
          <mat-label>Account</mat-label>
          <mat-select formControlName="accountId" required>
            <mat-option *ngFor="let account of accounts" [value]="account.id">{{ account.name }}</mat-option>
          </mat-select>
          <mat-error *ngIf="timesheetForm.get('accountId')?.hasError('required')">Account is required</mat-error>
        </mat-form-field>
        <mat-form-field class="form-field">
          <mat-label>Description</mat-label>
          <input matInput formControlName="description" required>
          <mat-error *ngIf="timesheetForm.get('description')?.hasError('required')">Description is required</mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-button color="primary" (click)="onSubmit()" [disabled]="!timesheetForm.valid">Save</button>
    </mat-dialog-actions>
  `
})
export class TimesheetFormDialogComponent {
  timesheetForm: FormGroup;
  accounts: Account[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<TimesheetFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mode: 'add' | 'edit', date?: string, startTime?: string, endTime?: string, entry?: TimesheetEntry },
    private timesheetService: TimesheetService
  ) {
    this.timesheetForm = this.fb.group({
      date: [this.data.date || this.data.entry?.date || '', Validators.required],
      startTime: [this.data.startTime || this.data.entry?.startTime || '', [Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
      endTime: [this.data.endTime || this.data.entry?.endTime || '', [Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
      hours: [{ value: this.data.entry?.hours || '', disabled: true }, [Validators.required, Validators.min(0)]],
      description: [this.data.entry?.description || '', Validators.required],
      accountId: [this.data.entry?.accountId || '', Validators.required]
    });

    this.timesheetForm.get('startTime')?.valueChanges.subscribe(() => this.calculateHours());
    this.timesheetForm.get('endTime')?.valueChanges.subscribe(() => this.calculateHours());
    this.loadAccounts();
  }

  async loadAccounts() {
    this.accounts = await this.timesheetService.getAccounts();
  }

  calculateHours() {
    const startTime = this.timesheetForm.get('startTime')?.value;
    const endTime = this.timesheetForm.get('endTime')?.value;
    if (startTime && endTime) {
      const start = new Date(`1970-01-01T${startTime}:00`);
      const end = new Date(`1970-01-01T${endTime}:00`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      this.timesheetForm.get('hours')?.setValue(hours > 0 ? hours : '');
    }
  }

  onSubmit() {
    if (this.timesheetForm.valid) {
      this.dialogRef.close(this.timesheetForm.getRawValue());
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}