import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscriber } from 'rxjs';
import { map, finalize, filter, reduce, catchError, retry, tap } from 'rxjs/operators';

import { NoctuaUtils } from '@noctua/utils/noctua-utils';
import { CurieService } from '@noctua.curie/services/curie.service';
import { NoctuaGraphService } from '@noctua.form/services/graph.service';

import { AnnotonNode } from '@noctua.form/annoton/annoton-node';
import { NoctuaFormConfigService } from '@noctua.form/services/config/noctua-form-config.service';
import { SummaryGridService } from '@noctua.form/services/summary-grid.service';
import { Cam } from '../models/cam';
import { CamRow } from '../models/cam-row';
import { Curator } from '../models/curator';
import { Group } from '../models/group';

import * as _ from 'lodash';
import { v4 as uuid } from 'uuid';
declare const require: any;
const each = require('lodash/forEach');

@Injectable({
  providedIn: 'root'
})
export class CamService {
  baseUrl = environment.spaqrlApiUrl;
  curieUtil: any;
  cams: any[] = [];
  loading: boolean = false;
  onCamsChanged: BehaviorSubject<any>;
  onCamChanged: BehaviorSubject<any>;

  searchSummary: any = {}

  constructor(private noctuaFormConfigService: NoctuaFormConfigService,
    private summaryGridService: SummaryGridService,
    private httpClient: HttpClient,
    private noctuaGraphService: NoctuaGraphService,
    private curieService: CurieService) {
    this.onCamsChanged = new BehaviorSubject({});
    this.onCamChanged = new BehaviorSubject({});
    this.curieUtil = this.curieService.getCurieUtil();
  }

  //GO:0099160
  getCam(modelId): Cam {
    const self = this;

    let cam: Cam = {
      id: uuid(),
      graph: null,
      model: Object.assign({}, {
        id: modelId,
        title: '',
        modelInfo: this.noctuaFormConfigService.getModelUrls(modelId)
      }),
    }

    cam.expanded = true;
    cam.graph = this.noctuaGraphService.getGraphInfo(modelId)

    return cam;
  }

  addCamChildren(srcCam, annotons) {
    const self = this;

    srcCam.camRow = [];

    _.each(annotons, function (annoton) {
      let cam = self.annotonToCam(srcCam, annoton);

      cam.model = srcCam.model;
      cam.graph = srcCam.graph;
      srcCam.camRow.push(cam);
    });

    this.onCamsChanged.next(srcCam.camRow);
  }

  annotonToCam(cam, annoton) {

    let destNode = new AnnotonNode()
    destNode.deepCopyValues(annoton.node);

    let result: CamRow = {
      // id: uuid(),
      treeLevel: annoton.treeLevel,
      // model: cam.model,
      annotatedEntity: {
        id: '',
        label: annoton.gp
      },
      relationship: annoton.relationship,
      aspect: annoton.aspect,
      term: annoton.term,
      relationshipExt: annoton.relationshipExt,
      extension: annoton.extension,
      evidence: annoton.evidence,
      reference: annoton.reference,
      with: annoton.with,
      assignedBy: annoton.assignedBy,
      srcNode: annoton.node,
      destNode: destNode
    }

    return result;
  }

  getOrcid(orcid) {
    return "\"" + orcid + "\"^^xsd:string";
  }

}