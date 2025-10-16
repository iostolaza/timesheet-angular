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
    @Inject(TimesheetService) private timesheetService: TimesheetService
  ) {
    this.timesheetForm = this.fb.group({
      date: [this.data.date || '', Validators.required],
      hours: ['', [Validators.required, Validators.min(0)]],
      description: ['', Validators.required],
      accountId: ['', Validators.required]
    });
    this.loadAccounts();
  }

  async loadAccounts() {
    this.accounts = await this.timesheetService.getAccounts();
  }

  onSubmit() {
    if (this.timesheetForm.valid) {
      this.dialogRef.close(this.timesheetForm.value);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
