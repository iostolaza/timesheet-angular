
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
// Update the import path below if the actual location is different
import { TimesheetService } from '../../app/core/services/timesheet.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-timesheet-form',
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
  templateUrl: './timesheet-form.component.html'
})
export class TimesheetFormDialogComponent {
  timesheetForm: FormGroup;
  accounts: { id: string; name: string }[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<TimesheetFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private timesheetService: TimesheetService
  ) {
    this.timesheetForm = this.fb.group({
      date: [this.data.date || '', Validators.required],
      startTime: [this.data.entry?.startTime || '', Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)],
      endTime: [this.data.entry?.endTime || '', Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)],
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