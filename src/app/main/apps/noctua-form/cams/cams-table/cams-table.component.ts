import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormArray } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatPaginator, MatSort, MatDrawer } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { merge, Observable, BehaviorSubject, fromEvent, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

import { noctuaAnimations } from '@noctua/animations';
import { NoctuaUtils } from '@noctua/utils/noctua-utils';

import { takeUntil, startWith } from 'rxjs/internal/operators';

import "rxjs/add/operator/debounceTime";
import "rxjs/add/operator/distinctUntilChanged";
import { forEach } from '@angular/router/src/utils/collection';

import { NoctuaFormConfigService } from 'noctua-form-base';
import { NoctuaGraphService } from 'noctua-form-base';
import { NoctuaLookupService } from 'noctua-form-base';



import { ReviewService } from './../../services/review.service';
import { ReviewDialogService } from './../../services/review-dialog.service';
import { NoctuaSearchService } from '@noctua.search/services/noctua-search.service';

import { SparqlService } from '@noctua.sparql/services/sparql/sparql.service';

@Component({
  selector: 'noc-cams-table',
  templateUrl: './cams-table.component.html',
  styleUrls: ['./cams-table.component.scss'],
  animations: noctuaAnimations
})
export class CamsTableComponent implements OnInit, OnDestroy {

  searchCriteria: any = {};
  searchFormData: any = []
  searchForm: FormGroup;
  loadingSpinner: any = {
    color: 'primary',
    mode: 'indeterminate'
  }

  summary: any = {
    expanded: false,
    detail: {}
  }

  @ViewChild('leftDrawer')
  leftDrawer: MatDrawer;

  @ViewChild('rightDrawer')
  rightDrawer: MatDrawer;

  @ViewChild(MatPaginator)
  paginator: MatPaginator;

  @ViewChild('filter')
  filter: ElementRef;

  @ViewChild(MatSort)
  sort: MatSort;

  cams: any[] = [];
  searchResults = [];


  private unsubscribeAll: Subject<any>;

  constructor(private route: ActivatedRoute,
    public noctuaFormConfigService: NoctuaFormConfigService,
    private noctuaSearchService: NoctuaSearchService,
    public reviewService: ReviewService,
    private reviewDialogService: ReviewDialogService,
    private noctuaLookupService: NoctuaLookupService,
    private noctuaGraphService: NoctuaGraphService,
    public sparqlService: SparqlService) {

    this.searchFormData = this.noctuaFormConfigService.createReviewSearchFormData();
    this.unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    this.reviewService.setLeftDrawer(this.leftDrawer);
    this.reviewService.setRightDrawer(this.rightDrawer);

    this.sparqlService.getCamsByCurator('http://orcid.org/0000-0002-1706-4196').subscribe((response: any) => {
      this.cams = this.sparqlService.cams = response;
      this.sparqlService.onCamsChanged.next(this.cams);
    });

    this.sparqlService.getAllCurators().subscribe((response: any) => {
      this.reviewService.curators = response;
      this.reviewService.onCuratorsChanged.next(response);
      this.searchFormData['curator'].searchResults = response;

      this.sparqlService.getAllGroups().subscribe((response: any) => {
        this.reviewService.groups = response;
        this.reviewService.onGroupsChanged.next(response);
        this.searchFormData['providedBy'].searchResults = response;

        this.sparqlService.addGroupCurators(this.reviewService.groups, this.reviewService.curators)
      });
    });

    this.sparqlService.onCamsChanged
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(cams => {
        this.cams = cams;
        this.summary.detail = this.sparqlService.searchSummary;
        this.loadCams();
      });
  }

  toggleLeftDrawer(panel) {
    this.reviewService.toggleLeftDrawer(panel);
  }

  search() {
    let searchCriteria = this.searchForm.value;
    console.dir(searchCriteria)
    this.noctuaSearchService.search(searchCriteria);
  }

  loadCams() {
    this.cams = this.sparqlService.cams;
  }

  toggleSummaryExpand() {
    this.summary.expanded = !this.summary.expanded;
  }

  toggleExpand(cam) {
    if (cam.expanded) {
      cam.expanded = false;
    } else {
      cam.expanded = true;
      this.noctuaGraphService.getGraphInfo(cam, cam.model.id)
      cam.onGraphChanged.subscribe((annotons) => {
        //  let data = this.summaryGridService.getGrid(annotons);
        // this.sparqlService.addCamChildren(cam, data);
        //  this.dataSource = new CamsDataSource(this.sparqlService, this.paginator, this.sort);
      });
    }
  }

  openCamEdit(cam) {
    this.reviewDialogService.openCamRowEdit(cam);
  }

  selectCam(cam) {
    this.sparqlService.onCamChanged.next(cam);
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
