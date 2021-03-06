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

import { noctuaAnimations } from './../../../../../../@noctua/animations';
import { NoctuaFormService } from '../../services/noctua-form.service';

import { CamDiagramService } from './../cam-diagram/services/cam-diagram.service';
import { CamTableService } from './../cam-table/services/cam-table.service';

import {
  Cam,
  Contributor,
  NoctuaUserService,
  NoctuaFormConfigService,
  NoctuaGraphService,
  NoctuaAnnotonFormService,
  CamService
} from 'noctua-form-base';


@Component({
  selector: 'noc-cam-form',
  templateUrl: './cam-form.component.html',
  styleUrls: ['./cam-form.component.scss'],
})

export class CamFormComponent implements OnInit, OnDestroy {

  @Input('panelDrawer')
  panelDrawer: MatDrawer;
  cam: Cam;
  camFormGroup: FormGroup;
  camFormSub: Subscription;

  private unsubscribeAll: Subject<any>;

  constructor(private route: ActivatedRoute,
    public noctuaUserService: NoctuaUserService,
    private camService: CamService,
    public camTableService: CamTableService,
    private noctuaGraphService: NoctuaGraphService,
    public noctuaFormConfigService: NoctuaFormConfigService,
    public noctuaFormService: NoctuaFormService
  ) {
    this.unsubscribeAll = new Subject();
    // this.annoton = self.noctuaCamFormService.annoton;
    //  this.camFormPresentation = this.noctuaCamFormService.annotonPresentation;
  }

  ngOnInit(): void {
    this.camFormSub = this.camService.camFormGroup$
      .subscribe(camFormGroup => {
        if (!camFormGroup) return;
        this.camFormGroup = camFormGroup;

        console.log(this.camFormGroup)
      });

    this.camService.onCamChanged.subscribe((cam) => {
      if (!cam) return;

      this.cam = cam
      this.camService.initializeForm(cam);
    });
  }

  checkErrors() {
    // this.noctuaAnnotonFormService.annoton.enableSubmit();

    // let errors = this.noctuaAnnotonFormService.annoton.submitErrors;
    //  this.noctuaFormDialogService.openAnnotonErrorsDialog(errors)
  }

  save() {

    const self = this;
    //  self.camService.ann;

    let value = this.camFormGroup.value;

    console.log(value)

    let annotations = {
      title: value.title,
      state: value.state.name
    }

    this.noctuaGraphService.saveModelGroup(this.cam, value.group.id);
    this.noctuaGraphService.saveCamAnnotations(this.cam, annotations);
  }

  termDisplayFn(term): string | undefined {
    return term ? term.label : undefined;
  }

  close() {
    this.panelDrawer.close()
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
