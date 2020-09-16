import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { NoctuaConfirmDialogComponent } from '@noctua/components/confirm-dialog/confirm-dialog.component';
import { CamsReplaceConfirmDialogComponent } from '../dialogs/cams-replace-confirm/cams-replace-confirm.component';
import { CamsReviewChangesDialogComponent } from '../dialogs/cams-review-changes/cams-review-changes.component';

@Injectable({
    providedIn: 'root'
})
export class NoctuaSearchDialogService {

    dialogRef: any;

    constructor(private httpClient: HttpClient,
        private snackBar: MatSnackBar,
        private _matDialog: MatDialog) {
    }

    openSuccessfulSaveToast(message: string, action: string) {
        this.snackBar.open(message, action, {
            duration: 10000,
            verticalPosition: 'top'
        });
    }

    openConfirmDialog(searchCriteria, success): void {
        this.dialogRef = this._matDialog.open(NoctuaConfirmDialogComponent, {
            panelClass: 'noc-search-database-dialog',
            data: {
                searchCriteria: searchCriteria
            },
            width: '600px',
        });
        this.dialogRef.afterClosed()
            .subscribe(response => {
                if (response) {
                    success(response);
                }
            });
    }


    openCamReplaceConfirmDialog(success): void {
        this.dialogRef = this._matDialog.open(CamsReplaceConfirmDialogComponent, {
            panelClass: 'noc-cams-replace-confirm-dialog',
            data: {
                // searchCriteria: searchCriteria
            },
        });
        this.dialogRef.afterClosed()
            .subscribe(response => {
                if (response) {
                    success(response);
                }
            });
    }

    openCamReviewChangesDialog(success): void {
        this.dialogRef = this._matDialog.open(CamsReviewChangesDialogComponent, {
            panelClass: 'noc-cams-review-changes-dialog',
            data: {
                // searchCriteria: searchCriteria
            },
        });
        this.dialogRef.afterClosed()
            .subscribe(response => {
                if (response) {
                    success(response);
                }
            });
    }


}
