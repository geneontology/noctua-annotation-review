import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HttpClientJsonpModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { ContextMenuModule } from 'ngx-contextmenu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NoctuaModule } from '@noctua/noctua.module';
import { NoctuaProgressBarModule } from '@noctua/components';

import { NoctuaSharedModule } from '@noctua/shared.module';
import { noctuaConfig } from './noctua-config';
import { AppComponent } from './app.component';
import { LayoutModule } from 'app/layout/layout.module';

import { PagesModule } from './main/pages/pages.module';
import { AppsModule } from './main/apps/apps.module';
import {
    faPaw,
    faPen,
    faSitemap,
    faUser,
    faUsers,
    faCalendarDay,
    faCalendarWeek,
    faSearch,
    faTasks,
    faListAlt,
    faChevronRight,
    faHistory,
    faShoppingBasket,
    faCopy,
    faPlus,
    faLink,
    faChevronDown,
    faLevelDownAlt,
    faLevelUpAlt,
    faArrowUp,
    faArrowDown,
    faCaretDown,
    faCaretRight,
    faAngleDoubleDown,
    faAngleDoubleUp, faUndo
} from '@fortawesome/free-solid-svg-icons';
import { faGithub, faFacebook, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { NoctuaDataService } from '@noctua.common/services/noctua-data.service';
import { StartupService } from './startup.service';

export function startup(startupService: StartupService) {
    return () => startupService.loadData();
}

const appRoutes: Routes = [
    {
        path: '**',
        redirectTo: ''
    }
];

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        HttpClientJsonpModule,
        RouterModule.forRoot(appRoutes),
        // Noctua Main and Shared modules
        NoctuaModule.forRoot(noctuaConfig),
        ContextMenuModule.forRoot(),
        NoctuaSharedModule,
        LayoutModule,
        RouterModule,
        MatSidenavModule,
        NoctuaProgressBarModule,

        //Material 
        MatSidenavModule,

        //Noctua App
        PagesModule,
        AppsModule
    ],
    providers: [
        StartupService,
        {
            provide: APP_INITIALIZER,
            useFactory: startup,
            deps: [StartupService, NoctuaDataService],
            multi: true
        }
    ],
    bootstrap: [
        AppComponent
    ]
})

export class AppModule {
    constructor(library: FaIconLibrary) {
        library.addIcons(
            faArrowUp,
            faArrowDown,
            faAngleDoubleUp,
            faAngleDoubleDown,
            faCalendarDay,
            faCalendarWeek,
            faCaretDown,
            faCaretRight,
            faChevronDown,
            faChevronRight,
            faCopy,
            faFacebook,
            faHistory,
            faGithub,
            faLevelDownAlt,
            faLevelUpAlt,
            faLink,
            faListAlt,
            faPaw,
            faPen,
            faPlus,
            faSearch,
            faShoppingBasket,
            faSitemap,
            faTasks,
            faTwitter,
            faUndo,
            faUser,
            faUsers,
        );
    }
}
