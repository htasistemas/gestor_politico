import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { FamiliasComponent } from './familias.component';
import { NovaFamiliaComponent } from './nova-familia/nova-familia.component';

const routes: Routes = [
  { path: '', component: FamiliasComponent },
  { path: 'nova', component: NovaFamiliaComponent }
];

@NgModule({
  declarations: [FamiliasComponent, NovaFamiliaComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes)]
})
export class FamiliasModule {}
