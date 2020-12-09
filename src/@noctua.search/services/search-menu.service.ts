import { Injectable } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { NoctuaPerfectScrollbarDirective } from '@noctua/directives/noctua-perfect-scrollbar/noctua-perfect-scrollbar.directive';
import { LeftPanel, MiddlePanel, RightPanel } from './../models/menu-panels';
import { ReviewMode } from './../models/review-mode';

@Injectable({
    providedIn: 'root'
})
export class NoctuaSearchMenuService {
    reviewMode: ReviewMode = ReviewMode.off;
    reviewLevel = 0;
    selectedLeftPanel: LeftPanel;
    selectedMiddlePanel: MiddlePanel;
    selectedRightPanel: RightPanel;
    resultsViewScrollbar: NoctuaPerfectScrollbarDirective;

    private leftDrawer: MatDrawer;
    private rightDrawer: MatDrawer;

    constructor() {
        this.selectedLeftPanel = LeftPanel.filter;
        this.selectedMiddlePanel = MiddlePanel.cams;
    }

    selectLeftPanel(panel: LeftPanel) {
        this.selectedLeftPanel = panel;
    }

    selectMiddlePanel(panel: MiddlePanel) {
        this.selectedMiddlePanel = panel;

        if (panel === MiddlePanel.cams) {
            this.reviewLevel = 0;
        } else if (panel === MiddlePanel.camsReview) {
            this.reviewLevel = 1;
        } else if (panel === MiddlePanel.reviewChanges) {
            this.reviewLevel = 2;
        }
    }

    selectRightPanel(panel: RightPanel) {
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

    public toggleLeftDrawer(panel: LeftPanel) {
        if (this.selectedLeftPanel === panel) {
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

    resetResults() {
        const element = document.querySelector('#noc-results');

        if (element) {
            // element.scrollTop = 0;
        }

        setTimeout(() => {
            if (this.resultsViewScrollbar) {
                this.resultsViewScrollbar.update();

                setTimeout(() => {
                    this.resultsViewScrollbar.scrollToTop(0);
                });
            }
        });
    }

    scrollTo(q: string) {

        setTimeout(() => {
            if (this.resultsViewScrollbar) {
                this.resultsViewScrollbar.update();

                setTimeout(() => {
                    this.resultsViewScrollbar.scrollToElement(q, -140, 1000);
                });
            }
        });
    }

}