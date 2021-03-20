import { environment } from './../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BehaviorSubject, forkJoin, from, Observable } from 'rxjs';
import { map, finalize, switchMap, mergeMap } from 'rxjs/operators';

import {
    Cam,
    Entity,
    CamsService,
    CamQueryMatch,
    NoctuaUserService,
    NoctuaGraphService,
    CamStats,
    CamService,
} from 'noctua-form-base';
import { SearchCriteria } from './../models/search-criteria';
import { saveAs } from 'file-saver';
import { each, find } from 'lodash';
import { CurieService } from '@noctua.curie/services/curie.service';
import { CamPage } from './../models/cam-page';
import { SearchHistory } from './../models/search-history';
import { ArtBasket } from '@noctua.search/models/art-basket';
import { NoctuaSearchMenuService } from './search-menu.service';
import { NoctuaSearchService } from './noctua-search.service';

declare const require: any;

const model = require('bbop-graph-noctua');

@Injectable({
    providedIn: 'root'
})
export class NoctuaReviewSearchService {
    artBasket = new ArtBasket();
    searchHistory: SearchHistory[] = [];
    onSearchCriteriaChanged: BehaviorSubject<any>;
    onSearchHistoryChanged: BehaviorSubject<any>;
    curieUtil: any;
    camPage: CamPage;
    searchCriteria: SearchCriteria;
    searchApi = environment.searchApi;
    loading = false;
    // onCamsChanged: BehaviorSubject<any>;
    onArtBasketChanged: BehaviorSubject<any>;
    onResetReview: BehaviorSubject<boolean>;
    onReplaceChanged: BehaviorSubject<boolean>;
    onCamsPageChanged: BehaviorSubject<any>;
    onCamChanged: BehaviorSubject<any>;
    matchedEntities: Entity[] = [];
    matchedCountCursor = 0;
    matchedCount = 0;
    currentMatchedEnity: Entity;

    filterType = {
        gps: 'gps',
        terms: 'terms',
        pmids: 'pmids',
    };

    constructor(
        private noctuaUserService: NoctuaUserService,
        private _noctuaGraphService: NoctuaGraphService,
        private _noctuaSearchService: NoctuaSearchService,
        private noctuaSearchMenuService: NoctuaSearchMenuService,
        private httpClient: HttpClient,
        private camService: CamService,
        private camsService: CamsService,
        private curieService: CurieService) {
        const self = this;
        this.onArtBasketChanged = new BehaviorSubject(null);
        this.onResetReview = new BehaviorSubject(false);
        this.onReplaceChanged = new BehaviorSubject(false);
        this.onCamsPageChanged = new BehaviorSubject(null);
        this.onCamChanged = new BehaviorSubject([]);
        this.onSearchHistoryChanged = new BehaviorSubject(null);
        this.searchCriteria = new SearchCriteria();
        this.onSearchCriteriaChanged = new BehaviorSubject(null);
        this.curieUtil = this.curieService.getCurieUtil();

        this.onSearchCriteriaChanged.subscribe((searchCriteria: SearchCriteria) => {
            if (!searchCriteria) {
                return;
            }

            self.camsService.resetMatch();
            this.getCams(searchCriteria).subscribe(() => {
                // this.cams = response;
                this.matchedCountCursor = 0;
                this.calculateMatched();
                this.goto(0);
            });

            const element = document.querySelector('#noc-review-results');

            if (element) {
                element.scrollTop = 0;
            }
        });

        this.camsService.onCamsChanged
            .subscribe((cams: Cam[]) => {
                if (!cams) {
                    return;
                }
                const ids = cams.map((cam: Cam) => {
                    return cam.id;
                });

                this.searchCriteria['ids'] = ids;
            });
    }

    setup() {
        if (!this.noctuaUserService.user) {
            this.clearBasket();
            return;
        }

        const artBasket = localStorage.getItem('artBasket');

        if (artBasket) {
            this.artBasket = new ArtBasket(JSON.parse(artBasket));
            this.camsService.cams = [];
            this.addCamsToReview(this.artBasket.cams, this.camsService.cams);
            this.onArtBasketChanged.next(this.artBasket);
        }
    }

    addCamsToReview(metaCams: any[], cams: Cam[]) {
        const self = this;

        if (!metaCams || metaCams.length === 0) return;

        const ids = metaCams.map((cam: Cam) => {
            return cam.id;
        });

        self.searchCamsByIds(ids).pipe(
            switchMap((inCams: any[]) => {

                const promises = [];

                each(inCams, (inCam: Cam) => {
                    const metaCam = find(metaCams, { id: inCam.id });

                    inCam.expanded = true;
                    inCam.dateReviewAdded = metaCam ? metaCam.dateAdded : Date.now();
                    inCam.title = metaCam.title;
                    cams.push(inCam);
                    self.camService.loadCamMeta(inCam);

                    inCam.loading.status = true;
                    promises.push(inCam);
                })
                return from(promises);
            }),
            mergeMap((cam: Cam) => {
                return self.camsService.getStoredModel(cam);
            }),
            finalize(() => {
                //cam.loading.status = false;
                self.camsService.sortCams();
                self.camsService.updateDisplayNumber(cams);
                self.camsService.onCamsChanged.next(cams);
                //self.camsService.resetLoading(cams);
            })).subscribe({
                next: (response) => {
                    const cam = find(cams, { id: response.activeModel.id });
                    self._noctuaGraphService.rebuildStoredGraph(cam, response.activeModel);
                    self.populateStoredModel(cam, response)
                    cam.loading.status = false;
                    self.camsService.onCamsChanged.next(cams);
                },

            })
    }


    populateStoredModel(cam: Cam, response) {
        const self = this;
        const noctua_graph = model.graph;

        cam.storedGraph = new noctua_graph();
        cam.storedGraph.load_data_basic(response.storedModel);
        cam.storedAnnotons = self._noctuaGraphService.graphToAnnotons(cam.storedGraph)
        cam.checkStored();
        cam.reviewCamChanges();

        return response;
    }

    searchCamsByIds(ids: string[]) {
        const self = this;

        const searchCriteria = new SearchCriteria();
        searchCriteria['ids'] = ids;
        self.camsService.resetMatch();

        return self._noctuaSearchService.getCams(searchCriteria);
    }

    search(searchCriteria) {
        this.searchCriteria = new SearchCriteria();

        searchCriteria.pmid ? this.searchCriteria.pmids.push(searchCriteria.pmid) : null;
        searchCriteria.term ? this.searchCriteria.terms.push(searchCriteria.term) : null;
        searchCriteria.id ? this.searchCriteria.ids.push(searchCriteria.id) : null;
        searchCriteria.gp ? this.searchCriteria.gps.push(searchCriteria.gp) : null;

        this.updateSearch();

    }

    findNext() {
        if (this.matchedCount === 0) {
            return;
        }

        // so it circulates
        this.matchedCountCursor = (this.matchedCountCursor + 1) % this.matchedCount;
        this.currentMatchedEnity = this.matchedEntities[this.matchedCountCursor];
        this.camsService.expandMatch(this.currentMatchedEnity.uuid);
        this.camsService.currentMatch = this.currentMatchedEnity;
        this.noctuaSearchMenuService.scrollTo('#' + this.currentMatchedEnity.annotonDisplayId);

        return this.currentMatchedEnity;
    }

    findPrevious() {
        if (this.matchedCount === 0) {
            return;
        }
        this.matchedCountCursor = this.matchedCountCursor - 1;

        if (this.matchedCountCursor < 0) {
            this.matchedCountCursor = this.matchedCount - 1;
        }

        this.currentMatchedEnity = this.matchedEntities[this.matchedCountCursor];
        this.camsService.expandMatch(this.currentMatchedEnity.uuid);
        this.camsService.currentMatch = this.currentMatchedEnity;
        this.noctuaSearchMenuService.scrollTo('#' + this.currentMatchedEnity.annotonDisplayId);

        return this.currentMatchedEnity;
    }

    goto(step: number | 'first' | 'last') {
        if (this.matchedCount === 0) {
            return;
        }

        if (step === 'first') {
            step = 0;
        }

        if (step === 'last') {
            step = this.matchedEntities.length - 1;
        }

        this.matchedCountCursor = step;
        this.currentMatchedEnity = this.matchedEntities[this.matchedCountCursor];
        this.camsService.expandMatch(this.currentMatchedEnity.uuid);
        this.camsService.currentMatch = this.currentMatchedEnity;

        this.noctuaSearchMenuService.scrollTo('#' + this.currentMatchedEnity.annotonDisplayId);

        return this.currentMatchedEnity;
    }


    clear() {
        this.matchedEntities = [];
        this.matchedCountCursor = 0;
        this.matchedCount = 0;
        this.currentMatchedEnity = undefined;
        this.camsService.currentMatch = new Entity(null, null);
        this.searchCriteria = new SearchCriteria();
    }

    getPage(pageNumber: number, pageSize: number) {
        this.searchCriteria.camPage.pageNumber = pageNumber;
        this.searchCriteria.camPage.size = pageSize;
        this.updateSearch();
    }

    updateSearch(save: boolean = true) {
        this.searchCriteria.updateFiltersCount();
        this.onSearchCriteriaChanged.next(this.searchCriteria);

        if (save) {
            this.saveHistory();
        }
    }

    filter(filterType, filter) {
        this.searchCriteria[filterType].push(filter);
        this.updateSearch();
    }

    removeFilterType(filterType: string) {
        this.searchCriteria[filterType] = [];
        this.updateSearch();
    }

    removeFilter(filterType) {
        this.searchCriteria[filterType] = null;
    }

    clearSearchCriteria() {
        this.searchCriteria = new SearchCriteria();
        this.updateSearch();
    }

    saveHistory() {
        const searchHistoryItem = new SearchHistory(this.searchCriteria);
        this.searchHistory.unshift(searchHistoryItem);
        this.onSearchHistoryChanged.next(this.searchHistory);
    }

    clearHistory() {
        this.searchHistory = [];
        this.onSearchHistoryChanged.next(this.searchHistory);
    }

    addToArtBasket(id: string, title: string) {
        this.artBasket.addCamToBasket(id, title);

        localStorage.setItem('artBasket', JSON.stringify(this.artBasket));
        this.onArtBasketChanged.next(this.artBasket);
    }

    removeFromArtBasket(id) {
        this.artBasket.removeCamFromBasket(id);
        localStorage.setItem('artBasket', JSON.stringify(this.artBasket));
        this.onArtBasketChanged.next(this.artBasket);
    }

    clearBasket() {
        this.artBasket.clearBasket();
        localStorage.setItem('artBasket', JSON.stringify(this.artBasket));
        this.onArtBasketChanged.next(this.artBasket);
    }

    downloadSearchConfig() {
        const blob = new Blob([JSON.stringify(this.searchCriteria, undefined, 2)], { type: 'application/json' });
        saveAs(blob, 'search-filter.json');
    }

    uploadSearchConfig(searchCriteria) {
        this.searchCriteria = new SearchCriteria();

        if (searchCriteria.ids) {
            this.searchCriteria.ids = searchCriteria.ids;
        }
        if (searchCriteria.pmids) {
            this.searchCriteria.pmids = searchCriteria.pmids;
        }
        if (searchCriteria.terms) {
            this.searchCriteria.terms = searchCriteria.terms;
        }
        if (searchCriteria.gps) {
            this.searchCriteria.gps = searchCriteria.gps;
        }

        this.updateSearch();
    }

    getCams(searchCriteria: SearchCriteria): Observable<any> {
        const self = this;

        searchCriteria.expand = false;
        const query = searchCriteria.build(false);
        const url = `${this.searchApi}/models?${query}`;

        self.loading = true;

        return this.httpClient
            .get(url)
            .pipe(
                map(res => this.addCam(res)),
                finalize(() => {
                    self.loading = false;
                })
            );
    }

    addCam(res) {
        const self = this;
        const result: Array<Cam> = [];

        each(self.camsService.cams, (cam: Cam) => {
            return cam.clearFilter();
        });

        res.models.forEach((response) => {

            const modelId = response.id;
            const cam: Cam = find(self.camsService.cams, (inCam: Cam) => {
                return inCam.id === modelId;
            });

            if (cam) {
                cam.queryMatch = new CamQueryMatch();
                each(response.query_match, (queryMatch, key) => {
                    cam.queryMatch.terms.push(
                        ...queryMatch.map(v1 => {
                            return new Entity(
                                self.curieUtil.getCurie(key),
                                '',
                                null,
                                self.curieUtil.getCurie(v1),
                                cam.id
                            );
                        }));
                });

                cam.applyFilter();
            }

            result.push(cam);
        });

        return result;
    }

    addCamTerms(res) {
        const self = this;
        const result: Array<Entity> = [];

        res.forEach((response) => {
            const term = new Entity(
                self.curieUtil.getCurie(response.id.value),
                response.label.value
            );

            result.push(term);
        });

        return result;
    }

    calculateMatchedCountNumber(): number {
        const matchCount = this.camsService.cams.reduce((total, currentValue) => {
            total += currentValue.matchedCount;
            return total;
        }, 0);

        return matchCount;
    }


    calculateMatched() {
        this.matchedEntities = this.camsService.cams.reduce((total: Entity[], currentValue: Cam) => {
            if (currentValue.queryMatch && currentValue.queryMatch.terms) {
                total.push(...currentValue.queryMatch.terms);
            }

            return total;
        }, []);

        this.matchedCount = this.matchedEntities.length;
        this.matchedCountCursor = 0;
    }

}
