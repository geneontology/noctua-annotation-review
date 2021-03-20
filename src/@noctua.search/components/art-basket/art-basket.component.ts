import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Subject } from 'rxjs';
import { Cam, CamService, CamsService, NoctuaFormConfigService, NoctuaUserService } from 'noctua-form-base';
import { NoctuaSearchService } from './../..//services/noctua-search.service';
import { NoctuaSearchMenuService } from '../../services/search-menu.service';
import { takeUntil } from 'rxjs/operators';
import { ArtBasket, ArtBasketItem } from './../..//models/art-basket';
import { NoctuaReviewSearchService } from './../../services/noctua-review-search.service';
import { NoctuaConfirmDialogService } from '@noctua/components/confirm-dialog/confirm-dialog.service';
import { LeftPanel, MiddlePanel } from './../../models/menu-panels';
import { NoctuaSearchDialogService } from './../../services/dialog.service';
import { SearchCriteria } from '@noctua.search/models/search-criteria';

@Component({
  selector: 'noc-art-basket',
  templateUrl: './art-basket.component.html',
  styleUrls: ['./art-basket.component.scss']
})
export class ArtBasketComponent implements OnInit, OnDestroy {
  MiddlePanel = MiddlePanel;
  artBasket: ArtBasket = new ArtBasket();
  cams: Cam[] = [];
  summary;

  loadingSpinner: any = {
    color: 'primary',
    mode: 'indeterminate'
  };

  private _unsubscribeAll: Subject<any>;

  constructor(
    private zone: NgZone,
    public camsService: CamsService,
    public camService: CamService,
    private confirmDialogService: NoctuaConfirmDialogService,
    public noctuaSearchDialogService: NoctuaSearchDialogService,
    public noctuaUserService: NoctuaUserService,
    public noctuaReviewSearchService: NoctuaReviewSearchService,
    public noctuaSearchMenuService: NoctuaSearchMenuService,
    public noctuaSearchService: NoctuaSearchService,
    public noctuaFormConfigService: NoctuaFormConfigService) {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    this.noctuaReviewSearchService.onArtBasketChanged.pipe(
      takeUntil(this._unsubscribeAll))
      .subscribe((artBasket: ArtBasket) => {
        if (artBasket) {
          this.artBasket = artBasket;
        }
      });

    this.camsService.onCamsChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(cams => {
        if (!cams) {
          return;
        }
        this.cams = cams;
      });

    this.camsService.onCamsCheckoutChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(summary => {
        if (!summary) {
          return;
        }

        this.summary = summary;
      });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  cancel() {
    const self = this;

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

  backToReview() {
    this.noctuaSearchMenuService.selectMiddlePanel(MiddlePanel.camsReview);
  }

  clear() {
    const self = this;
    const success = (cancel) => {
      if (cancel) {

        this.noctuaReviewSearchService.clear();
        this.camsService.clearCams();
        this.noctuaReviewSearchService.clearBasket();
      }
    };

    if (self.summary?.stats.totalChanges > 0) {
      const options = {
        title: 'Confirm Clear Basket?',
        message: 'You are about to remove all items from the basket. All your unsaved changes will be lost. Please save changes or undo changes.',
        cancelLabel: 'Go Back',
        confirmLabel: 'Clear Anyway'
      };

      self.noctuaSearchDialogService.openCamReviewChangesDialog(success, self.summary, options)
    } else {
      const options = {
        cancelLabel: 'No',
        confirmLabel: 'Yes'
      };

      this.confirmDialogService.openConfirmDialog('Confirm Clear Basket?',
        'You are about to remove all items from the basket. All your unsaved changes will be lost.',
        success, options);
    }
  }

  close() {
    this.noctuaSearchMenuService.closeLeftDrawer();
  }


  remove(cam: Cam) {
    const self = this;
    const summary = self.camsService.reviewCamChanges(cam)
    const success = (ok) => {
      if (ok) {
        this.camsService.removeCamFromReview(cam);
        this.noctuaReviewSearchService.removeFromArtBasket(cam.id);
      }
    }

    if (summary?.stats.totalChanges > 0) {
      const options = {
        title: 'Removing Unsaved Model',
        message: `Please save changes or undo changes before removing model. Model Name:"${cam.title}"`,
        cancelLabel: 'Cancel',
        confirmLabel: 'Remove Anyway'
      }

      self.noctuaSearchDialogService.openCamReviewChangesDialog(success, summary, options)
    } else {
      const options = {
        cancelLabel: 'No',
        confirmLabel: 'Yes'
      };

      this.confirmDialogService.openConfirmDialog('Removing Unsaved Model?',
        `You are about to remove model from the basket. No changes were made. Model Name:"${cam.title}"`,
        success, options);
    }
  }

  resetCam(cam: Cam) {
    const self = this;

    const summary = self.camsService.reviewCamChanges(cam);
    const success = (ok) => {
      if (ok) {
        self.camsService.resetCam(cam).subscribe((cams) => {
          if (cams) {
            self.camsService.loadCams();
            self.noctuaReviewSearchService.onReplaceChanged.next(true);
            self.camsService.reviewChanges();
          }
        });
      }
    }

    if (summary?.stats.totalChanges > 0) {

      const options = {
        title: 'Discard Unsaved Changes',
        message: `All your changes will be discarded for model. Model Name:"${cam.title}"`,
        cancelLabel: 'Cancel',
        confirmLabel: 'OK'
      }

      self.noctuaSearchDialogService.openCamReviewChangesDialog(success, summary, options)
    } else {
      success(true);
    }
  }

  resetCams() {
    const self = this;

    const success = (ok) => {
      if (ok) {
        self.camsService.resetCams().subscribe((cams) => {
          if (cams) {
            self.camsService.loadCams();
            self.noctuaReviewSearchService.onReplaceChanged.next(true);
            self.camsService.reviewChanges();
          }
        });
      }
    }
    if (self.summary?.stats.totalChanges > 0) {

      const options = {
        title: 'Discard Unsaved Changes',
        message: `All your changes will be discarded.`,
        cancelLabel: 'Cancel',
        confirmLabel: 'OK'
      }

      self.noctuaSearchDialogService.openCamReviewChangesDialog(success, self.summary, options)
    } else {
      success(true);
    }
  }

  reviewChanges() {
    const self = this;

    self.camsService.reviewChanges();
    self.noctuaSearchMenuService.selectMiddlePanel(MiddlePanel.reviewChanges);
  }

  reviewCamChanges(cam: Cam) {
    const self = this;

    const success = (done) => {
    }

    const summary = self.camsService.reviewCamChanges(cam)
    self.noctuaSearchDialogService.openCamReviewChangesDialog(success, summary)

  }

  selectItem(artBasketItem: ArtBasketItem) {
    this.camsService.onSelectedCamChanged.next(artBasketItem.id);
    const q = '#noc-review-cams-' + artBasketItem.displayId;
    this.noctuaSearchMenuService.scrollTo(q);
  }

  submitChanges() {
    const self = this;

    this.storeModels(self.camsService.cams, true)
  }

  submitChange(cam: Cam) {

    const self = this;
    const summary = self.camsService.reviewCamChanges(cam);

    if (summary?.stats.totalChanges > 0) {
      const success = (replace) => {
        if (replace) {

          self.camsService.storeModels([cam]).pipe(takeUntil(this._unsubscribeAll))
            .subscribe(cams => {
              if (!cams) {
                return;
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
        title: 'Save Changes?',
        message: `All your changes will be saved for model. Model Name:"${cam.title}"`,
        cancelLabel: 'Go Back',
        confirmLabel: 'Submit'
      }

      self.noctuaSearchDialogService.openCamReviewChangesDialog(success, summary, options)
    }
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


    if (self.summary?.stats.totalChanges > 0) {
      const options = {
        title: 'Save Changes?',
        message: `Bulk edit all changes`,
        cancelLabel: 'Go Back',
        confirmLabel: 'Submit'
      }

      self.noctuaSearchDialogService.openCamReviewChangesDialog(success, self.summary, options)
    }
  }

}
