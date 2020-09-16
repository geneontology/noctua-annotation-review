import { environment } from './../../environments/environment';
import { Injectable } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { NoctuaGraphService } from 'noctua-form-base';
import { HttpParams } from '@angular/common/http';
import { ReviewMode } from './../models/review-mode';

@Injectable({
    providedIn: 'root'
})
export class NoctuaSearchMenuService {
    leftPanel = {
        search: {
            id: 1
        }, filter: {
            id: 2
        }, relation: {
            id: 3
        }, group: {
            id: 4
        }, contributor: {
            id: 5
        }, organism: {
            id: 6
        }, history: {
            id: 7
        }, replace: {
            id: 8
        }
    };

    rightPanel = {
        camForm: {
            id: 1
        }, connectorForm: {
            id: 2
        }, annotonForm: {
            id: 3
        }, annotonEntityForm: {
            id: 4
        }, camTable: {
            id: 5
        }, camsReview: {
            id: 6
        }, camsReplace: {
            id: 7
        }, camDetail: {
            id: 8
        }
    };

    reviewMode: ReviewMode = ReviewMode.off;

    selectedLeftPanel;
    selectedRightPanel;

    private leftDrawer: MatDrawer;
    private rightDrawer: MatDrawer;

    constructor() {
        const self = this;
        this.selectedLeftPanel = this.leftPanel.filter;
        this.selectedRightPanel = this.rightPanel.annotonEntityForm;
    }

    selectLeftPanel(panel) {
        this.selectedLeftPanel = panel;
    }

    selectRightPanel(panel) {
        this.selectedRightPanel = panel;
    }

    public setLeftDrawer(leftDrawer: MatDrawer) {
        this.leftDrawer = leftDrawer;
    }

    public openLeftDrawer() {
        return this.leftDrawer.open();
    }

    public closeLeftDrawer() {
        return this.leftDrawer.close();
    }

    public toggleLeftDrawer(panel) {
        if (this.selectedLeftPanel.id === panel.id) {
            this.leftDrawer.toggle();
        } else {
            this.selectLeftPanel(panel);
            return this.openLeftDrawer();
        }
    }

    public setRightDrawer(rightDrawer: MatDrawer) {
        this.rightDrawer = rightDrawer;
    }

    public openRightDrawer() {
        return this.rightDrawer.open();
    }

    public closeRightDrawer() {
        return this.rightDrawer.close();
    }
}
