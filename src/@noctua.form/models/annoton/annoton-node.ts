import * as _ from 'lodash';

declare const require: any;
const each = require('lodash/forEach');

import { Evidence } from './evidence';
import { AnnotonError } from "./parser/annoton-error";

export class AnnotonNode {
  id;
  isExtension;
  aspect;
  label;
  lookupGroup;
  nodeGroup;
  displaySection
  relationship;
  displayGroup
  treeLevel;
  annoton;
  ontologyClass;
  individualId;
  isComplement;
  term;
  closures;
  edgeOption;
  _evidenceMeta;
  evidence;
  assignedBy;
  contributor;
  termRequiredList;
  evidenceRequiredList
  evidenceNotRequiredList
  errors
  warnings
  status

  visible = true;

  isCatalyticActivity = false

  //UI
  _location = {
    x: 0,
    y: 0
  }

  constructor() {
    this.id;
    this.nodeGroup = {}
    this.annoton = null;
    this.ontologyClass = [];
    this.individualId;
    this.isExtension = false;
    this.isComplement = false;
    this.term = {
      "validation": {
        "errors": []
      },
      "control": {
        "required": false,
        "placeholder": '',
        "value": '',
        "searchText": ''
      },
      "lookup": {
        "category": "",
        "requestParams": null
      },
      "classExpression": null
    };
    this.closures = [];
    this.edgeOption;
    this._evidenceMeta = {
      lookupBase: "",
      ontologyClass: "eco"
    };
    this.evidence = [];
    this.assignedBy = null;
    this.contributor = null;
    this.termRequiredList = ['mf'];
    this.evidenceRequiredList = ['mf', 'bp', 'cc', 'mf-1', 'mf-2', 'bp-1', 'bp-1-1', 'cc-1', 'cc-1-1', 'c-1-1-1']
    this.evidenceNotRequiredList = []; // ['GO:0003674', 'GO:0008150', 'GO:0005575'];
    this.errors = [];
    this.warnings = [];
    this.status = '0';


  }

  get location() {
    return this._location;
  }

  set location(location) {
    this._location = location
  }

  getTerm() {
    return this.term.control.value;
  }

  setTerm(value, classExpression?) {
    this.term.control.value = value;

    if (classExpression) {
      this.classExpression = classExpression;
    }
  }

  setDisplay(value) {
    if (value) {
      this.displaySection = value.displaySection;
      this.displayGroup = value.displayGroup;
    }
  }

  addEdgeOption(edgeOption) {
    const self = this;

    self.edgeOption = edgeOption;
  }


  getEvidence(): Evidence[] {
    return this.evidence;
  }

  getEvidenceById(id) {
    const self = this;

    return _.find(self.evidence, (evidence: Evidence) => {
      return evidence.individualId === id;
    })
  }

  get classExpression() {
    return this.term.classExpression;
  }

  set classExpression(classExpression) {
    this.term.classExpression = classExpression;
  }

  setEvidence(evidences: Evidence[], except?) {
    const self = this;
    self.evidence = [];

    each(evidences, function (srcEvidence, i) {
      self.addEvidence(srcEvidence);
      //  destEvidence.copyValues(srcEvidence, except);
    });
  }

  addEvidence(srcEvidence?: Evidence) {
    const self = this;
    let evidence = srcEvidence ? srcEvidence : new Evidence();

    evidence.setEvidenceLookup(JSON.parse(JSON.stringify(self._evidenceMeta.lookupBase)));
    evidence.setEvidenceOntologyClass(self._evidenceMeta.ontologyClass);

    self.evidence.push(evidence);
    return evidence;
  }

  removeEvidence(evidence) {
    const self = this;

    if (self.evidence.length > 1) {
      self.evidence = _.remove(self.evidence, evidence);
    } else {
      self.evidence[0].clearValues();
    }
  }

  resetEvidence() {
    const self = this;

    self.evidence = [self.evidence[0]];
  }

  setTermOntologyClass(value) {
    this.term.ontologyClass = value;
  }

  toggleIsComplement() {
    const self = this;

    self.isComplement = !self.isComplement;
    self.nodeGroup.isComplement = self.isComplement;
  }

  setIsComplement(complement) {
    const self = this;

    self.isComplement = complement;
  }

  hasValue() {
    const self = this;

    return self.term.control.value.id;
  }

  clearValues() {
    const self = this;

    self.term.control.value = null;
    self.evidence = [];
    self.addEvidence();
  }

  deepCopyValues(node: AnnotonNode) {
    const self = this;

    self.term.control.value = node.term.control.value;
    self.evidence = node.evidence;
    self.location = node.location;
    self.individualId = node.individualId;
    self.annoton = node.annoton;
    self.ontologyClass = node.ontologyClass;
    self.assignedBy = node.assignedBy;
    self.termRequiredList = node.termRequiredList;
    self.evidenceRequiredList = node.evidenceRequiredList
    self.evidenceNotRequiredList = node.evidenceNotRequiredList;
    self.errors = node.errors;
    self.warnings = node.warnings;
    self.status = node.status;

    self.edgeOption = node.edgeOption;
    self.isComplement = node.isComplement;
  }

  copyValues(node) {
    const self = this;

    self.location = node.location;
    self.term.control.value = node.term.control.value;
    self.evidence = node.evidence;
    self.assignedBy = node.assignedBy;
    self.isComplement = node.isComplement;
  }


  selectEdge(edge) {
    console.log("I am selected ", edge);
  }

  setTermLookup(value) {
    this.term.lookup.requestParams = value;
  }

  setEvidenceMeta(ontologyClass, lookupBase) {
    this._evidenceMeta.lookupBase = lookupBase;
    this._evidenceMeta.ontologyClass = ontologyClass;
    this.addEvidence();
  }

  enableRow() {
    const self = this;
    let result = true;

    if (self.nodeGroup) {
      if (self.nodeGroup.isComplement && self.treeLevel > 0) [
        result = false
      ]
    }

    return result;
  }

  enableSubmit(errors, annoton) {
    const self = this;
    let result = true;

    if (self.termRequiredList.includes(self.id) && !self.term.control.value.id) {
      self.term.control.required = true;
      let meta = {
        aspect: self.label
      }
      let error = new AnnotonError('error', 1, "A '" + self.label + "' is required", meta)
      errors.push(error);
      result = false;
    } else {
      self.term.control.required = false;
    }

    if (self.term.control.value.id && self.evidenceRequiredList.includes(self.id) &&
      !self.evidenceNotRequiredList.includes(self.term.control.value.id)) {
      each(self.evidence, function (evidence, key) {
        if (self.term.control.value.id)
          result = evidence.enableSubmit(errors, self, key + 1) && result;
      })
    }

    return result;
  }

  static isType(typeId, id) {
    let n = typeId.toLowerCase();
    if (n.includes(id)) {

    } else if (n.includes('go')) {

    }

  }

}