import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FamiliasComponent } from './familias.component';

const routes: Routes = [{ path: '', component: FamiliasComponent }];

@NgModule({
  declarations: [FamiliasComponent],
  imports: [CommonModule, RouterModule.forChild(routes)]
})
export class FamiliasModule {}
