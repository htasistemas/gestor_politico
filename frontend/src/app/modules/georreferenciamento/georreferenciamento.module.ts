import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { GeoReferenciamentoComponent } from './georreferenciamento.component';

const routes: Routes = [
  { path: '', component: GeoReferenciamentoComponent }
];

@NgModule({
  declarations: [GeoReferenciamentoComponent],
  imports: [CommonModule, RouterModule.forChild(routes)]
})
export class GeoReferenciamentoModule {}
