import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { NoctuaFormComponent } from './noctua-form.component';
import { NoctuaSharedModule } from '@noctua/shared.module';
import { NoctuaAnnotonConnectorService } from 'noctua-form-base';
import { NoctuaFormGridService } from 'noctua-form-base';
import { ContextMenuModule } from 'ngx-contextmenu';

import { CamService } from 'noctua-form-base';
import { CamsTableComponent } from './cams/cams-table/cams-table.component';


import { ReviewSearchComponent } from './search/review-search/review-search.component';
import { ReviewCuratorsComponent } from './search/review-curators/review-curators.component';
import { ReviewSpeciesComponent } from './search/review-species/review-species.component';


import {
  NoctuaFormModule as NFModule,
  AnnotonFormComponent,
  AnnotonEntityFormComponent,
  CamTableComponent,
  CamRowEditDialogComponent,
  AddEvidenceDialogComponent,
  AnnotonErrorsDialogComponent,
  BeforeSaveDialogComponent,
  CreateFromExistingDialogComponent,
  LinkToExistingDialogComponent,
  SelectEvidenceDialogComponent,
  SearchDatabaseDialogComponent,
  CamDiagramComponent,
  NodeComponent,
  NodesContainerComponent,
  CamDiagramService,
  CamTableService,
  NodeService,
  AnnotonConnectorFormComponent,
  //AnnotonConnectorDialogComponent,
  AnnotonTableComponent
} from 'noctua-form';

const routes = [
  {
    path: '',
    component: NoctuaFormComponent
  }
];

@NgModule({
  imports: [
    NoctuaSharedModule,
    CommonModule,
    RouterModule.forChild(routes),
    ContextMenuModule.forRoot(),
    NFModule
  ],
  providers: [
    NoctuaFormGridService,
    CamService,
    NodeService,
    CamDiagramService,
    CamTableService,
    NoctuaAnnotonConnectorService
  ],
  declarations: [
    NoctuaFormComponent,
    CamsTableComponent,
    ReviewSearchComponent,
    ReviewCuratorsComponent,
    ReviewSpeciesComponent
  ]
  /*
  entryComponents: [
    NoctuaFormComponent,
    CamRowEditDialogComponent,
    AddEvidenceDialogComponent,
    AnnotonErrorsDialogComponent,
    BeforeSaveDialogComponent,
    CreateFromExistingDialogComponent,
    LinkToExistingDialogComponent,
    SelectEvidenceDialogComponent,
    SearchDatabaseDialogComponent,
    NodeComponent,
    NodesContainerComponent
  ]*/
})

export class NoctuaFormModule {
}
