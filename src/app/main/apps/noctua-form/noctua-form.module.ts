import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { NoctuaFormComponent } from './noctua-form.component';
import { NoctuaSharedModule } from '@noctua/shared.module';
import { NoctuaFormDialogService } from './services/noctua-form-dialog.service';
import { NoctuaAnnotonConnectorService } from 'noctua-form-base';
import { NoctuaFormGridService } from 'noctua-form-base';
import { ContextMenuModule } from 'ngx-contextmenu';

import { CamService } from 'noctua-form-base';

import { CamFormComponent } from './cam/cam-form/cam-form.component';
import { CamFormEntityComponent } from './cam/cam-form/cam-entity/cam-entity.component';

import { CamsTableComponent } from './cams/cams-table/cams-table.component';
import { CamTableComponent } from './cam/cam-table/cam-table.component';
import { CamRowComponent } from './cam/cam-row/cam-row.component';

import { ReviewSearchComponent } from './search/review-search/review-search.component';
import { ReviewCuratorsComponent } from './search/review-curators/review-curators.component';
import { ReviewSpeciesComponent } from './search/review-species/review-species.component';



import { CamRowEditDialogComponent } from './dialogs/cam-row-edit/cam-row-edit.component';
import { AddEvidenceDialogComponent } from './dialogs/add-evidence/add-evidence.component';
import { AnnotonErrorsDialogComponent } from './dialogs/annoton-errors/annoton-errors.component';
import { BeforeSaveDialogComponent } from './dialogs/before-save/before-save.component';
import { CreateFromExistingDialogComponent } from './dialogs/create-from-existing/create-from-existing.component';
import { LinkToExistingDialogComponent } from './dialogs/link-to-existing/link-to-existing.component';
import { SelectEvidenceDialogComponent } from './dialogs/select-evidence/select-evidence.component';
import { SearchDatabaseDialogComponent } from './dialogs/search-database/search-database.component';
import { CamDiagramComponent } from './cam/cam-diagram/cam-diagram.component';
import { NodeComponent } from './cam/cam-diagram/nodes/node/node.component';
import { NodesContainerComponent } from './cam/cam-diagram/nodes/nodes-container.component';

import { CamDiagramService } from './cam/cam-diagram/services/cam-diagram.service';
import { CamTableService } from './cam/cam-table/services/cam-table.service';
import { NodeService } from './cam/cam-diagram/nodes/services/node.service';
import { CamConnectorComponent } from './cam/cam-connector/cam-connector.component';
import { CamConnectorDialogComponent } from './dialogs/cam-connector/cam-connector.component';
import { AnnotonTableComponent } from './cam/cam-table/annoton-table/annoton-table.component';

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
  ],
  providers: [
    NoctuaFormDialogService,
    NoctuaFormGridService,
    CamService,
    NodeService,
    CamDiagramService,
    CamTableService,
    NoctuaAnnotonConnectorService
  ],
  declarations: [
    NoctuaFormComponent,
    CamConnectorDialogComponent,
    CamFormComponent,
    CamFormEntityComponent,
    CamsTableComponent,
    CamTableComponent,
    CamRowComponent,
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
    CamConnectorComponent,
    AnnotonTableComponent,

    ReviewSearchComponent,
    ReviewCuratorsComponent,
    ReviewSpeciesComponent,
  ],
  entryComponents: [
    NoctuaFormComponent,
    CamRowEditDialogComponent,
    AddEvidenceDialogComponent,
    AnnotonErrorsDialogComponent,
    BeforeSaveDialogComponent,
    CamConnectorDialogComponent,
    CreateFromExistingDialogComponent,
    LinkToExistingDialogComponent,
    SelectEvidenceDialogComponent,
    SearchDatabaseDialogComponent,
    NodeComponent,
    NodesContainerComponent
  ]
})

export class NoctuaFormModule {
}
