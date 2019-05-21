import { environment } from './../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscriber } from 'rxjs';
import { map, finalize, filter, reduce, catchError, retry, tap } from 'rxjs/operators';
import {
  Graph,
  Optional,
  optional,
  Prefix,
  prefix,
  Triple,
  Query,
  triple,
} from "sparql-query-builder/dist";

import {
  NoctuaQuery
} from "noctua-sparql-query-builder/dist";

import { CurieService } from './../../../@noctua.curie/services/curie.service';
import {
  NoctuaGraphService,
  AnnotonNode,
  NoctuaFormConfigService,
  Cam,
  CamRow,
  Contributor,
  Group,
  NoctuaUserService,
  Organism
} from 'noctua-form-base'

import * as _ from 'lodash';
import { v4 as uuid } from 'uuid';
declare const require: any;
const each = require('lodash/forEach');

@Injectable({
  providedIn: 'root'
})
export class SparqlService {
  separator = '@@';
  baseUrl = environment.spaqrlApiUrl;
  curieUtil: any;
  cams: any[] = [];
  loading: boolean = false;
  onCamsChanged: BehaviorSubject<any>;
  onCamChanged: BehaviorSubject<any>;
  onContributorFilterChanged: BehaviorSubject<any>;

  searchSummary: any = {}

  constructor(public noctuaFormConfigService: NoctuaFormConfigService,
    public noctuaUserService: NoctuaUserService,
    private httpClient: HttpClient,
    private noctuaGraphService: NoctuaGraphService,
    private curieService: CurieService) {
    this.onCamsChanged = new BehaviorSubject({});
    this.onCamChanged = new BehaviorSubject({});
    this.curieUtil = this.curieService.getCurieUtil();
  }

  getCams(searchCriteria): Observable<any> {
    const self = this;

    self.loading = true;
    self.searchSummary = {}
    return this.httpClient
      .get(this.baseUrl + this.buildCamsQuery(searchCriteria))
      .pipe(
        map(res => res['results']),
        map(res => res['bindings']),
        tap(val => console.dir(val)),
        map(res => this.addCam(res)),
        tap(val => console.dir(val)),
        tap(res => {
          self.searchSummary = searchCriteria
        }),
        finalize(() => {
          self.loading = false;
        })
      );
  }

  //GO:0099160
  getCamsByGoTerm(term): Observable<any> {
    const self = this;

    self.loading = true;
    self.searchSummary = {}
    return this.httpClient
      .get(this.baseUrl + this.buildCamsByGoTermQuery(term))
      .pipe(
        map(res => res['results']),
        map(res => res['bindings']),
        tap(val => console.dir(val)),
        map(res => this.addCam(res)),
        tap(val => console.dir(val)),
        tap(res => {
          self.searchSummary =
            {
              term: term
            }
        }),
        finalize(() => {
          self.loading = false;
        })
      );
  }

  //PMID:25869803
  getCamsByPMID(pmid): Observable<any> {
    const self = this;

    self.loading = true;
    self.searchSummary = {}
    return this.httpClient
      .get(this.baseUrl + this.buildCamsPMIDQuery(pmid))
      .pipe(
        map(res => res['results']),
        map(res => res['bindings']),
        tap(val => console.dir(val)),
        map(res => this.addCam(res)),
        tap(val => console.dir(val)), tap(res => {
          self.searchSummary =
            {
              PMID: pmid
            }
        }),

        finalize(() => {
          self.loading = false;
        })
      );
  }

  //Ina Rnor (RGD:2911)
  getCamsByGP(gp): Observable<any> {
    const self = this;

    self.loading = true;
    self.searchSummary = {}
    return this.httpClient
      .get(this.baseUrl + this.buildCamsByGP(gp))
      .pipe(
        map(res => res['results']),
        map(res => res['bindings']),
        tap(val => console.dir(val)),
        map(res => this.addCam(res)),
        tap(val => console.dir(val)),
        tap(res => {
          self.searchSummary =
            {
              'Gene Product': gp
            }
        }),
        finalize(() => {
          self.loading = false;
        })
      );
  }

  getCamsByGroup(group): Observable<any> {
    const self = this;

    self.loading = true;
    self.searchSummary = {}
    return this.httpClient
      .get(this.baseUrl + this.buildCamsByGroupQuery(group))
      .pipe(
        map(res => res['results']),
        map(res => res['bindings']),
        tap(val => console.dir(val)),
        map(res => this.addCam(res)),
        tap(val => console.dir(val)),
        finalize(() => {
          self.loading = false;
        })
      );
  }

  getCamsByContributor(orcid): Observable<any> {
    const self = this;

    self.loading = true;
    self.searchSummary = {}
    return this.httpClient
      .get(this.baseUrl + this.buildCamsByContributorQuery(orcid))
      .pipe(
        map(res => res['results']),
        map(res => res['bindings']),
        tap(res => {
          self.searchSummary =
            {
              contributor: orcid
            }
        }),
        tap(val => console.dir(val)),
        map(res => this.addCam(res)),
        tap(val => console.dir(val)),
        finalize(() => {
          self.loading = false;
        })
      );
  }

  getCamsBySpecies(species): Observable<any> {
    const self = this;

    self.loading = true;
    self.searchSummary = {}
    return this.httpClient
      .get(this.baseUrl + this.buildCamsBySpeciesQuery(species.taxon_id))
      .pipe(
        map(res => res['results']),
        map(res => res['bindings']),
        tap(res => {
          self.searchSummary =
            {
              species: species.long_name
            }
        }),
        tap(val => console.dir(val)),
        map(res => this.addCam(res)),
        tap(val => console.dir(val)),
        finalize(() => {
          self.loading = false;
        })
      );
  }

  getAllContributors(): Observable<any> {
    return this.httpClient
      .get(this.baseUrl + this.buildAllContributorsQuery())
      .pipe(
        map(res => res['results']),
        map(res => res['bindings']),
        tap(val => console.dir(val)),
        map(res => this.addContributor(res)),
        tap(val => console.dir(val))
      );
  }

  getAllOrganisms(): Observable<any> {
    return this.httpClient
      .get(this.baseUrl + this.buildOrganismsQuery())
      .pipe(
        map(res => res['results']),
        map(res => res['bindings']),
        tap(val => console.dir(val)),
        map(res => this.addOrganism(res)),
        tap(val => console.dir(val))
      );
  }

  getAllGroups(): Observable<any> {
    return this.httpClient
      .get(this.baseUrl + this.buildAllGroupsQuery())
      .pipe(
        map(res => res['results']),
        map(res => res['bindings']),
        tap(val => console.dir(val)),
        map(res => this.addGroup(res)),
        tap(val => console.dir(val))
      );
  }

  addCam(res) {
    const self = this;
    let result: Array<Cam> = [];

    res.forEach((response) => {
      let modelId = self.curieUtil.getCurie(response.model.value)//this.noctuaFormConfigService.getModelId(response.model.value);
      let cam = new Cam();

      cam.id = uuid();
      cam.graph = null;
      cam.id = modelId;
      cam.title = response.modelTitle.value;
      cam.model = Object.assign({}, {
        modelInfo: this.noctuaFormConfigService.getModelUrls(modelId)
      });

      if (response.date) {
        cam.date = response.date.value
      }

      if (response.groups) {
        cam.groups = <Group[]>response.groups.value.split(self.separator).map(function (url) {
          return { url: url };
        }); ``
      }

      if (response.contributors) {
        cam.contributors = <Contributor[]>response.contributors.value.split(self.separator).map((orcid) => {
          let contributor = _.find(self.noctuaUserService.contributors, (contributor) => {
            return contributor.orcid === orcid
          })

          return contributor ? contributor : { orcid: orcid };
        });
      }

      if (response.entities) {
        cam.filter.individualIds.push(...response.entities.value.split(self.separator).map((iri) => {
          return self.curieUtil.getCurie(iri);
        }));

      } else {
        cam.resetFilter();
      }

      result.push(cam);
    });

    return result;
  }

  addContributor(res) {
    let result: Array<Contributor> = [];

    res.forEach((erg) => {
      let contributor = new Contributor();

      contributor.orcid = erg.orcid.value;
      contributor.name = erg.name.value;
      contributor.cams = erg.cams.value;
      contributor.group = {
        url: erg.affiliations.value
      }
      result.push(contributor);
    });
    return result;
  }

  addGroup(res) {
    let result: Array<Group> = [];

    res.forEach((erg) => {
      result.push({
        url: erg.url.value,
        name: erg.name.value,
        cams: erg.cams.value,
        contributorsCount: erg.contributors.value,
        contributors: erg.orcids.value.split('@@').map(function (orcid) {
          return { orcid: orcid };
        }),
      });
    });
    return result;
  }

  addOrganism(res) {
    let result: Array<Organism> = [];

    res.forEach((erg) => {
      let organism = new Organism()

      organism.taxonIri = erg.taxonIri.value;
      organism.taxonName = erg.taxonName.value;
      organism.cams = erg.cams.value;
      result.push(organism);
    });
    return result;
  }

  addGroupContributors(groups, contributors) {
    const self = this;

    _.each(groups, (group) => {
      _.each(group.contributors, (contributor) => {
        let srcContributor = _.find(contributors, { orcid: contributor.orcid })
        contributor.name = srcContributor['name'];
        contributor.cams = srcContributor['cams'];
      });
    })
  }

  addBasicCamChildren(srcCam, annotons) {
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

  //GO:0003723
  buildCamsByGoTermQuery(goTerm) {
    let query = new NoctuaQuery();

    query.goterm(goTerm.id);
    query.limit(100);
    return '?query=' + encodeURIComponent(query.build());
  }

  buildCamsQuery(searchCriteria) {
    let query = new NoctuaQuery();

    if (searchCriteria.goTerm) {
      query.goterm(searchCriteria.goTerm.id)
    }

    if (searchCriteria.contributor) {
      let orcid = this.getOrcid(searchCriteria.contributor.orcid);
      query.contributor(orcid)
    }

    if (searchCriteria.gp) {
      const gpIri = this.curieUtil.getIri(searchCriteria.gp.id)
      query.gp(gpIri);
    }

    if (searchCriteria.pmid) {
      query.pmid(searchCriteria.pmid);
    }

    if (searchCriteria.organism) {
      //   let taxonUrl = `http://purl.obolibrary.org/obo/NCBITaxon_${searchCriteria.organism.taxon_id}`;

      query.taxon(searchCriteria.organism.taxonIri);
    }

    query.limit(50);

    return '?query=' + encodeURIComponent(query.build());
  }

  buildAllContributorsQuery() {
    let query = new Query();

    query.prefix(
      prefix('rdfs', '<http://www.w3.org/2000/01/rdf-schema#>'),
      prefix('dc', '<http://purl.org/dc/elements/1.1/>'),
      prefix('metago', '<http://model.geneontology.org/>'),
      prefix('has_affiliation', '<http://purl.obolibrary.org/obo/ERO_0000066>'))
      .select(
        '?orcid ?name',
        '(GROUP_CONCAT(distinct ?organization;separator="@@") AS ?organizations)',
        '(GROUP_CONCAT(distinct ?affiliation;separator="@@") AS ?affiliations)',
        '(COUNT(distinct ?cam) AS ?cams)'
      )
      .where(
        triple('?cam', 'metago:graphType', 'metago:noctuaCam'),
        triple('?cam', 'dc:contributor', '?orcid'),
        'BIND( IRI(?orcid) AS ?orcidIRI)',
        optional(
          triple('?orcidIRI', 'rdfs:label', '?name'),
          triple('?orcidIRI', '<http://www.w3.org/2006/vcard/ns#organization-name>', '?organization'),
          triple('?orcidIRI', 'has_affiliation:', '?affiliation')
        ),
        'BIND(IF(bound(?name), ?name, ?orcid) as ?name)')
      .groupBy('?orcid ?name')
      .orderBy('?name', 'ASC');
    return '?query=' + encodeURIComponent(query.build());
  }

  buildCamsByGroupQuery(group) {
    let query = new Query();
    let graphQuery = new Query();
    graphQuery.graph('?model',
      '?model metago:graphType metago:noctuaCam; dc:date ?date; dc:title ?modelTitle; dc:contributor ?orcid; providedBy: ?providedBy',
      'BIND( IRI(?orcid) AS ?orcidIRI )',
      'BIND( IRI(?providedBy) AS ?providedByIRI )'
    );

    query.prefix(
      prefix('rdf', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#>'),
      prefix('rdfs', '<http://www.w3.org/2000/01/rdf-schema#>'),
      prefix('dc', '<http://purl.org/dc/elements/1.1/>'),
      prefix('metago', '<http://model.geneontology.org/>'),
      prefix('owl', '<http://www.w3.org/2002/07/owl#>'),
      prefix('GO', '<http://purl.obolibrary.org/obo/GO_>'),
      prefix('BP', '<http://purl.obolibrary.org/obo/GO_0008150>'),
      prefix('MF', '<http://purl.obolibrary.org/obo/GO_0003674>'),
      prefix('CC', '<http://purl.obolibrary.org/obo/GO_0005575>'),
      prefix('providedBy', '<http://purl.org/pav/providedBy>'),
      prefix('vcard', '<http://www.w3.org/2006/vcard/ns#>'),
      prefix('has_affiliation', '<http://purl.obolibrary.org/obo/ERO_0000066>'),
      prefix('enabled_by', '<http://purl.obolibrary.org/obo/RO_0002333>'),
      prefix('obo', '<http://www.geneontology.org/formats/oboInOwl#>'))
      .select(
        'distinct ?model ?modelTitle ?date',
        '(GROUP_CONCAT(distinct ?entity;separator="@@") as ?entities)',
        '(GROUP_CONCAT(distinct ?orcid;separator="@@") as ?contributors)'
      ).where(
        `BIND("${group.name}" as ?groupName)`,
        graphQuery,
        optional(
          triple('?providedByIRI', 'rdfs:label', '?providedByLabel')
        ),
        'FILTER(?providedByLabel = ?groupName )',
        'BIND(IF(bound(?name), ?name, ?orcid) as ?name)',
      )
      .groupBy('?model ?modelTitle ?aspect ?date')
      .orderBy('?date', 'DESC')
      .limit(100)

    return '?query=' + encodeURIComponent(query.build());
  }

  buildOrganismsQuery() {

    let query = new Query();
    let graphQuery = new Query();
    graphQuery.graph('?model',
      '?model metago:graphType metago:noctuaCam',
      triple('?s', 'enabled_by:', '?entity'),
      triple('?entity', 'rdf:type', '?identifier'),
      'FILTER(?identifier != owl:NamedIndividual)'
    );

    query.prefix(
      prefix('rdf', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#>'),
      prefix('rdfs', '<http://www.w3.org/2000/01/rdf-schema#>'),
      prefix('dc', '<http://purl.org/dc/elements/1.1/>'),
      prefix('metago', '<http://model.geneontology.org/>'),
      prefix('owl', '<http://www.w3.org/2002/07/owl#>'),
      prefix('enabled_by', '<http://purl.obolibrary.org/obo/RO_0002333>'),
      prefix('in_taxon', '<http://purl.obolibrary.org/obo/RO_0002162>'))
      .select(
        'distinct ?taxonIri ?taxonName',
        '(COUNT(distinct ?model) AS ?cams)'
      ).where(
        graphQuery,
        triple('?identifier', 'rdfs:subClassOf', '?v0'),
        triple('?v0', 'owl:onProperty', 'in_taxon:'),
        triple('?v0', 'owl:someValuesFrom', '?taxonIri'),
        triple('?taxonIri', 'rdfs:label', '?taxonName'),
      )
      .groupBy('?taxonIri ?taxonName')
      .orderBy('?taxonName', 'ASC')

    return '?query=' + encodeURIComponent(query.build());
  }


  buildCamsByContributorQuery(orcid) {
    let modOrcid = this.getOrcid(orcid);

    let query = new NoctuaQuery();
    query.contributor(modOrcid);

    return '?query=' + encodeURIComponent(query.build());
  }

  buildAllGroupsQuery() {
    let query = `
        PREFIX metago: <http://model.geneontology.org/>
        PREFIX dc: <http://purl.org/dc/elements/1.1/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> 
        PREFIX has_affiliation: <http://purl.obolibrary.org/obo/ERO_0000066> 
		    PREFIX hint: <http://www.bigdata.com/queryHints#>
    
        SELECT  distinct ?name ?url         (GROUP_CONCAT(distinct ?orcidIRI;separator="@@") AS ?orcids) 
                                            (COUNT(distinct ?orcidIRI) AS ?contributors)
                                            (COUNT(distinct ?cam) AS ?cams)
        WHERE    
        {
          ?cam metago:graphType metago:noctuaCam .
          ?cam dc:contributor ?orcid .
          BIND( IRI(?orcid) AS ?orcidIRI ).  
          ?orcidIRI has_affiliation: ?url .
          ?url rdfs:label ?name .     
          hint:Prior hint:runLast true .
        }
        GROUP BY ?url ?name`

    return '?query=' + encodeURIComponent(query);
  }

  buildCamsPMIDQuery(pmid) {
    let query = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX dc: <http://purl.org/dc/elements/1.1/> 
    PREFIX metago: <http://model.geneontology.org/>
    PREFIX providedBy: <http://purl.org/pav/providedBy>
            
    SELECT distinct ?model ?modelTitle ?aspect ?term ?termLabel ?date
                        (GROUP_CONCAT( ?entity;separator="@@") as ?entities)
                        (GROUP_CONCAT(distinct ?contributor;separator="@@") as ?contributors)
                        (GROUP_CONCAT( ?providedBy;separator="@@") as ?providedBys)
    WHERE 
    {
        GRAPH ?model {
            ?model metago:graphType metago:noctuaCam ;    
                dc:date ?date;
                dc:title ?modelTitle; 
                dc:contributor ?contributor .
            optional {?model providedBy: ?providedBy } .
            ?entity dc:source ?source .
            BIND(REPLACE(?source, " ", "") AS ?source) .
            FILTER((CONTAINS(?source, "${pmid}")))
        }           
    }
    GROUP BY ?model ?modelTitle ?aspect ?term ?termLabel ?date
    ORDER BY DESC(?date)`

    return '?query=' + encodeURIComponent(query);
  }

  buildCamsByGP(gp) {

    const id = this.curieUtil.getIri(gp.id)

    console.log(id, "===")
    let query = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> 
    PREFIX dc: <http://purl.org/dc/elements/1.1/> 
    PREFIX metago: <http://model.geneontology.org/>    
    PREFIX enabled_by: <http://purl.obolibrary.org/obo/RO_0002333>    
    PREFIX providedBy: <http://purl.org/pav/providedBy>
            
    SELECT distinct ?model ?modelTitle ?aspect ?term ?termLabel ?date
                        (GROUP_CONCAT(distinct  ?entity;separator="@@") as ?entities)
                        (GROUP_CONCAT(distinct  ?contributor;separator="@@") as ?contributors)
                        (GROUP_CONCAT(distinct  ?providedBy;separator="@@") as ?providedBys)
    
    WHERE 
    {
    
      GRAPH ?model {
        ?model metago:graphType metago:noctuaCam;
            dc:date ?date;
            dc:title ?modelTitle; 
            dc:contributor ?contributor .

        optional {?model providedBy: ?providedBy } .
        ?s enabled_by: ?entity .    
        ?entity rdf:type ?identifier .
        FILTER(?identifier = <` + id + `>) .         
      }
      
    }
    GROUP BY ?model ?modelTitle ?aspect ?term ?termLabel ?date
    ORDER BY DESC(?date)`

    return '?query=' + encodeURIComponent(query);
  }


  buildCamsBySpeciesQuery(taxon) {
    let taxonUrl = "<http://purl.obolibrary.org/obo/NCBITaxon_" + taxon + ">";

    let query = `
          PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
          PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
          PREFIX owl: <http://www.w3.org/2002/07/owl#>
          PREFIX metago: <http://model.geneontology.org/>
          PREFIX dc: <http://purl.org/dc/elements/1.1/>
  
          PREFIX enabled_by: <http://purl.obolibrary.org/obo/RO_0002333>
          PREFIX in_taxon: <http://purl.obolibrary.org/obo/RO_0002162>
  
          SELECT distinct ?model ?modelTitle
  
          WHERE 
          {
              GRAPH ?model {
                  ?model metago:graphType metago:noctuaCam;
                      dc:title ?modelTitle .
                  ?s enabled_by: ?entity .    
                  ?entity rdf:type ?identifier .
                  FILTER(?identifier != owl:NamedIndividual) .         
              }
  
              ?identifier rdfs:subClassOf ?v0 . 
              ?identifier rdfs:label ?name .
              
              ?v0 owl:onProperty in_taxon: . 
              ?v0 owl:someValuesFrom ` + taxonUrl + `
          }
          LIMIT 100`
    return '?query=' + encodeURIComponent(query);
  }

  getOrcid(orcid) {
    return "\"" + orcid + "\"^^xsd:string";
  }

}
