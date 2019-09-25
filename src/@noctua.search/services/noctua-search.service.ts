import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import * as _ from 'lodash';
import { BehaviorSubject, Observable, Subscriber } from 'rxjs';
import { map, filter, reduce, catchError, retry, tap, finalize } from 'rxjs/operators';

import { NoctuaUtils } from '@noctua/utils/noctua-utils';
import { SparqlService } from '@noctua.sparql/services/sparql/sparql.service';
import { Cam, Contributor, Group, Organism, NoctuaFormConfigService, NoctuaUserService, Entity, AnnotonNode, CamRow } from 'noctua-form-base';
import { SearchCriteria } from './../models/search-criteria';


import { saveAs } from 'file-saver';
import { each, forOwn } from 'lodash';
import { CurieService } from '@noctua.curie/services/curie.service';


@Injectable({
    providedIn: 'root'
})
export class NoctuaSearchService {
    onSearcCriteriaChanged: BehaviorSubject<any>;
    baseUrl = environment.spaqrlApiUrl;
    curieUtil: any;
    cams: any[] = [];
    searchCriteria: SearchCriteria;

    baristaApi = environment.globalBaristaLocation;
    separator = '@@';
    loading: boolean = false;
    onCamsChanged: BehaviorSubject<any>;
    onCamChanged: BehaviorSubject<any>;
    onContributorFilterChanged: BehaviorSubject<any>;

    searchSummary: any = {}

    filterType = {
        gps: 'gps',
        goterms: 'goterms',
        pmids: 'pmids',
        contributors: 'contributors',
        groups: 'groups',
        organisms: 'organisms',
        states: 'states'
    }

    constructor(private httpClient: HttpClient,
        public noctuaFormConfigService: NoctuaFormConfigService,
        public noctuaUserService: NoctuaUserService,
        private sparqlService: SparqlService,
        private curieService: CurieService) {
        this.searchCriteria = new SearchCriteria();
        this.onSearcCriteriaChanged = new BehaviorSubject(null);
        this.onCamsChanged = new BehaviorSubject({});
        this.onCamChanged = new BehaviorSubject({});
        this.curieUtil = this.curieService.getCurieUtil();

        this.onSearcCriteriaChanged.subscribe((searchCriteria: SearchCriteria) => {
            if (!searchCriteria) return;

            this.getCams(searchCriteria).subscribe((response: any) => {
                this.sparqlService.cams = this.cams = response;
                this.sparqlService.onCamsChanged.next(this.cams);
            });
        });
    }

    search(searchCriteria) {
        this.searchCriteria = new SearchCriteria();

        searchCriteria.contributor ? this.searchCriteria.contributors.push(searchCriteria.contributor) : null;
        searchCriteria.group ? this.searchCriteria.groups.push(searchCriteria.group) : null;
        searchCriteria.pmid ? this.searchCriteria.pmids.push(searchCriteria.pmid) : null;
        searchCriteria.goterm ? this.searchCriteria.goterms.push(searchCriteria.goterm) : null;
        searchCriteria.gp ? this.searchCriteria.gps.push(searchCriteria.gp) : null;
        searchCriteria.organism ? this.searchCriteria.organisms.push(searchCriteria.organism) : null;
        searchCriteria.state ? this.searchCriteria.states.push(searchCriteria.state) : null;

        this.updateSearch();
    }

    updateSearch() {
        this.onSearcCriteriaChanged.next(this.searchCriteria);
    }

    filter(filterType, filter) {
        this.searchCriteria[filterType].push(filter);
        this.updateSearch();
    }

    removeFilterType(filterType: string) {
        this.searchCriteria[filterType] = [];
        this.updateSearch();
    }

    removeFilter(filterType, filter) {
        this.searchCriteria[filterType] = null;
    }

    clearSearchCriteria() {
        this.searchCriteria = new SearchCriteria();
        this.updateSearch();
    }

    downloadSearchConfig() {
        let blob = new Blob([JSON.stringify(this.searchCriteria, undefined, 2)], { type: "application/json" });
        saveAs(blob, "search-filter.json");
    }

    uploadSearchConfig(searchCriteria) {
        this.searchCriteria = new SearchCriteria();

        if (searchCriteria.contributors) {
            this.searchCriteria.contributors = searchCriteria.contributors;
        }
        if (searchCriteria.groups) {
            this.searchCriteria.groups = searchCriteria.groups;
        }
        if (searchCriteria.pmids) {
            this.searchCriteria.pmids = searchCriteria.pmids
        }
        if (searchCriteria.goterms) {
            this.searchCriteria.goterms = searchCriteria.goterms
        }
        if (searchCriteria.gps) {
            this.searchCriteria.gps = searchCriteria.gps
        }
        if (searchCriteria.organisms) {
            this.searchCriteria.organisms = searchCriteria.organisms
        }
        if (searchCriteria.states) {
            this.searchCriteria.states = searchCriteria.states
        }

        this.updateSearch();
    }

    getCams(searchCriteria: SearchCriteria): Observable<any> {
        const self = this;

        let query = searchCriteria.build()
        let url = `${this.baristaApi}/search?${query}`

        self.loading = true;

        return this.httpClient
            .get(url)
            .pipe(
                tap(val => console.dir(val)),
                map(res => this.addCam(res)),
                tap(val => console.dir(val)),
                finalize(() => {
                    self.loading = false;
                })
            );
    }

    addCam(res) {
        const self = this;
        let result: Array<Cam> = [];

        res.models.forEach((response) => {
            let modelId = response.id;
            let cam = new Cam();

            cam.graph = null;
            cam.id = modelId;
            cam.state = self.noctuaFormConfigService.findModelState(response.state);
            cam.title = response.title;
            cam.date = response.date

            cam.model = Object.assign({}, {
                modelInfo: this.noctuaFormConfigService.getModelUrls(modelId)
            });

            cam.groups = <Group[]>response.groups.map(function (url) {
                let group = _.find(self.noctuaUserService.groups, (group: Group) => {
                    return group.url === url
                })

                return group ? group : { url: url };
            });

            cam.contributors = <Contributor[]>response.contributors.map((orcid) => {
                let contributor = _.find(self.noctuaUserService.contributors, (contributor: Contributor) => {
                    return contributor.orcid === orcid
                })

                return contributor ? contributor : { orcid: orcid };
            });

            forOwn(response.query_match, (individuals) => {
                cam.filter.uuids.push(...individuals.map((iri) => {
                    return self.curieUtil.getCurie(iri);
                }));
            });

            cam.configureDisplayType();
            result.push(cam);
        });

        return result;
    }

    addCamTerms(res) {
        const self = this;
        let result: Array<Entity> = [];

        res.forEach((response) => {
            let term = new Entity(
                self.curieUtil.getCurie(response.id.value),
                response.label.value
            );

            result.push(term);
        });

        return result;
    }
}
