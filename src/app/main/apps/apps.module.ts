import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NoctuaSharedModule } from '@noctua/shared.module';

const routes = [{
  path: '',
  loadChildren: './noctua-form/noctua-form.module#NoctuaFormModule'
}, {
  path: 'r',
  loadChildren: './review/review.module#ReviewModule'
}];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes),
    TranslateModule,
    NoctuaSharedModule,
  ],
  providers: [

  ]

})

export class AppsModule {
}
