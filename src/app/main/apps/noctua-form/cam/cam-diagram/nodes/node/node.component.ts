import { Component, Input, OnInit, ElementRef, Renderer2, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { jsPlumb } from 'jsplumb';
import { NodeService } from './../services/node.service';
import { NoctuaFormDialogService } from './../../../../dialog.service';
import { CamDiagramService } from './../../services/cam-diagram.service';
import { NoctuaSearchService } from '@noctua.search/services/noctua-search.service';
import { NoctuaFormGridService } from '@noctua.form/services/form-grid.service';
import { CamService } from '@noctua.form/services/cam.service'
import { Annoton } from '@noctua.form/models/annoton/annoton';
import { AnnotonNode } from '@noctua.form/models/annoton/annoton-node';

@Component({
  selector: 'noc-node',
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class NodeComponent implements OnInit, AfterViewInit {

  @Input() annoton: Annoton;

  gpTerm;
  connectionId
  connector = new AnnotonNode();


  constructor(
    private noctuaFormDialogService: NoctuaFormDialogService,
    private camService: CamService,
    private noctuaSearchService: NoctuaSearchService,
    private noctuaFormGridService: NoctuaFormGridService,
    public camDiagramService: CamDiagramService,
    private elRef: ElementRef,
    private renderer: Renderer2) { }

  ngOnInit() {
    const self = this;
    self.connectionId = self.annoton.connectionId
    self.gpTerm = self.annoton.getGPNode().getTerm();
    self.connector = self.annoton.getMFNode();
  }

  ngAfterViewInit() {
    const self = this;

    console.log(this.annoton);
    console.log(this.elRef.nativeElement);
    let nodeEl = this.elRef.nativeElement.children[0]
    this.renderer.setStyle(nodeEl, 'left', this.connector.location.x + 'px');
    this.renderer.setStyle(nodeEl, 'top', this.connector.location.y + 'px');

    self.camDiagramService.jsPlumbInstance.registerConnectionType("basic", { anchor: "Continuous", connector: "StateMachine" });

    self.initNode(self.connectionId);

    var canvas = document.getElementById("canvas");
    // var windows = jsPlumb.getSelector(".statemachine-demo .w");

    // bind a click listener to each connection; the connection is deleted. you could of course
    // just do this: self.nodeService.jsPlumbInstance.bind("click", self.nodeService.jsPlumbInstance.deleteConnection), but I wanted to make it clear what was
    // happening.
    self.camDiagramService.jsPlumbInstance.bind("click", (c) => {
      // self.camDiagramService.jsPlumbInstance.deleteConnection(c);
      //  self.openConnectorForm();
      console.log(c)
    });


  }

  initNode(el) {
    const self = this;
    // initialise draggable elements.
    self.camDiagramService.jsPlumbInstance.draggable(el);

    self.camDiagramService.jsPlumbInstance.makeSource(el, {
      filter: ".noc-connector",
      anchor: "Continuous",
      connectorStyle: { stroke: "#5c96bc", strokeWidth: 2, outlineStroke: "transparent", outlineWidth: 4 },
      connectionType: "basic",
      extract: {
        "action": "the-action"
      },
      maxConnections: 2,
      onMaxConnections: function (info, e) {
        alert("Maximum connections (" + info.maxConnections + ") reached");
      }
    });

    self.camDiagramService.jsPlumbInstance.makeTarget(el, {
      dropOptions: { hoverClass: "dragHover" },
      anchor: "Continuous",
      allowLoopback: true
    });

    // this is not part of the core demo functionality; it is a means for the Toolkit edition's wrapped
    // version of this demo to find out about new nodes being added.
    //
    // self.nodeService.jsPlumbInstance.fire("jsPlumbDemoNodeAdded", el);
  }

  openCamForm() {
    this.noctuaFormGridService.initalizeForm(this.annoton);
    this.camDiagramService.openRightDrawer(this.camDiagramService.panel.camForm)
  }

  openConnectorForm(sourceId, targetId) {
    //  this.noctuaFormGridService.initalizeForm(this.annoton);
    this.camDiagramService.openRightDrawer(this.camDiagramService.panel.connectorForm)
  }
}