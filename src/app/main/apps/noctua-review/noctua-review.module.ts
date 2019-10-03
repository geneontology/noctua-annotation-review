import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NoctuaReviewComponent } from './noctua-review.component';
import { NoctuaSharedModule } from '@noctua/shared.module';
import { ContextMenuModule } from 'ngx-contextmenu';
import { NoctuaFormModule } from './../noctua-form/noctua-form.module';
import { CamsTableComponent } from './cams/cams-table/cams-table.component';
import { NoctuaSearchBaseModule } from '@noctua.search/noctua-search.module';

const routes = [
  {
    path: '',
    component: NoctuaReviewComponent
  }
];

@NgModule({
  imports: [
    NoctuaSharedModule,
    CommonModule,
    RouterModule.forChild(routes),
    ContextMenuModule.forRoot(),
    NoctuaFormModule,
    NoctuaSearchBaseModule
  ],
  declarations: [
    NoctuaReviewComponent,
    CamsTableComponent,
  ],
  exports: [
  ]
})

export class NoctuaReviewModule {
}
