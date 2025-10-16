// src/app/components/timesheet/subcards/document-view/document-view.component.ts
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-document-view-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './document-view.component.html',
  // styleUrls: ['./document-view-dialog.component.css']
})
export class DocumentViewDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DocumentViewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { document: string }
  ) {}

  onClose() {
    this.dialogRef.close();
  }
}
