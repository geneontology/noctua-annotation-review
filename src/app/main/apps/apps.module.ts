import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NoctuaSharedModule } from '@noctua/shared.module';
import { NoctuaFormModule } from './noctua-form/noctua-form.module';
import { NoctuaSearchModule } from './noctua-search/noctua-search.module';


@NgModule({
  declarations: [],
  imports: [
    NoctuaSharedModule,
    NoctuaFormModule,
    NoctuaSearchModule
  ],
  exports: [
    NoctuaFormModule,
    NoctuaFormModule,
    NoctuaSearchModule
  ],
  providers: [

  ]

})

export class AppsModule {
}
