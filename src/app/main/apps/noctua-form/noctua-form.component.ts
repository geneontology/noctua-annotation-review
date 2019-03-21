import { Component, ElementRef, OnDestroy, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
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


import { ReviewService } from './services/review.service';
import { ReviewDialogService } from './services/review-dialog.service';

import { NoctuaFormService } from './services/noctua-form.service';
import { NoctuaSearchService } from '@noctua.search/services/noctua-search.service';
import { CamService } from 'noctua-form-base'

import { SparqlService } from '@noctua.sparql/services/sparql/sparql.service';

import { Cam } from 'noctua-form-base';

@Component({
  selector: 'app-noctua-form',
  templateUrl: './noctua-form.component.html',
  styleUrls: ['./noctua-form.component.scss'],
  //encapsulation: ViewEncapsulation.None,
  animations: noctuaAnimations
})
export class NoctuaFormComponent implements OnInit, OnDestroy {

  @ViewChild('leftDrawer')
  leftDrawer: MatDrawer;

  @ViewChild('rightDrawer')
  rightDrawer: MatDrawer;

  cam: Cam;
  modelId: string = '';
  baristaToken: string = '';





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
  cams: any[] = [];
  searchResults = [];

  private unsubscribeAll: Subject<any>;

  constructor(private route: ActivatedRoute,
    private camService: CamService,
    public noctuaFormConfigService: NoctuaFormConfigService,
    private noctuaSearchService: NoctuaSearchService,
    public noctuaFormService: NoctuaFormService,
    private noctuaLookupService: NoctuaLookupService,
    private noctuaGraphService: NoctuaGraphService,
    private sparqlService: SparqlService,
    public reviewService: ReviewService,
    private reviewDialogService: ReviewDialogService,


  ) {

    this.unsubscribeAll = new Subject();

    this.route
      .queryParams
      .subscribe(params => {
        this.modelId = params['model_id'] || null;
        this.baristaToken = params['barista_token'] || null;

        this.noctuaGraphService.baristaToken = this.baristaToken;
        this.loadCams();
      });

    //  this.camService.setAnnotonLocation('aaa', 4, 5).subscribe((res) => {
    //  console.log(res)
    //   });
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
      //  this.searchFormData['curator'].searchResults = response;

      this.sparqlService.getAllGroups().subscribe((response: any) => {
        this.reviewService.groups = response;
        this.reviewService.onGroupsChanged.next(response);
        //    this.searchFormData['providedBy'].searchResults = response;

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

  selectCam(cam) {
    this.sparqlService.onCamChanged.next(cam);
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}

