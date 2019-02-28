import * as _ from 'lodash';
declare const require: any;
const each = require('lodash/forEach');
const map = require('lodash/map');
const uuid = require('uuid/v1');
import { SaeGraph } from './sae-graph.js';
import { AnnotonError } from "./parser/annoton-error.js";

import { AnnotonNode } from './annoton-node';
import { Evidence } from './evidence';

export class Annoton extends SaeGraph {
  gp;
  annotonPresentation;
  annotonRows;
  nodes;
  annotonType;
  annotonModelType;
  complexAnnotonData;
  errors;
  submitErrors;
  id;
  label;
  edgeOption;
  parser;

  constructor() {
    super();
    this.annotonType = "simple";
    this.annotonModelType = 'default';
    this.complexAnnotonData = {
      mcNode: {},
      gpTemplateNode: {},
      geneProducts: []
    };
    this.errors = [];
    this.submitErrors = [];
    this.id = uuid();
  }

  get annotonConnections() {
    let result = [];
    let edges = this.getEdges('mf')

    if (edges && edges.nodes) {
      result = edges.nodes.map((node) => {
        return node
      })
    }

    return result ? result : []
  }

  get connectionId() {
    let mfNode: AnnotonNode = this.getMFNode();

    return mfNode ? mfNode.modelId : null
  }

  getGPNode() {
    const self = this;

    if (self.annotonType === 'simple') {
      return self.getNode('gp');
    } else {
      return self.getNode('mc');
    }
  }

  getMFNode() {
    const self = this;

    if (self.annotonModelType === 'bpOnly') {
      return null;
    } else {
      return self.getNode('mf');
    }
  }

  insertTermNode(annotonModel, id, value) {
    let node = null;

    node = _.find(annotonModel, {
      id: id
    });

    if (node) {
      node.term.control.value = value;
    }
  }

  setAnnotonType(type) {
    this.annotonType = type;
  }

  setAnnotonModelType(type) {
    this.annotonModelType = type;
  }

  addEdgeOptionById(id, edgeOption) {
    const self = this;

    let node = self.getNode(id);
    node.addEdgeOption(edgeOption)
  }

  enableSubmit() {
    const self = this;
    let result = true;
    self.submitErrors = [];

    each(self.nodes, function (node) {
      result = node.enableSubmit(self.submitErrors, self) && result;
    })

    if (self.annotonType === 'simple') {
      let gp = self.getNode('gp');
      gp.term.control.required = false;
      if (!gp.term.control.value.id) {
        gp.term.control.required = true;
        let meta = {
          aspect: self.label
        }
        let error = new AnnotonError('error', 1, "A '" + gp.label + "' is required", meta)
        self.submitErrors.push(error);
        result = false;
      }
    }

    return result;
  }

  copyStructure(srcAnnoton) {
    const self = this;

    self.annotonType = srcAnnoton.annotonType;
    self.annotonModelType = srcAnnoton.annotonModelType;
    self.complexAnnotonData = srcAnnoton.complexAnnotonData;
  }

  copyValues(srcAnnoton) {
    const self = this;

    each(self.nodes, function (destNode) {
      let srcNode = srcAnnoton.getNode(destNode.id);
      if (srcNode) {
        destNode.copyValues(srcNode);
      }
    });
  }

  print() {
    let result = []
    this.nodes.forEach((node) => {
      let a = [];

      node.evidence.forEach((evidence: Evidence) => {
        a.push({
          evidence: evidence.getEvidence(),
          reference: evidence.getReference(),
          with: evidence.getWith()
        });
      });

      result.push({
        id: node.id,
        term: node.term.control.value,
        evidence: a
      })
    });

    console.log(result, JSON.stringify(result))
    return result;
  };
}