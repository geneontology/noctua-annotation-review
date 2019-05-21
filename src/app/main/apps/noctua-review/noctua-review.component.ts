import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDrawer } from '@angular/material';
import { Subject } from 'rxjs';

import { noctuaAnimations } from './../../../../@noctua/animations';

import {
  Cam,
  Contributor,
  Annoton,
  NoctuaUserService,
  NoctuaFormConfigService,
  NoctuaGraphService,
  NoctuaAnnotonFormService,
  CamService
} from 'noctua-form-base';

import { NoctuaFormService } from './../noctua-form/services/noctua-form.service';
import { FormGroup } from '@angular/forms';

import { ReviewService } from './services/review.service';
import { ReviewDialogService } from './services/review-dialog.service';
import { NoctuaSearchService } from '@noctua.search/services/noctua-search.service';


import { SparqlService } from '@noctua.sparql/services/sparql/sparql.service';
import { takeUntil } from 'rxjs/operators';



@Component({
  selector: 'app-noctua-review',
  templateUrl: './noctua-review.component.html',
  styleUrls: ['./noctua-review.component.scss'],
  //encapsulation: ViewEncapsulation.None,
  animations: noctuaAnimations
})
export class NoctuaReviewComponent implements OnInit, OnDestroy {

  @ViewChild('leftDrawer')
  leftDrawer: MatDrawer;

  @ViewChild('rightDrawer')
  rightDrawer: MatDrawer;


  public cam: Cam;
  public user: Contributor;
  searchResults = [];
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

  private unsubscribeAll: Subject<any>;

  constructor(private route: ActivatedRoute,
    private camService: CamService,
    public noctuaUserService: NoctuaUserService,
    public noctuaFormConfigService: NoctuaFormConfigService,
    public noctuaAnnotonFormService: NoctuaAnnotonFormService,
    private noctuaSearchService: NoctuaSearchService,
    public noctuaFormService: NoctuaFormService,
    // private noctuaLookupService: NoctuaLookupService,
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
        this.getUserInfo();
        this.loadCams();
      });

    //  this.camService.setAnnotonLocation('aaa', 4, 5).subscribe((res) => {
    //  console.log(res)
    //   });
  }

  getUserInfo() {
    const self = this;

    this.noctuaUserService.getUser().subscribe((response) => {
      if (response) {
        this.user = new Contributor()
        this.user.name = response.nickname;
        this.user.groups = response.groups;
        // user.manager.use_groups([self.userInfo.selectedGroup.id]);
        this.noctuaUserService.user = this.user;
        this.noctuaUserService.onUserChanged.next(this.user);
      }
    });
  }

  ngOnInit(): void {
    this.reviewService.setLeftDrawer(this.leftDrawer);
    //  this.reviewService.setRightDrawer(this.rightDrawer);
    this.noctuaFormService.setRightDrawer(this.rightDrawer);

    /*
    this.sparqlService.getCamsByContributor('http://orcid.org/0000-0002-1706-4196').subscribe((response: any) => {
      this.cams = this.sparqlService.cams = response;
      this.sparqlService.onCamsChanged.next(this.cams);
    });
    */

    this.sparqlService.getAllContributors().subscribe((response: any) => {
      this.reviewService.contributors = response;
      this.reviewService.onContributorsChanged.next(response);
      this.sparqlService.getCamsByGoTerm({ id: 'GO:0017127' }).subscribe((response: any) => {
        this.cams = this.sparqlService.cams = response;
        this.sparqlService.onCamsChanged.next(this.cams);
      });
    });

    this.sparqlService.getAllGroups().subscribe((response: any) => {
      this.reviewService.groups = response;
      this.reviewService.onGroupsChanged.next(response);
    });



    this.sparqlService.getAllOrganisms().subscribe((response: any) => {
      this.reviewService.organisms = response;
      this.reviewService.onOrganismsChanged.next(response);
    });

    this.sparqlService.onCamsChanged
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(cams => {
        this.cams = cams;
        this.summary.detail = this.sparqlService.searchSummary;
        this.loadCams();
      });

    this.reviewService.onContributorsChanged
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(contributors => {
        this.noctuaUserService.contributors = contributors;
      });

    this.reviewService.onGroupsChanged
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(groups => {
        this.noctuaUserService.groups = groups;
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
      this.noctuaGraphService.getGraphInfo(cam, cam.model.id);
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

