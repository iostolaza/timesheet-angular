
// src/timesheet/review-page/review-page.component.ts
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-review-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, CommonModule],
  templateUrl: './review-page.component.html',
//   styleUrls: ['./review-dialog.component.css']
})
export class ReviewDialogComponent {
  reviewForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ReviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { timesheet: any }
  ) {
    this.reviewForm = this.fb.group({
      approved: [true],
      rejectionReason: ['']
    });
  }

  onSubmit() {
    if (this.reviewForm.valid) {
      this.dialogRef.close(this.reviewForm.value);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
