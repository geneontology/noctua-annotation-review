import { Injectable } from '@angular/core';
import 'jqueryui';
import * as joint from 'jointjs';
import { each, cloneDeep } from 'lodash';
import { CamCanvas } from '../models/cam-canvas';
import { CamStencil } from '../models/cam-stencil';
import { NoctuaCommonMenuService } from '@noctua.common/services/noctua-common-menu.service';
import { NoctuaDataService } from '@noctua.common/services/noctua-data.service';
import { Annoton, Cam, CamService, NoctuaAnnotonFormService, RightPanel } from '@noctua.form';
import { NodeLink, NodeCell, NoctuaShapesService } from '@noctua.graph/services/shapes.service';
import { NodeType } from 'scard-graph-ts';
import { NodeCellType } from '@noctua.graph/models/shapes';
import { noctuaStencil } from '@noctua.graph/data/cam-stencil';

@Injectable({
  providedIn: 'root'
})
export class CamGraphService {
  cam: Cam;
  stencils: {
    id: string,
    paper: joint.dia.Paper;
    graph: joint.dia.Graph;
  }[] = [];
  selectedElement: joint.shapes.noctua.NodeCell | joint.shapes.noctua.NodeLink;
  selectedStencilElement: joint.shapes.noctua.NodeCell;
  camCanvas: CamCanvas;
  camStencil: CamStencil;

  constructor(
    private _camService: CamService,
    private noctuaDataService: NoctuaDataService,
    private annotonFormService: NoctuaAnnotonFormService,
    public noctuaCommonMenuService: NoctuaCommonMenuService,
    private noctuaShapesService: NoctuaShapesService) {

    const self = this;

    this._camService.onCamChanged
      .subscribe((cam: Cam) => {
        if (!cam || !self.selectedElement) {
          return;
        }

        const type = self.selectedElement.get('type');

        if (type === NodeCellType.link) {
          (self.selectedElement as NodeLink).setText(cam.title);
        } else {
          self.selectedElement.attr('noctuaTitle/text', cam.title);
          // (self.selectedElement as NodeCell).addColor(cam.backgroundColor);
        }
        self.selectedElement.set({ cam: cam });
        self.selectedElement.set({ id: cam.id });
      });
  }

  initializeGraph() {
    const self = this;

    self.camCanvas = new CamCanvas();
    self.camCanvas.elementOnClick = self.openForm.bind(self);
  }

  initializeStencils() {
    const self = this;

    self.camStencil = new CamStencil(self.camCanvas, noctuaStencil.camStencil);
  }

  addToCanvas(cam: Cam) {
    this.cam = cam;
    this.camCanvas.addCanvasGraph(cam);
  }

  zoom(delta: number, e?) {
    this.camCanvas.zoom(delta, e);
  }

  reset() {
    this.camCanvas.resetZoom();
  }

  openForm(element: joint.shapes.noctua.NodeCell) {
    const annoton = element.prop('annoton') as Annoton
    this.selectedElement = element;
    // annoton.type = element.get('type');
    this.annotonFormService.initializeForm(annoton);
    this.noctuaCommonMenuService.selectRightPanel(RightPanel.annotonForm);
    this.noctuaCommonMenuService.openRightDrawer();
  }

  save() {
    const self = this;
    const cells: joint.dia.Cell[] = this.camCanvas.canvasGraph.getCells();
    const cams = [];
    const triples = [];

    each(cells, (cell: joint.dia.Cell) => {
      const type = cell.get('type');

      if (type === NodeCellType.link) {
        const subject = cell.get('source');
        const object = cell.get('target');

        triples.push({
          subject: {
            uuid: subject.id,
          },
          predicate: {
            id: cell.get('id'),
          },
          object: {
            uuid: object.id
          }
        });
      } else {
        cams.push({
          uuid: cell.get('id'),
          id: cell.get('id'),
          position: cell.get('position'),
          size: cell.get('size'),
        });
      }
    });

    const cam = {
      cams,
      triples
    };

  }
}
