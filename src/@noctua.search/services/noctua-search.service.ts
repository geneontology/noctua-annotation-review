import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import * as _ from 'lodash';
import { BehaviorSubject, Observable, Subscriber } from 'rxjs';
import { map, filter, reduce, catchError, retry, tap } from 'rxjs/operators';

import { NoctuaUtils } from '@noctua/utils/noctua-utils';
import { SparqlService } from '@noctua.sparql/services/sparql/sparql.service';
import { Cam, Contributor } from 'noctua-form-base';

export interface Cam202 {
    model?: {};
    annotatedEntity?: {};
    relationship?: string;
    aspect?: string;
    term?: {};
    relationshipExt?: string;
    extension?: string;
    evidence?: string;
    reference?: string;
    with?: string;
    assignedBy?: string;
}

@Injectable({
    providedIn: 'root'
})
export class NoctuaSearchService {
    baseUrl = environment.spaqrlApiUrl;
    curieUtil: any;
    cams: any[] = [];
    onCamsChanged: BehaviorSubject<any>;

    constructor(private httpClient: HttpClient, private sparqlService: SparqlService) {
        this.onCamsChanged = new BehaviorSubject({});

    }

    search(searchCriteria) {
        this.sparqlService.getCams(searchCriteria).subscribe((response: any) => {
            this.sparqlService.cams = this.cams = response;
            this.sparqlService.onCamsChanged.next(this.cams);
        });
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
