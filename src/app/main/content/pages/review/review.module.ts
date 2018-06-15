import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReviewComponent } from './Review.component';

const routes = [
  {
    path: '',
    component: ReviewComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
  ],
  providers: [
  ],
  declarations: [
    ReviewComponent,
  ],
  entryComponents: [ReviewComponent]
})

export class ReviewModule {
}
