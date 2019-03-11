

import { Component, Inject, Input, OnInit, ElementRef, OnDestroy, ViewEncapsulation, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatPaginator, MatSort, MatDrawer } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { merge, Observable, Subscription, BehaviorSubject, fromEvent, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';


import * as _ from 'lodash';
declare const require: any;
const each = require('lodash/forEach');

import { noctuaAnimations } from '@noctua/animations';
import { NoctuaUtils } from '@noctua/utils/noctua-utils';

import { takeUntil } from 'rxjs/internal/operators';
import { forEach } from '@angular/router/src/utils/collection';

import { NoctuaFormService } from '../../services/noctua-form.service';

import { NoctuaAnnotonConnectorService } from 'noctua-form-base';
import { NoctuaGraphService } from 'noctua-form-base';
import { NoctuaFormGridService } from 'noctua-form-base';
import { NoctuaFormConfigService } from 'noctua-form-base';
import { NoctuaLookupService } from 'noctua-form-base';
import { NoctuaSearchService } from '@noctua.search/services/noctua-search.service';
import { CamService } from 'noctua-form-base';
import { CamDiagramService } from './../cam-diagram/services/cam-diagram.service';
import { CamTableService } from './../cam-table/services/cam-table.service';

import { SparqlService } from '@noctua.sparql/services/sparql/sparql.service';

import { Cam } from 'noctua-form-base';
import { Annoton } from 'noctua-form-base';
import { AnnotonNode } from 'noctua-form-base';
import { Evidence } from 'noctua-form-base';

@Component({
  selector: 'noc-cam-connector',
  templateUrl: './cam-connector.component.html',
  styleUrls: ['./cam-connector.component.scss']
})
export class CamConnectorComponent implements OnInit, OnDestroy {

  @Input('panelDrawer')
  panelDrawer: MatDrawer;

  annoton: Annoton;
  mfNode: AnnotonNode;

  cam: Cam;
  connectorFormGroup: FormGroup;
  connectorFormSub: Subscription;

  searchCriteria: any = {};
  evidenceFormArray: FormArray;
  // annoton: Annoton = new Annoton();

  subjectGPNode: AnnotonNode;
  objectGPNode: AnnotonNode;
  selectedCausalEffect;

  private unsubscribeAll: Subject<any>;

  constructor(private route: ActivatedRoute,
    private camService: CamService,
    private formBuilder: FormBuilder,
    private noctuaAnnotonConnectorService: NoctuaAnnotonConnectorService,
    private noctuaSearchService: NoctuaSearchService,
    private camDiagramService: CamDiagramService,
    public camTableService: CamTableService,
    private noctuaGraphService: NoctuaGraphService,
    public noctuaFormConfigService: NoctuaFormConfigService,
    public noctuaFormGridService: NoctuaFormGridService,
    private noctuaLookupService: NoctuaLookupService,
    public noctuaFormService: NoctuaFormService,
    private sparqlService: SparqlService
  ) {
    this.unsubscribeAll = new Subject();
    // this.annoton = self.noctuaFormGridService.annoton;
  }

  ngOnInit(): void {
    this.connectorFormSub = this.noctuaAnnotonConnectorService.connectorFormGroup$
      .subscribe(connectorFormGroup => {
        if (!connectorFormGroup) return;
        this.connectorFormGroup = connectorFormGroup;

        this.subjectGPNode = this.noctuaAnnotonConnectorService.subjectAnnoton.getGPNode()
        this.objectGPNode = this.noctuaAnnotonConnectorService.objectAnnoton.getGPNode()

        this.selectedCausalEffect = this.connectorFormGroup.get('causalEffect').value
      });

    this.camService.onCamChanged.subscribe((cam) => {
      this.cam = cam
      this.cam.onGraphChanged.subscribe((annotons) => {
        //  let data = this.summaryGridService.getGrid(annotons);
        //  this.sparqlService.addCamChildren(cam, data);
        //  this.dataSource = new CamsDataSource(this.sparqlService, this.paginator, this.sort);
      });
    });
  }

  evidenceDisplayFn(evidence): string | undefined {
    return evidence ? evidence.label : undefined;
  }

  save() {
    const self = this;

    self.noctuaAnnotonConnectorService.connectorFormToAnnoton();
    self.noctuaGraphService.saveConnection(self.cam,
      this.noctuaAnnotonConnectorService.annoton,
      this.noctuaAnnotonConnectorService.subjectMFNode,
      this.noctuaAnnotonConnectorService.objectMFNode).then(function (data) {
        // self.noctuaFormGridService.clearForm();
        // self.dialogService.openSuccessfulSaveToast();
      });
  }

  addEvidence() {
    const self = this;

    let evidenceFormGroup: FormArray = <FormArray>self.connectorFormGroup.get('evidenceFormArray');

    evidenceFormGroup.push(this.formBuilder.group({
      evidence: new FormControl(),
      reference: new FormControl(),
      with: new FormControl(),
    }));
  }

  removeEvidence(index) {
    const self = this;

    let evidenceFormGroup: FormArray = <FormArray>self.connectorFormGroup.get('evidenceFormArray');

    evidenceFormGroup.removeAt(index);
  }

  clear() {
    this.noctuaFormGridService.clearForm();
  }



  close() {
    this.panelDrawer.close()
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
