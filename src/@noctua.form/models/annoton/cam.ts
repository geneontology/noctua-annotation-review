import * as _ from 'lodash';
declare const require: any;
const each = require('lodash/forEach');
const uuid = require('uuid/v1');

import { noctuaFormConfig } from './../../noctua-form-config';
import { Annoton } from './annoton'
import { AnnotonNode } from './annoton-node'
import { Group } from '../group';
import { Contributor } from '../contributor';
import { Evidence } from './evidence';

export class Cam {

  //Details
  title: string;
  state: any;
  //User Info
  groups: Group[] = [];
  contributors: Contributor[] = [];
  group: any;

  id: string;
  expanded?: boolean;
  model: any;
  annotatedEntity?: {};
  camRow?: any;
  _annotons: Annoton[] = [];

  error = false;
  engine;
  onGraphChanged;
  manager;
  individualManager;
  groupManager;
  graph;
  date;
  modelId;
  summaryExpanded = false;

  ///
  filter = {
    contributor: null,
    individualIds: [],
  };

  private _displayType;

  grid: any = [];

  constructor() {
    this.displayType = noctuaFormConfig.camDisplayType.options.model;
  }

  resetFilter() {
    this.filter.contributor = null;
    this.filter.individualIds = [];
  }

  get annotons() {
    return this._annotons;
  }

  set annotons(annoton) {
    this._annotons = annoton;
  }

  set displayType(type) {
    this._displayType = type;
  }

  get displayType() {
    return this._displayType;
  }

  findAnnotonById(id) {
    const self = this;

    return _.find(self.annotons, (annoton) => {
      return annoton.id === id;
    })
  }

  annotonsWithoutLocation() {
    let result = [];

    this.annotons.forEach((annoton: Annoton) => {
      if (annoton.location.x === 0 && annoton.location.y === 0) {
        result.push(annoton);
      }
    });

    return result;
  }

  applyFilter() {
    const self = this;

    if (self.filter.individualIds.length > 0) {
      self.grid = [];
      self.displayType = noctuaFormConfig.camDisplayType.options.entity;

      each(self.annotons, (annoton: Annoton) => {
        each(annoton.nodes, (node: AnnotonNode) => {
          each(self.filter.individualIds, (individualId) => {
            let match = false
            each(node.getEvidence(), (evidence: Evidence) => {
              match = match || (evidence.individualId === individualId);
            })
            match = match || (node.individualId === individualId);
            if (match) {
              self.generateGridRow(annoton, node);
            }
          });
        });
      });
    }
  }

  getAnnotonByConnectionId(connectionId) {
    const self = this;
    let result = _.find(self._annotons, (annoton: Annoton) => {
      return annoton.connectionId === connectionId;
    })

    return result;
  }

  getMFNodes() {
    const self = this;
    let result = [];

    each(self._annotons, function (annotonData) {
      each(annotonData.annoton.nodes, function (node) {
        if (node.id === 'mf') {
          result.push({
            node: node,
            annoton: annotonData.annoton
          })
        }
      });
    });

    return result;
  }

  getUniqueEvidences(result?) {
    const self = this;

    if (!result) {
      result = [];
    }

    each(self.annotons, function (annoton: Annoton) {
      each(annoton.nodes, function (node: AnnotonNode) {
        each(node.evidence, function (evidence) {
          if (evidence.hasValue()) {
            if (!self.evidenceExists(result, evidence)) {
              result.push(evidence);
            }
          }
        });
      });
    });

    return result;
  }

  evidenceExists(data, evidence) {
    const self = this;

    return _.find(data, function (x) {
      return x.isEvidenceEqual(evidence)
    })
  }

  addUniqueEvidences(existingEvidence, data) {
    const self = this;
    let result = [];

    each(data, function (annotation) {
      each(annotation.annotations, function (node) {
        each(node.evidence, function (evidence) {
          if (evidence.hasValue()) {
            if (!self.evidenceExists(result, evidence)) {
              result.push(evidence);
            }
          }
        });
      });
    });

    return result;
  }

  addUniqueEvidencesFromAnnoton(annoton) {
    const self = this;
    let result = [];

    each(annoton.nodes, function (node) {
      each(node.evidence, function (evidence) {
        if (evidence.hasValue()) {
          if (!self.evidenceExists(result, evidence)) {
            result.push(evidence);
          }
        }
      });
    });

    return result;
  }









  generateGridRow(annoton: Annoton, node: AnnotonNode) {
    const self = this;

    let term = node.getTerm();

    self.grid.push({
      displayEnabledBy: self.tableCanDisplayEnabledBy(node),
      treeLevel: node.treeLevel,
      relationship: node.isExtension ? '' : self.tableDisplayExtension(node),
      relationshipExt: node.isExtension ? node.relationship.label : '',
      term: node.isExtension ? {} : term,
      extension: node.isExtension ? term : {},
      aspect: node.aspect,
      evidence: node.evidence.length > 0 ? node.evidence[0].evidence.control.value : {},
      reference: node.evidence.length > 0 ? node.evidence[0].reference.control.link : '',
      with: node.evidence.length > 0 ? node.evidence[0].with.control.value : '',
      assignedBy: node.evidence.length > 0 ? node.evidence[0].assignedBy.control : '',
      annoton: annoton,
      node: node
    })

    for (let i = 1; i < node.evidence.length; i++) {
      self.grid.push({
        treeLevel: node.treeLevel,
        evidence: node.evidence[i].evidence.control.value,
        reference: node.evidence[i].reference.control.link,
        with: node.evidence[i].with.control.value,
        assignedBy: node.evidence[i].assignedBy.control,
        node: node,
      })
    }
  }

  tableCanDisplayEnabledBy(node: AnnotonNode) {
    const self = this;

    return node.relationship.id === noctuaFormConfig.edge.enabledBy.id
  }

  tableDisplayExtension(node: AnnotonNode) {
    const self = this;

    if (node.id === 'mf') {
      return '';
    } else if (node.isComplement) {
      return 'NOT ' + node.relationship.label;
    } else {
      return node.relationship.label;
    }
  }
}