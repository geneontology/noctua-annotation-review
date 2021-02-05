import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDrawer } from '@angular/material/sidenav';
import { Subject } from 'rxjs';

import { noctuaAnimations } from './../../../../@noctua/animations';

import {
  Cam,
  AnnotonType,
  Contributor,
  NoctuaUserService,
  NoctuaFormConfigService,
  NoctuaFormMenuService,
  NoctuaAnnotonFormService,
  CamService,
  noctuaFormConfig,
  MiddlePanel,
  LeftPanel,
  Annoton
} from 'noctua-form-base';

import { takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { NoctuaDataService } from '@noctua.common/services/noctua-data.service';

@Component({
  selector: 'app-noctua-form',
  templateUrl: './noctua-form.component.html',
  styleUrls: ['./noctua-form.component.scss'],
  //encapsulation: ViewEncapsulation.None,
  animations: noctuaAnimations
})
export class NoctuaFormComponent implements OnInit, OnDestroy {
  AnnotonType = AnnotonType;
  LeftPanel = LeftPanel;
  MiddlePanel = MiddlePanel;


  @ViewChild('leftDrawer', { static: true })
  leftDrawer: MatDrawer;

  @ViewChild('rightDrawer', { static: true })
  rightDrawer: MatDrawer;

  public cam: Cam;
  searchResults = [];
  modelId = '';

  noctuaFormConfig = noctuaFormConfig;

  tableOptions = {
    editableTerms: true,
    editableEvience: true,
    editableReference: true,
    editableWith: true,
    reviewMode: true,
  };

  private _unsubscribeAll: Subject<any>;

  constructor(
    private route: ActivatedRoute,
    private camService: CamService,
    private noctuaDataService: NoctuaDataService,
    public noctuaUserService: NoctuaUserService,
    public noctuaFormConfigService: NoctuaFormConfigService,
    public noctuaAnnotonFormService: NoctuaAnnotonFormService,
    public noctuaFormMenuService: NoctuaFormMenuService) {

    this._unsubscribeAll = new Subject();

    this.route
      .queryParams
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(params => {
        this.modelId = params['model_id'] || null;
        const baristaToken = params['barista_token'] || null;
        this.noctuaUserService.getUser(baristaToken);
      });

    this.noctuaUserService.onUserChanged.pipe(
      distinctUntilChanged(this.noctuaUserService.distinctUser),
      takeUntil(this._unsubscribeAll))
      .subscribe((user: Contributor) => {
        this.noctuaFormConfigService.setupUrls();
        this.noctuaFormConfigService.setUniversalUrls();
        this.loadCam(this.modelId);
      });
  }

  ngOnInit(): void {
    const self = this;

    self.noctuaFormMenuService.setLeftDrawer(self.leftDrawer);
    self.noctuaFormMenuService.setRightDrawer(self.rightDrawer);

    this.cam.onGraphChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((annotons: Annoton[]) => {
        if (!annotons) {
          return;
        }
        this.cam.updateAnnotonDisplayNumber();
      });
  }

  loadCam(modelId) {
    const self = this;


    this.cam = this.camService.getCam(modelId);
  }

  openCamForm() {
    this.camService.initializeForm(this.cam);
    this.noctuaFormMenuService.openLeftDrawer(LeftPanel.camForm);
  }

  openAnnotonForm(annotonType: AnnotonType) {
    this.noctuaAnnotonFormService.setAnnotonType(annotonType);
    this.noctuaFormMenuService.openLeftDrawer(LeftPanel.annotonForm);
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }
}

