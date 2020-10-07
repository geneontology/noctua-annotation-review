
import { Component, OnDestroy, OnInit, ViewChild, Input, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDrawer } from '@angular/material/sidenav';
import { Subject } from 'rxjs';


import {
  Cam,
  AnnotonType,
  NoctuaUserService,
  NoctuaFormConfigService,
  NoctuaFormMenuService,
  NoctuaAnnotonFormService,
  noctuaFormConfig,
  CamsService,
  AnnotonNode,
  EntityLookup,
  NoctuaLookupService,
  EntityDefinition,
  Entity
} from 'noctua-form-base';

import { takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { NoctuaDataService } from '@noctua.common/services/noctua-data.service';
import { NoctuaSearchService } from '@noctua.search/services/noctua-search.service';
import { noctuaAnimations } from '@noctua/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormControl } from '@angular/forms';
import { NoctuaReviewSearchService } from '@noctua.search/services/noctua-review-search.service';
import { groupBy } from 'lodash';

@Component({
  selector: 'noc-cams-review-changes-dialog',
  templateUrl: './cams-review-changes.component.html',
  styleUrls: ['./cams-review-changes.component.scss'],
  animations: noctuaAnimations,
})
export class CamsReviewChangesDialogComponent implements OnInit, OnDestroy {
  groupedEntities;
  occurrences = 0;
  models = 0;

  summary
  private _unsubscribeAll: Subject<any>;

  constructor
    (
      private _matDialogRef: MatDialogRef<CamsReviewChangesDialogComponent>,
      @Inject(MAT_DIALOG_DATA) private _data: any,
      private camsService: CamsService,
      private noctuaLookupService: NoctuaLookupService,
      private noctuaDataService: NoctuaDataService,
      public noctuaReviewSearchService: NoctuaReviewSearchService,
      public noctuaSearchService: NoctuaSearchService,
      public noctuaUserService: NoctuaUserService,
      public noctuaFormConfigService: NoctuaFormConfigService,
      public noctuaAnnotonFormService: NoctuaAnnotonFormService,
      public noctuaFormMenuService: NoctuaFormMenuService) {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    const self = this;

    //this.summary = self.camsService.reviewChanges();
    console.log(this.summary);

  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  generate(stats) {
    const self = this;
    const result = [
      {
        category: 'CAMs',
        count: stats.camsCount
      }, {
        category: 'Genes',
        count: stats.gpsCount
      }, {
        category: 'Terms',
        count: stats.termsCount
      }, {
        category: 'Evidence',
        count: stats.evidenceCount
      }, {
        category: 'Reference',
        count: stats.referencesCount
      }, {
        category: 'Relations',
        count: stats.relationsCount
      }
    ];

    return result;
  }

  save() {
    this._matDialogRef.close(true);
  }

  close() {
    this._matDialogRef.close();
  }
}


