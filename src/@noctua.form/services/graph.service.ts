import { environment } from './../../environments/environment';
import { Injectable } from '@angular/core';



import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscriber } from 'rxjs';
import { map, filter, reduce, catchError, retry, tap } from 'rxjs/operators';

import { Cam } from './../models/annoton/cam';
import { Annoton } from './../models/annoton/annoton';
import { AnnotonNode } from './../models/annoton/annoton-node';
import { AnnotonParser } from './../models/annoton/parser/annoton-parser';
import { AnnotonError } from "./../models/annoton/parser/annoton-error";
import { Evidence } from './../models/annoton/evidence';

//Config
import { noctuaFormConfig } from './../noctua-form-config';
import { NoctuaFormConfigService } from './config/noctua-form-config.service';
import { NoctuaLookupService } from './lookup.service';
import { NoctuaAnnotonFormService } from './../services/annoton-form.service';
//User
import { NoctuaUserService } from './../services/user.service';

import 'rxjs/add/observable/forkJoin';
import * as _ from 'lodash';

declare const require: any;

const each = require('lodash/forEach');
const forOwn = require('lodash/forOwn');
const uuid = require('uuid/v1');
const model = require('bbop-graph-noctua');
const amigo = require('amigo2');
const bbopx = require('bbopx');
const golr_response = require('bbop-response-golr');
const golr_manager = require('bbop-manager-golr');
const golr_conf = require("golr-conf");
const node_engine = require('bbop-rest-manager').node;
const barista_response = require('bbop-response-barista');
const minerva_requests = require('minerva-requests');
const jquery_engine = require('bbop-rest-manager').jquery;
const class_expression = require('class-expression');
const minerva_manager = require('bbop-manager-minerva');

@Injectable({
  providedIn: 'root'
})
export class NoctuaGraphService {
  title;
  golrServer = environment.globalGolrServer;
  baristaLocation = environment.globalBaristaLocation;
  minervaDefinitionName = environment.globalMinervaDefinitionName;
  locationStore = new bbopx.noctua.location_store();
  baristaToken;
  linker;
  loggedIn;
  userInfo;
  modelInfo;
  localClosures;

  constructor(
    private noctuaUserService: NoctuaUserService,
    public noctuaFormConfigService: NoctuaFormConfigService,
    private annotonFormService: NoctuaAnnotonFormService,
    private httpClient: HttpClient,
    private noctuaLookupService: NoctuaLookupService) {
    this.linker = new amigo.linker();
    this.userInfo = {
      groups: [],
      selectedGroup: {}
    }
    this.modelInfo = {
      graphEditorUrl: ""
    }
    this.localClosures = [];

  }

  registerManager() {
    let engine = new jquery_engine(barista_response);
    engine.method('POST');

    let manager = new minerva_manager(
      this.baristaLocation,
      this.minervaDefinitionName,
      this.noctuaUserService.baristaToken,
      engine, 'async');


    let managerError = (resp) => {
      console.log('There was a manager error (' +
        resp.message_type() + '): ' + resp.message());
    }

    let warning = (resp) => {
      alert('Warning: ' + resp.message() + '; ' +
        'your operation was likely not performed');
    }

    let error = (resp) => {
      let perm_flag = 'InsufficientPermissionsException';
      let token_flag = 'token';
      if (resp.message() && resp.message().indexOf(perm_flag) !== -1) {
        alert('Error: it seems like you do not have permission to ' +
          'perform that operation. Did you remember to login?');
      } else if (resp.message() && resp.message().indexOf(token_flag) !== -1) {
        alert('Error: it seems like you have a bad token...');
      } else {
        console.log('error:', resp, resp.message_type(), resp.message());

        if (resp.message().includes('UnknownIdentifierException')) {
          //  cam.error = true
        }
      }
    }

    let shieldsUp = () => { }
    let shieldsDown = () => { }

    manager.register('prerun', shieldsUp);
    manager.register('postrun', shieldsDown, 9);
    manager.register('manager_error', managerError, 10);
    manager.register('warning', warning, 10);
    manager.register('error', error, 10);

    return manager;
  }

  getGraphInfo(cam: Cam, modelId) {
    const self = this;

    cam.onGraphChanged = new BehaviorSubject(null);
    cam.modelId = modelId;
    cam.manager = this.registerManager();
    cam.individualManager = this.registerManager();
    cam.groupManager = this.registerManager();

    let rebuild = (resp) => {
      let noctua_graph = model.graph;

      cam.graph = new noctua_graph();
      cam.modelId = resp.data().id;
      cam.graph.load_data_basic(resp.data());
      let titleAnnotations = cam.graph.get_annotations_by_key('title');
      let stateAnnotations = cam.graph.get_annotations_by_key('state');

      if (titleAnnotations.length > 0) {
        cam.title = titleAnnotations[0].value();
      }

      if (stateAnnotations.length > 0) {
        cam.state = self.noctuaFormConfigService.findModelState(stateAnnotations[0].value());
      }

      self.graphPreParse(cam.graph).subscribe((data) => {
        cam.annotons = self.graphToAnnotons(cam);
        self.saveMFLocation(cam)
        self.graphPostParse(cam, cam.graph).subscribe((data) => {
          cam.onGraphChanged.next(cam.annotons);
        });
      });
    }

    cam.manager.register('rebuild', function (resp) {
      rebuild(resp);
    }, 10);

    cam.manager.get_model(modelId);
  }




  addModel(manager) {
    manager.add_model();
  }

  getNodeInfo(node) {
    let result: any = {};

    each(node.types(), function (srcType) {
      let type = srcType.type() === 'complement' ? srcType.complement_class_expression() : srcType;

      result.id = type.class_id();
      result.label = type.class_label();
      result.classExpression = type;
    });

    return result;
  }

  getNodeLocation(node) {
    let result = {
      x: 0,
      y: 0
    };

    let x_annotations = node.get_annotations_by_key('hint-layout-x');
    let y_annotations = node.get_annotations_by_key('hint-layout-y');

    if (x_annotations.length === 1) {
      result.x = parseInt(x_annotations[0].value());
    }

    if (y_annotations.length === 1) {
      result.y = parseInt(y_annotations[0].value());
    }

    return result;
  }

  getNodeIsComplement(node) {
    var result = true;
    if (node) {
      each(node.types(), function (in_type) {
        let t = in_type.type();
        result = result && (t === 'complement');
      });
    }

    return result;
  }

  subjectToTerm(graph, object) {
    const self = this;

    let node = graph.get_node(object);
    let nodeInfo = self.getNodeInfo(node);
    let result = {
      term: {
        id: nodeInfo.id,
        label: nodeInfo.label,
      },
      classExpression: nodeInfo.classExpression,
      location: self.getNodeLocation(node),
      isComplement: self.getNodeIsComplement(node)
    }

    return result;
  }

  edgeToEvidence(graph, edge) {
    const self = this;
    const evidenceAnnotations = edge.get_annotations_by_key('evidence');
    let result = [];

    each(evidenceAnnotations, function (evidenceAnnotation) {
      let annotationId = evidenceAnnotation.value();
      let annotationNode = graph.get_node(annotationId);
      let evidence = new Evidence();

      evidence.individualId = annotationNode.id()
      if (annotationNode) {

        let nodeInfo = self.getNodeInfo(annotationNode);
        evidence.setEvidence({
          id: nodeInfo.id,
          label: nodeInfo.label
        }, nodeInfo.classExpression);

        let sources = annotationNode.get_annotations_by_key('source');
        let withs = annotationNode.get_annotations_by_key('with');
        let assignedBys = annotationNode.get_annotations_by_key('providedBy');
        if (sources.length > 0) {
          evidence.setReference(sources[0].value(), self.linker.url(sources[0].value()));
        }
        if (withs.length > 0) {
          if (withs[0].value().startsWith('gomodel')) {
            evidence.setWith(withs[0].value());
          } else {
            evidence.setWith(withs[0].value(), self.linker.url(withs[0].value()));
          }
        }
        if (assignedBys.length > 0) {
          evidence.setAssignedBy(assignedBys[0].value(), assignedBys[0].value());
        }
        result.push(evidence);
      }
    });

    return result;
  }

  graphPreParse(graph) {
    const self = this;
    var promises = [];

    each(graph.get_nodes(), function (node) {
      let termNodeInfo = self.getNodeInfo(node);

      each(graph.get_edges_by_subject(node.id()), function (e) {
        let predicateId = e.predicate_id();
        let objectNode = graph.get_node(e.object_id())
        let objectTermNodeInfo = self.getNodeInfo(objectNode);

        if (self.noctuaFormConfigService.closureCheck[predicateId]) {
          each(self.noctuaFormConfigService.closureCheck[predicateId].closures, function (closure) {
            if (closure.subject) {
              promises.push(self.isaClosurePreParse(termNodeInfo.id, closure.subject.id, node));
            }

            if (objectTermNodeInfo.id && closure.object) {
              promises.push(self.isaClosurePreParse(objectTermNodeInfo.id, closure.object.id, node));
            }
          });
        }
      });
    });

    return Observable.forkJoin(promises);
  }

  graphPostParse(cam: Cam, graph) {
    const self = this;
    var promises = [];

    each(cam.annotons, function (annoton: Annoton) {
      let mfNode = annoton.getMFNode();

      if (mfNode && mfNode.hasValue()) {
        promises.push(self.isaClosurePostParse(mfNode.getTerm().id, self.noctuaFormConfigService.closures.catalyticActivity.id, mfNode));
      }

    })

    return Observable.forkJoin(promises)
  }

  isaClosurePreParse(a, b, node) {
    const self = this;

    return self.noctuaLookupService.isaClosure(a, b);
    /*
    .subscribe(function (data) {
      self.noctuaLookupService.addLocalClosure(a, b, data);
    });
    */
  }

  isaClosurePostParse(a, b, node: AnnotonNode) {
    const self = this;

    return self.noctuaLookupService.isaClosure(a, b).pipe(
      map(result => {
        node.isCatalyticActivity = result;
        console.log(result, "ooo")
        return result;
      }))

    /*
    .subscribe(function (data) {
      self.noctuaLookupService.addLocalClosure(a, b, data);
    });
    */
  }

  /*
  isaNodeClosure(a, b, node, annoton) {
    const self = this;
    let deferred = self.$q.defer();
   
    self.noctuaLookupService.isaClosure(a, b).then(function (data) {
      if (data) {
        node.closures.push(a);
        //annoton.parser.parseNodeOntology(node, data);
      }
      // console.log("node closure", data, node);
      deferred.resolve({
        annoton: annoton,
        node: node,
        result: data
      });
    });
   
    return deferred.promise;
  }
  */

  determineAnnotonType(gpObjectNode) {
    const self = this;

    if (self.noctuaLookupService.getLocalClosure(gpObjectNode.term.id, noctuaFormConfig.closures.gp.id)) {
      return noctuaFormConfig.annotonType.options.simple.name;
    } else if (self.noctuaLookupService.getLocalClosure(gpObjectNode.term.id, noctuaFormConfig.closures.mc.id)) {
      return noctuaFormConfig.annotonType.options.complex.name;
    }

    return null;
  }

  determineAnnotonModelType(mfNode, mfEdgesIn) {
    const self = this;
    let result = noctuaFormConfig.annotonModelType.options.default.name;

    if (mfNode.term.id === noctuaFormConfig.rootNode.mf.id) {
      each(mfEdgesIn, function (toMFEdge) {
        let predicateId = toMFEdge.predicate_id();

        if (_.find(noctuaFormConfig.causalEdges, {
          id: predicateId
        })) {
          result = noctuaFormConfig.annotonModelType.options.bpOnly.name;
        }
      });
    }

    return result;
  }

  graphToAnnotons(cam: Cam) {
    const self = this;
    let annotons: Annoton[] = [];

    each(cam.graph.all_edges(), function (e) {
      if (e.predicate_id() === noctuaFormConfig.edge.enabledBy.id) {
        let mfId = e.subject_id();
        let gpId = e.object_id();
        let evidence = self.edgeToEvidence(cam.graph, e);
        let mfEdgesIn = cam.graph.get_edges_by_subject(mfId);
        let mfSubjectNode = self.subjectToTerm(cam.graph, mfId);
        let gpObjectNode = self.subjectToTerm(cam.graph, gpId);
        let gpVerified = false;
        let isDoomed = false
        let annotonType = '';// self.determineAnnotonType(gpObjectNode);
        let annotonModelType = self.determineAnnotonModelType(mfSubjectNode, mfEdgesIn);

        let annoton = self.noctuaFormConfigService.createAnnotonModel(
          annotonType ? annotonType : noctuaFormConfig.annotonType.options.simple.name,
          annotonModelType
        );
        annoton.id = gpId;
        let annotonNode = annoton.getNode('mf');

        annotonNode.location = mfSubjectNode.location;
        annotonNode.setTerm(mfSubjectNode.term, mfSubjectNode.classExpression);
        annotonNode.setEvidence(evidence);
        annotonNode.setIsComplement(mfSubjectNode.isComplement);
        annotonNode.individualId = mfId;

        annoton.parser = new AnnotonParser();

        if (annotonType) {
          //  if (!self.noctuaLookupService.getLocalClosure(mfSubjectNode.term.id, noctuaFormConfig.closures.mf.id)) {
          //     isDoomed = true;
          //    }
        } else {
          annoton.parser.setCardinalityError(annotonNode, gpObjectNode.term, noctuaFormConfig.edge.enabledBy.id);
        }

        if (isDoomed) {
          annoton.parser.setCardinalityError(annotonNode, gpObjectNode.term, noctuaFormConfig.edge.enabledBy.id);
        }

        self.connectAnnatons(cam, annoton, mfEdgesIn, annotonNode, isDoomed);

        self.graphToAnnatonDFS(cam, annoton, mfEdgesIn, annotonNode, isDoomed);

        // annoton.print();
        let srcAnnoton = cam.findAnnotonById(annoton.id);
        if (srcAnnoton) {
          annoton.expanded = srcAnnoton.expanded;
        }
        annotons.push(annoton);
      }
    });

    // self.parseNodeClosure(annotons);

    return annotons;
  }

  graphToCCOnly(graph) {
    const self = this;
    let annotons: Annoton[] = [];

    each(graph.all_edges(), function (e) {
      if (e.predicate_id() === noctuaFormConfig.edge.partOf.id) {
        let predicateId = e.predicate_id();
        let gpId = e.subject_id();
        let ccId = e.object_id();
        let evidence = self.edgeToEvidence(graph, e);
        let gpEdgesIn = graph.get_edges_by_subject(gpId);
        let ccObjectNode = self.subjectToTerm(graph, ccId);
        let gpSubjectNode = self.subjectToTerm(graph, gpId);
        let gpVerified = false;
        let isDoomed = false
        let annotonType = '';//self.determineAnnotonType(gpSubjectNode);

        let annoton = self.noctuaFormConfigService.createAnnotonModel(
          annotonType ? annotonType : noctuaFormConfig.annotonType.options.simple.name,
          noctuaFormConfig.annotonModelType.options.ccOnly.name
        );

        let annotonNode = annoton.getNode('gp');
        annotonNode.setTerm(gpSubjectNode.term, gpSubjectNode.classExpression);
        annotonNode.setEvidence(evidence);
        annotonNode.setIsComplement(gpSubjectNode.isComplement);
        annotonNode.individualId = gpId;

        annoton.parser = new AnnotonParser();

        if (annotonType) {
          //   let closureRange = self.noctuaLookupService.getLocalClosureRange(ccObjectNode.term.id, self.noctuaFormConfigService.closureCheck[predicateId]);

          //   if (!closureRange) {
          //      isDoomed = true;
          //  }

          if (isDoomed) {
            annoton.parser.setCardinalityError(annotonNode, ccObjectNode.term, predicateId);
          }

          if (annoton.annotonModelType === noctuaFormConfig.annotonModelType.options.bpOnly.name) {
            let causalEdge = _.find(noctuaFormConfig.causalEdges, {
              id: predicateId
            })
          }

          self.graphToAnnatonDFS(graph, annoton, gpEdgesIn, annotonNode, isDoomed);

          if (annoton.annotonType === noctuaFormConfig.annotonType.options.complex.name) {
            //annoton.populateComplexData();
          }

          annotons.push(annoton);
        } else {
          annoton.parser.setCardinalityError(annotonNode, ccObjectNode.term, predicateId);
          //  self.graphToAnnatonDFS(graph, annoton, ccEdgesIn, annotonNode, true);
        }
      }
    });

    //  self.parseNodeClosure(annotons);

    return annotons;
  }

  graphToAnnatonDFS(cam: Cam, annoton, mfEdgesIn, annotonNode, isDoomed) {
    const self = this;
    let edge = annoton.getEdges(annotonNode.id);

    if (annoton.parser.parseCardinality(cam.graph, annotonNode, mfEdgesIn, edge.nodes)) {
      each(mfEdgesIn, function (toMFEdge) {
        let predicateId = toMFEdge.predicate_id();
        let evidence = self.edgeToEvidence(cam.graph, toMFEdge);
        let toMFObject = toMFEdge.object_id();

        if (annotonNode.id === "mc" && predicateId === noctuaFormConfig.edge.hasPart.id) {
          self.noctuaFormConfigService.addGPAnnotonData(annoton, toMFObject);
        }

        if (annoton.annotonModelType === noctuaFormConfig.annotonModelType.options.bpOnly.name) {
          let causalEdge = _.find(noctuaFormConfig.causalEdges, {
            id: predicateId
          })

          if (causalEdge) {
            //   self.adjustBPOnly(annoton, causalEdge);
          }
        }

        each(edge.nodes, function (node) {
          if (predicateId === node.edge.id) {
            if (predicateId === noctuaFormConfig.edge.hasPart.id && toMFObject !== node.object.id) {
              //do nothing
            } else {
              let subjectNode = self.subjectToTerm(cam.graph, toMFObject);

              node.object.individualId = toMFObject;
              node.object.setEvidence(evidence);
              node.object.setTerm(subjectNode.term, subjectNode.classExpression);
              node.object.location = subjectNode.location;
              node.object.setIsComplement(subjectNode.isComplement)

              //self.check
              let closureRange = 'false';// self.noctuaLookupService.getLocalClosureRange(subjectNode.term.id, self.noctuaFormConfigService.closureCheck[predicateId]);

              if (!closureRange && !_.find(noctuaFormConfig.causalEdges, {
                id: predicateId
              })) {
                isDoomed = true;
                annoton.parser.setCardinalityError(annotonNode, node.object.getTerm(), predicateId);
              }

              if (isDoomed) {
                annoton.parser.setNodeWarning(node.object)
              }

              self.graphToAnnatonDFS(cam, annoton, cam.graph.get_edges_by_subject(toMFObject), node.object, isDoomed);
            }
          }
        });
      });
    }


    self.connectAnnatons(cam, annoton, mfEdgesIn, annotonNode, isDoomed);

    return annoton;

  }

  connectAnnatons(cam, annoton, mfEdgesIn, annotonNode, isDoomed) {
    const self = this;

    if (annotonNode.id === "mf" || annotonNode.id === "bp") {
      let edge = annoton.getEdges(annotonNode.id);

      each(mfEdgesIn, function (toMFEdge) {
        let predicateId = toMFEdge.predicate_id();
        let evidence = self.edgeToEvidence(cam.graph, toMFEdge);
        let toMFObject = toMFEdge.object_id();

        let causalEdge = _.find(noctuaFormConfig.causalEdges, {
          id: predicateId
        })

        if (causalEdge && predicateId === causalEdge['id']) {
          let destNode = self.noctuaFormConfigService.generateNode('mf', { id: toMFObject });
          let mfNode = self.subjectToTerm(cam.graph, toMFObject);

          destNode.setTerm(mfNode.term);
          destNode.setEvidence(evidence);
          destNode.individualId = toMFObject;
          annoton.addNode(destNode);
          annoton.addEdgeById(annotonNode.id, 'mf' + toMFObject, causalEdge);
        }
      });
    }
  }

  /*
  parseNodeClosure(annotons) {
    const self = this;
    let promises = [];
   
    each(annotons, function (annoton) {
      each(annoton.nodes, function (node) {
        let term = node.getTerm();
        if (term) {
          promises.push(self.isaNodeClosure(node.noctuaLookupServiceGroup, term.id, node, annoton));
   
          forOwn(annoton.edges, function (srcEdge, key) {
            each(srcEdge.nodes, function (srcNode) {
              //  let nodeExist = destAnnoton.getNode(key);
              //  if (nodeExist && srcNode.object.hasValue()) {
              //   destAnnoton.addEdgeById(key, srcNode.object.id, srcNode.edge);
              //   }
            });
          });
        }
      });
    });
   
    self.$q.all(promises).then(function (data) {
      console.log('done node clodure', data)
   
      each(data, function (entity) {
        //entity.annoton.parser.parseNodeOntology(entity.node);
      });
    });
  }
  */

  graphToAnnatonDFSError(annoton, annotonNode) {
    const self = this;
    let edge = annoton.getEdges(annotonNode.id);

    each(edge.nodes, function (node) {
      node.object.status = 2;
      self.graphToAnnatonDFSError(annoton, node.object);
    });
  }


  ccComponentsToTable(graph, annotons) {
    const self = this;
    let result = [];

    each(annotons, function (annoton) {
      //   let annotonRows = self.ccComponentsToTableRows(graph, annoton);

      //  result = result.concat(annotonRows);
    });

    return result;
  }

  /*
   
  ccComponentsToTableRows(graph, annoton) {
    const self = this;
    let result = [];
   
    let gpNode = annoton.getGPNode();
    let ccNode = annoton.getNode('cc');
   
    let row = {
      gp: gpNode.term.control.value.label,
      cc: ccNode.term.control.value.label,
      original: JSON.parse(JSON.stringify(annoton)),
      annoton: annoton,
      annotonPresentation: self.annotonForm.getAnnotonPresentation(annoton),
    }
   
    row.evidence = gpNode.evidence
   
    return row;
  }
  */

  addIndividual(reqs, node) {
    node.saveMeta = {};
    if (node.term.control.value && node.term.control.value.id) {
      if (node.individualId) {
        node.saveMeta.term = node.individualId;
      } else if (node.isComplement) {
        let ce = new class_expression();
        ce.as_complement(node.term.control.value.id);
        node.saveMeta.term = reqs.add_individual(ce);

      } else {
        node.saveMeta.term = reqs.add_individual(node.term.control.value.id);
      }

      node.individualId = node.saveMeta.term;

      if (node.location && node.location.x > 0 && node.id === 'mf') {
        //  reqs.update_annotations(node.saveMeta.term, 'hint-layout-x', node.location.x);
        // reqs.update_annotations(node.saveMeta.term, 'hint-layout-y', node.location.y);
      }
    }
  }

  saveMFLocation(cam) {
    const self = this;

    let reqs = new minerva_requests.request_set(this.noctuaUserService.baristaToken, cam.modelId);


    // Update all of the nodes with their current local (should be
    // most recent) positions before saving.
    each(cam.graph.all_nodes(), function (node) {
      var nid = node.id();

      // Extract the current local coord.
      //   var pos = self.locationStore.get(nid);
      //var new_x = pos['x'];
      //  var new_y = pos['y'];

      // console.log('node pos', pos)

      //  reqs.update_annotations(node, 'hint-layout-x', new_x);
      //  reqs.update_annotations(node, 'hint-layout-y', new_y);

    });

    // And add the actual storage.
    reqs.store_model();
    // cam.manager.user_token(this.noctuaUserService.baristaToken);
    //  cam.manager.request_with(reqs);
  }

  edit(cam: Cam, annotonNode: AnnotonNode) {
    const self = this;

    let reqs = new minerva_requests.request_set(cam.manager.user_token(), cam.modelId);
    reqs.store_model(cam.modelId);

    if (annotonNode.hasValue()) {
      self.editIndividual(reqs,
        cam.modelId,
        annotonNode.individualId,
        annotonNode.classExpression,
        annotonNode.getTerm().id);
    }

    each(annotonNode.evidence, (evidence: Evidence, key) => {
      if (evidence.hasValue()) {
        self.editIndividual(reqs,
          cam.modelId,
          evidence.individualId,
          evidence.classExpression,
          evidence.getEvidence().id);
      }
    });

    let rebuild = (resp) => {
      let noctua_graph = model.graph;

      cam.graph = new noctua_graph();
      cam.modelId = resp.data().id;
      cam.graph.load_data_basic(resp.data());

      self.graphPreParse(cam.graph).subscribe((data) => {
        cam.annotons = self.graphToAnnotons(cam);
        self.saveMFLocation(cam)
        cam.onGraphChanged.next(cam.annotons);
      });
    }

    cam.manager.register('rebuild', (resp) => {
      rebuild(resp);
    }, 10);

    cam.manager.user_token(this.noctuaUserService.baristaToken);

    return cam.manager.request_with(reqs);
  }

  editIndividual(reqs, modelId, individualId, classExpression, classId) {
    reqs.remove_type_from_individual(
      // class_expression.cls(oldClassId),
      classExpression,
      individualId,
      modelId,
    );

    reqs.add_type_to_individual(
      class_expression.cls(classId),
      individualId,
      modelId,
    );
  }

  editIndividual2(reqs, cam, srcNode, destNode) {
    if (srcNode.hasValue() && destNode.hasValue()) {
      reqs.remove_type_from_individual(
        //  class_expression.cls(srcNode.getTerm().id),
        srcNode.getNodeType(),
        srcNode.individualId,
        cam.modelId,
      );

      reqs.add_type_to_individual(
        class_expression.cls(destNode.getTerm().id),
        srcNode.individualId,
        cam.modelId,
      );
    }
  }

  deleteIndividual(reqs, node) {
    if (node.individualId) {
      reqs.remove_individual(node.individualId);
    }
  }

  addEvidence(cam, srcNode, destNode) {
    let reqs = new minerva_requests.request_set(this.noctuaUserService.baristaToken, cam.modelId);

    if (srcNode.hasValue() && destNode.hasValue()) {
      // let ce = new class_expression(destNode.term.control.value.id);
      reqs.remove_type_from_individual(
        class_expression.cls(srcNode.getTerm().id),
        srcNode.individualId,
        cam.modelId,
      );

      reqs.add_type_to_individual(
        class_expression.cls(destNode.getTerm().id),
        srcNode.individualId,
        cam.modelId,
      );

      cam.manager.user_token(cam.baristaToken);
      cam.manager.request_with(reqs);
    }
  }

  addFact(reqs, annoton, node) {
    let edge = annoton.getEdges(node.id);

    each(edge.nodes, function (edgeNode) {
      let subject = node.saveMeta.term;
      let object = edgeNode.object ? edgeNode.object.saveMeta.term : null;

      if (subject && object && edge) {
        if (edgeNode.object.edgeOption) {
          edgeNode.edge = edgeNode.object.edgeOption.selected
        }
        edgeNode.object.saveMeta.edge = reqs.add_fact([
          node.saveMeta.term,
          edgeNode.object.saveMeta.term,
          edgeNode.edge.id
        ]);


        if (edgeNode.object.id === 'gp') {
          each(node.evidence, function (evidence) {
            let evidenceReference = evidence.reference.control.value;
            let evidenceWith = evidence.with.control.value;

            reqs.add_evidence(evidence.evidence.control.value.id, evidenceReference, evidenceWith, edgeNode.object.saveMeta.edge);
          });
        } else {
          each(edgeNode.object.evidence, function (evidence) {
            let evidenceReference = evidence.reference.control.value;
            let evidenceWith = evidence.with.control.value;
            // if (edgeNode.object.aspect === 'P') {
            //  let gpNode = annoton.getGPNode();
            //  if (gpNode && gpNode.individualId) {
            // evidenceWith.push(gpNode.individualId)
            //  }
            // }
            reqs.add_evidence(evidence.evidence.control.value.id, evidenceReference, evidenceWith, edgeNode.object.saveMeta.edge);
          });
        }
      }
    });
  }


  evidenceUseGroups(reqs, evidence) {
    const self = this;
    let assignedBy = evidence.getAssignedBy();

    if (assignedBy) {
      reqs.use_groups(['http://purl.obolibrary.org/go/groups/' + assignedBy]);
    } else if (self.userInfo.groups.length > 0) {
      reqs.use_groups([self.userInfo.selectedGroup.id]);
    } else {
      reqs.use_groups([]);
    }
  }

  adjustBPOnly(annoton, srcEdge) {
    const self = this;
    let mfNode = annoton.getNode('mf');
    let bpNode = annoton.getNode('bp');



    if (mfNode && bpNode && annoton.annotonModelType === noctuaFormConfig.annotonModelType.options.bpOnly.name) {
      mfNode.displaySection = noctuaFormConfig.displaySection.fd;
      mfNode.displayGroup = noctuaFormConfig.displayGroup.mf;
      annoton.editEdge('mf', 'bp', srcEdge);
      bpNode.relationship = annoton.getEdge('mf', 'bp').edge;
    }
  }



  saveModelGroup(cam: Cam, groupId) {
    const self = this

    cam.manager.use_groups([groupId]);
  }

  saveCamAnnotations(cam: Cam, annotations) {
    const self = this;

    let titleAnnotations = cam.graph.get_annotations_by_key('title');
    let stateAnnotations = cam.graph.get_annotations_by_key('state');
    let reqs = new minerva_requests.request_set(cam.manager.user_token(), cam.modelId);

    each(titleAnnotations, function (annotation) {
      reqs.remove_annotation_from_model('title', annotation.value())
    });

    each(stateAnnotations, function (annotation) {
      reqs.remove_annotation_from_model('state', annotation.value())
    });

    reqs.add_annotation_to_model('title', annotations.title);
    reqs.add_annotation_to_model('state', annotations.state);

    cam.manager.request_with(reqs);
  }

  /*
  checkIfNodeExist(srcAnnoton) {
    const self = this;
    let infos = [];
  
    each(srcAnnoton.nodes, function (srcNode) {
      let srcTerm = srcNode.getTerm();
  
      if (srcTerm.id && !srcNode.individualId) {
        let meta = {
          aspect: srcNode.label,
          subjectNode: {
            node: srcNode,
            label: srcNode.term.control.value.label
          },
          linkedNodes: []
        }
  
        each(self.gridData.annotons, function (annotonData) {
          each(annotonData.annoton.nodes, function (node) {
  
            if (srcTerm.id === node.getTerm().id) {
              if (!_.find(meta.linkedNodes, {
                modelId: node.individualId
              })) {
                meta.linkedNodes.push(node);
              }
            }
          });
        });
  
        if (meta.linkedNodes.length > 0) {
          let info = new AnnotonError('error', 5, "Instance exists " + srcNode.term.control.value.label, meta);
  
          infos.push(info);
        }
      }
  
    });
  
    return infos;
  }
  */
  annotonAdjustments(annoton: Annoton) {
    const self = this;
    let infos = []; //self.checkIfNodeExist(annoton);

    switch (annoton.annotonModelType) {
      case noctuaFormConfig.annotonModelType.options.default.name:
        {
          let mfNode = annoton.getNode('mf');
          let ccNode = annoton.getNode('cc');
          let cc1Node = annoton.getNode('cc-1');
          let cc11Node = annoton.getNode('cc-1-1');
          let cc111Node = annoton.getNode('cc-1-1-1');

          if (!ccNode.hasValue()) {
            if (cc1Node.hasValue()) {
              let meta = {
                aspect: cc1Node.label,
                subjectNode: {
                  label: mfNode.term.control.value.label
                },
                edge: {
                  label: noctuaFormConfig.edge.occursIn
                },
                objectNode: {
                  label: cc1Node.term.control.value.label
                },
              }
              let info = new AnnotonError('error', 2, "No CC found, added  ", meta);

              infos.push(info);
            } else if (cc11Node.hasValue()) { }
          }
          break;
        }
      case noctuaFormConfig.annotonModelType.options.bpOnly.name:
        {
          let mfNode = annoton.getNode('mf');
          let bpNode = annoton.getNode('bp');

          break;
        }
    }
    return infos;
  }

  createSave(srcAnnoton: Annoton) {
    const self = this;
    let destAnnoton = new Annoton();
    destAnnoton.copyStructure(srcAnnoton);

    let skipNodeDFS = function (sourceId, objectId) {
      const self = this;
      let srcEdge = srcAnnoton.edges[objectId];

      if (srcEdge) {
        each(srcEdge.nodes, function (srcNode) {
          let nodeExist = destAnnoton.getNode(sourceId) && destAnnoton.getNode(srcNode.object.id);
          if (nodeExist && srcNode.object.hasValue()) {
            destAnnoton.addEdgeById(sourceId, srcNode.object.id, srcNode.edge);
          } else {
            skipNodeDFS(sourceId, srcNode.object.id);
          }
        });
      }
    }

    each(srcAnnoton.nodes, function (srcNode) {
      if (srcNode.hasValue()) {
        let destNode = srcNode;

        if (destAnnoton.annotonType === noctuaFormConfig.annotonType.options.simple.name) {
          if (srcNode.displayGroup.id !== noctuaFormConfig.displayGroup.mc.id) {
            destAnnoton.addNode(destNode);
          }
        } else {
          if (srcNode.id !== 'gp') {
            destAnnoton.addNode(destNode);
          }
        }
      }
    });

    forOwn(srcAnnoton.edges, function (srcEdge, key) {
      each(srcEdge.nodes, function (srcNode) {
        let nodeExist = destAnnoton.getNode(key);
        if (nodeExist && srcNode.object.hasValue()) {
          destAnnoton.addEdgeById(key, srcNode.object.id, srcNode.edge);
        } else {
          skipNodeDFS(key, srcNode.object.id);
        }
      });
    });

    console.log('create save', destAnnoton);

    return destAnnoton;
  }

  adjustAnnoton(annoton: Annoton) {
    const self = this;

    switch (annoton.annotonModelType) {
      case noctuaFormConfig.annotonModelType.options.default.name:
        {
          let mfNode = annoton.getNode('mf');
          let ccNode = annoton.getNode('cc');
          let cc1Node = annoton.getNode('cc-1');
          let cc11Node = annoton.getNode('cc-1-1');
          let cc111Node = annoton.getNode('cc-1-1-1');

          if (!ccNode.hasValue()) {
            if (cc1Node.hasValue()) {
              ccNode.setTerm(noctuaFormConfig.rootNode[ccNode.id]);
              ccNode.evidence = cc1Node.evidence;
            } else if (cc11Node.hasValue()) {
              ccNode.setTerm(noctuaFormConfig.rootNode[ccNode.id]);
              ccNode.evidence = cc11Node.evidence;
            } else if (cc111Node.hasValue()) {
              ccNode.setTerm(noctuaFormConfig.rootNode[ccNode.id]);
              ccNode.evidence = cc111Node.evidence;
            }
          }
          break;
        }
      case noctuaFormConfig.annotonModelType.options.bpOnly.name:
        {
          let mfNode = annoton.getNode('mf');
          let bpNode = annoton.getNode('bp');

          mfNode.setTerm({
            id: 'GO:0003674',
            label: 'molecular_function'
          });
          mfNode.evidence = bpNode.evidence;
          break;
        }
    }

    return self.createSave(annoton);
  }

  saveMF(cam, individual, success) {
    const self = this;

    let merge = (resp) => {
      let individuals = resp.individuals();
      if (individuals.length > 0) {
        let mfResponse = individuals[0];

        individual.individualId = mfResponse.id;
        success(mfResponse);
      }
    }

    cam.individualManager.register('merge', merge, 10);

    let reqs = new minerva_requests.request_set(cam.individualManager.user_token(), cam.model.id);
    reqs.add_individual(individual.getTerm().id);
    return cam.individualManager.request_with(reqs);
  }



  saveAnnoton(cam, annoton: Annoton) {
    const self = this;
    let geneProduct;
    let mfNode = annoton.getMFNode();

    if (annoton.annotonType === noctuaFormConfig.annotonType.options.complex.name) {
      geneProduct = annoton.getNode('mc');
    } else {
      geneProduct = annoton.getNode('gp');
    }

    function success() {
      let reqs = new minerva_requests.request_set(cam.manager.user_token(), cam.model.id);

      if (!cam.title) {
        const defaultTitle = 'enabled by ' + geneProduct.term.control.value.label;
        reqs.add_annotation_to_model('title', defaultTitle);
      }

      each(annoton.nodes, function (node) {
        self.addIndividual(reqs, node);
      });

      each(annoton.nodes, function (node) {
        self.addFact(reqs, annoton, node);
      });

      reqs.store_model(cam.modelId);

      if (self.userInfo.groups.length > 0) {
        reqs.use_groups([self.userInfo.selectedGroup.id]);
      }

      return cam.manager.request_with(reqs);
    }

    return self.saveMF(cam, mfNode, success);

    // return success();

  }

  saveConnection(cam, annoton: Annoton, subjectNode: AnnotonNode, objectNode: AnnotonNode) {
    const self = this;

    function success() {
      const manager = cam.manager;
      let reqs = new minerva_requests.request_set(manager.user_token(), cam.model.id);

      self.addIndividual(reqs, subjectNode);
      self.addIndividual(reqs, objectNode);
      self.addFact(reqs, annoton, subjectNode);

      reqs.store_model(cam.model.id);

      if (self.userInfo.groups.length > 0) {
        reqs.use_groups([self.userInfo.selectedGroup.id]);
      }

      return manager.request_with(reqs);
    }

    //return self.saveGP(geneProduct, success);

    return success();

  }

  deleteAnnoton(annoton, ev) {
    const self = this;
  }


}