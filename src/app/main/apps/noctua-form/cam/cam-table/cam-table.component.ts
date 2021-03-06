
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormArray } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatPaginator, MatSort, MatDrawer } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { merge, Observable, BehaviorSubject, fromEvent, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

import { noctuaAnimations } from './../../../../../../@noctua/animations';

import { takeUntil, startWith } from 'rxjs/internal/operators';

import "rxjs/add/operator/debounceTime";
import "rxjs/add/operator/distinctUntilChanged";
import { forEach } from '@angular/router/src/utils/collection';

import { NoctuaFormService } from './../../services/noctua-form.service';
import { CamTableService } from './services/cam-table.service';
import { NoctuaFormDialogService } from './../../services/dialog.service';
import { NoctuaSearchService } from './../../../../../../@noctua.search/services/noctua-search.service';

import {
  noctuaFormConfig,
  NoctuaAnnotonConnectorService,
  NoctuaGraphService,
  NoctuaFormConfigService,
  NoctuaAnnotonFormService,
  NoctuaLookupService,
  NoctuaAnnotonEntityService,
  CamService
} from 'noctua-form-base';

import {
  Cam,
  Annoton,
  AnnotonNode
} from 'noctua-form-base';

@Component({
  selector: 'noc-cam-table',
  templateUrl: './cam-table.component.html',
  styleUrls: ['./cam-table.component.scss'],
  animations: noctuaAnimations
})
export class CamTableComponent implements OnInit, OnDestroy {

  searchCriteria: any = {};
  searchFormData: any = []
  searchForm: FormGroup;
  camDisplayType = noctuaFormConfig.camDisplayType.options;

  @Input('cam')
  public cam: Cam;

  @ViewChild(MatPaginator)
  paginator: MatPaginator;

  @ViewChild('filter')
  filter: ElementRef;

  @ViewChild(MatSort)
  sort: MatSort;

  searchResults = [];
  modelId: string = '';

  private unsubscribeAll: Subject<any>;

  constructor(private route: ActivatedRoute,
    public camService: CamService,
    public noctuaFormService: NoctuaFormService,
    public noctuaFormConfigService: NoctuaFormConfigService,
    private noctuaSearchService: NoctuaSearchService,
    private noctuaAnnotonConnectorService: NoctuaAnnotonConnectorService,
    //  public noctuaFormService: NoctuaFormService,
    public noctuaAnnotonFormService: NoctuaAnnotonFormService,
    public camTableService: CamTableService,
    private noctuaFormDialogService: NoctuaFormDialogService,
    private noctuaLookupService: NoctuaLookupService,
    private noctuaGraphService: NoctuaGraphService,
  ) {

    this.searchFormData = this.noctuaFormConfigService.createReviewSearchFormData();
    this.unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    this.cam.onGraphChanged.subscribe((annotons: Annoton[]) => {
      if (annotons) {
        this.cam.applyFilter();
        //  let data = this.summaryGridService.getGrid(annotons);
        // this.sparqlService.addCamChildren(cam, data);
        //  this.dataSource = new CamsDataSource(this.sparqlService, this.paginator, this.sort);
      }
    });
  }

  addAnnoton() {
    // let location = {
    //   x: event.clientX,
    //   y: event.clientY
    //  }
    // console.log(event.clientX + 'px');
    // console.log(event.clientY + 'px');

    this.openForm(location);
  }

  openForm(location?) {
    this.noctuaAnnotonFormService.mfLocation = location;
    this.noctuaAnnotonFormService.initializeForm();
    this.noctuaFormService.openRightDrawer(this.noctuaFormService.panel.annotonForm)
  }

  search() {
    let searchCriteria = this.searchForm.value;
    console.dir(searchCriteria)
    this.noctuaSearchService.search(searchCriteria);
  }

  toggleExpand(annoton: Annoton) {
    annoton.expanded = !annoton.expanded;
  }

  openCamEdit(cam) {
    this.noctuaFormDialogService.openCamRowEdit(cam);
  }

  openAnnotonConnector(annoton: Annoton) {
    this.camService.onCamChanged.next(this.cam);
    this.camService.annoton = annoton;
    this.noctuaAnnotonConnectorService.annoton = annoton;
    this.noctuaAnnotonConnectorService.onAnnotonChanged.next(annoton);
    this.noctuaAnnotonConnectorService.getConnections();
    this.noctuaFormService.openRightDrawer(this.noctuaFormService.panel.connectorForm);
  }

  openAnnotonForm(annoton: Annoton) {
    this.camService.onCamChanged.next(this.cam);
    this.camService.annoton = annoton;
    this.noctuaAnnotonFormService.initializeForm(annoton);
    this.noctuaFormService.openRightDrawer(this.noctuaFormService.panel.annotonForm)
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
