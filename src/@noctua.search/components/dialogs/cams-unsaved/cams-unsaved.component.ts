
import { Component, OnDestroy, OnInit, Inject, NgZone, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';


import {
  Cam,
  NoctuaUserService,
  NoctuaFormConfigService,
  CamsService,
  CamService
} from 'noctua-form-base';

import { takeUntil } from 'rxjs/operators';
import { NoctuaSearchService } from '../../../services/noctua-search.service';
import { noctuaAnimations } from '@noctua/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoctuaReviewSearchService } from '../../../services/noctua-review-search.service';
import { NoctuaSearchDialogService } from '../../../services/dialog.service';
import { NoctuaSearchMenuService } from '../../../services/search-menu.service';
import { NoctuaConfirmDialogService } from '@noctua/components/confirm-dialog/confirm-dialog.service';
import { LeftPanel, MiddlePanel } from '../../../models/menu-panels';
import { ReviewMode } from '../../../models/review-mode';

@Component({
  selector: 'noc-cams-unsaved-dialog',
  templateUrl: './cams-unsaved.component.html',
  styleUrls: ['./cams-unsaved.component.scss'],
  animations: noctuaAnimations,
})
export class CamsUnsavedDialogComponent implements OnInit, OnDestroy, AfterViewInit {
  cams: Cam[] = []
  summary;

  private _unsubscribeAll: Subject<any>;

  constructor
    (
      private _matDialogRef: MatDialogRef<CamsUnsavedDialogComponent>,
      private camsService: CamsService,
      private zone: NgZone,
      public camService: CamService,
      public noctuaConfigService: NoctuaFormConfigService,
      private confirmDialogService: NoctuaConfirmDialogService,
      public noctuaSearchDialogService: NoctuaSearchDialogService,
      public noctuaUserService: NoctuaUserService,
      public noctuaSearchMenuService: NoctuaSearchMenuService,
      public noctuaSearchService: NoctuaSearchService,
      public noctuaFormConfigService: NoctuaFormConfigService,
      private noctuaReviewSearchService: NoctuaReviewSearchService,) {
    this._unsubscribeAll = new Subject();

  }

  ngOnInit(): void {

    this.camsService.onCamsChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(cams => {
        if (!cams) {
          return;
        }
        this.cams = cams;
      });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.camsService.onCamsCheckoutChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(summary => {
          if (!summary) {
            return;
          }

          this.summary = summary;
        });
    }, 1);
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }


  remove(cam: Cam) {
    this.camsService.removeCamFromReview(cam);
    this.noctuaReviewSearchService.removeFromArtBasket(cam.id);
  }

  clear() {

    const success = (cancel) => {
      if (cancel) {

        this.noctuaReviewSearchService.clear();
        this.camsService.clearCams();
        this.noctuaReviewSearchService.clearBasket();
      }
    };

    const options = {
      cancelLabel: 'No',
      confirmLabel: 'Yes'
    };

    this.confirmDialogService.openConfirmDialog('Confirm Clear Basket?',
      'You are about to remove all items from the basket. All your unsaved changes will be lost.',
      success, options);
  }

  backToReview() {
    this.noctuaSearchMenuService.selectMiddlePanel(MiddlePanel.camsReview);
  }

  cancel() {

    const success = (cancel) => {
      if (cancel) {
        const element = document.querySelector('#noc-review-results');

        if (element) {
          element.scrollTop = 0;
        }
        this.noctuaReviewSearchService.clear();
        this.noctuaReviewSearchService.onResetReview.next(true);
      }
    };

    const options = {
      cancelLabel: 'No',
      confirmLabel: 'Yes'
    };

    this.confirmDialogService.openConfirmDialog('Confirm Cancel?',
      'You are about to cancel annotation review. All your unsaved changes will be lost.',
      success, options);
  }

  resetCam(cam: Cam) {
    const self = this;

    self.camsService.resetCam(cam).subscribe((cams) => {
      if (cams) {
        self.camsService.loadCams();
        self.noctuaReviewSearchService.onReplaceChanged.next(true);
        self.camsService.reviewChanges();
      }
    });
  }

  resetCams() {
    const self = this;

    self.camsService.resetCams().subscribe((cams) => {
      if (cams) {
        self.camsService.loadCams();
        self.noctuaReviewSearchService.onReplaceChanged.next(true);
        self.camsService.reviewChanges();
      }
    });
  }

  reviewChanges() {
    const self = this;

    self.camsService.reviewChanges();
    self.noctuaSearchMenuService.selectLeftPanel(LeftPanel.artBasket);
    self.noctuaSearchMenuService.selectMiddlePanel(MiddlePanel.camsReview);
    self.noctuaSearchMenuService.reviewMode = ReviewMode.on;
    self.noctuaSearchMenuService.isReviewMode = true;
    this.close();
  }

  submitChanges() {
    const self = this;

    this.storeModels(self.camsService.cams, true)
  }

  submitChange(cam: Cam) {
    this.storeModels([cam])
  }

  logout() {
    this.noctuaReviewSearchService.clear();
    this.camsService.clearCams();
    this.noctuaReviewSearchService.clearBasket();

    this._matDialogRef.close(true);
  }

  private storeModels(cams: Cam[], reset = false) {
    const self = this;
    const success = (replace) => {
      if (replace) {
        const element = document.querySelector('#noc-review-results');

        if (element) {
          element.scrollTop = 0;
        }
        self.camsService.storeModels(cams).pipe(takeUntil(this._unsubscribeAll))
          .subscribe(cams => {
            if (!cams) {
              return;
            }

            if (reset) {
              self.noctuaSearchMenuService.selectMiddlePanel(MiddlePanel.cams);
              self.noctuaSearchMenuService.selectLeftPanel(LeftPanel.filter);
              self.noctuaReviewSearchService.clear();
              self.camsService.clearCams();
              self.noctuaReviewSearchService.clearBasket();
              self.noctuaReviewSearchService.onResetReview.next(true);
            }
            self.noctuaSearchService.updateSearch();
            self.noctuaReviewSearchService.updateSearch();
            self.zone.run(() => {
              self.confirmDialogService.openSuccessfulSaveToast('Changes successfully saved.', 'OK');
            });
          });
      }
    };


    const options = {
      cancelLabel: 'Go Back',
      confirmLabel: 'Submit'
    };

    if (self.summary) {
      const occurrences = self.summary.stats.termsCount;
      const models = self.summary.stats.camsCount;
      this.confirmDialogService.openConfirmDialog('Save Changes?',
        `Bulk edit ${occurrences} occurrences across ${models} models`,
        success, options);
    }
  }


  close() {
    this._matDialogRef.close();
  }
}


