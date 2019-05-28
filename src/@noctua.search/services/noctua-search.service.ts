import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import * as _ from 'lodash';
import { BehaviorSubject, Observable, Subscriber } from 'rxjs';
import { map, filter, reduce, catchError, retry, tap } from 'rxjs/operators';

import { NoctuaUtils } from '@noctua/utils/noctua-utils';
import { SparqlService } from '@noctua.sparql/services/sparql/sparql.service';
import { Cam, Contributor, Group, Organism } from 'noctua-form-base';
import { SearchCriteria } from './../models/search-criteria';


@Injectable({
    providedIn: 'root'
})
export class NoctuaSearchService {

    onSearcCriteriaChanged: BehaviorSubject<any>;
    baseUrl = environment.spaqrlApiUrl;
    curieUtil: any;
    cams: any[] = [];
    searchCriteria: SearchCriteria;

    filterType = {
        gps: 'gps',
        goterms: 'goterms',
        pmids: 'pmids',
        contributors: 'contributors',
        groups: 'groups',
        organisms: 'organisms'
    }

    constructor(private httpClient: HttpClient, private sparqlService: SparqlService) {
        this.searchCriteria = new SearchCriteria();
        this.onSearcCriteriaChanged = new BehaviorSubject(null);

        this.onSearcCriteriaChanged.subscribe((searchCriteria: SearchCriteria) => {
            if (!searchCriteria) return;

            this.sparqlService.getCams(searchCriteria).subscribe((response: any) => {
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

    filterByContributor(cams, contributor) {
        return _.filter(cams, (cam: Cam) => {
            let found = _.find(cam.contributors, (contributor: Contributor) => {
                return contributor.orcid === contributor.orcid;
            });

            return found ? true : false
        });
    }

    searchByGroup(searchCriteria) {
        if (searchCriteria.group) {
            this.sparqlService.getCamsByGroup(searchCriteria.group).subscribe((response: any) => {
                this.cams = this.sparqlService.cams = response;
                this.sparqlService.onCamsChanged.next(this.cams);
            });
        }
    }

    searchByContributor(searchCriteria) {
        if (searchCriteria.contributor) {
            this.sparqlService.getCamsByContributor(searchCriteria.contributor).subscribe((response: any) => {
                this.cams = this.sparqlService.cams = response;
                this.sparqlService.onCamsChanged.next(this.cams);
            });
        }
    }

    searchBySpecies(searchCriteria) {
        if (searchCriteria.organism) {
            this.sparqlService.getCamsBySpecies(searchCriteria.organism).subscribe((response: any) => {
                this.cams = this.sparqlService.cams = response;
                this.sparqlService.onCamsChanged.next(this.cams);
            });
        }
    }
}
