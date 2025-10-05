import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { FamiliasComponent } from './familias.component';
import { NovaFamiliaComponent } from './nova-familia/nova-familia.component';
import { FamiliasMobileComponent } from './mobile/familias-mobile.component';

const routes: Routes = [
  { path: '', component: FamiliasComponent },
  { path: 'mobile', component: FamiliasMobileComponent },
  { path: 'nova', component: NovaFamiliaComponent }
];

@NgModule({
  declarations: [FamiliasComponent, NovaFamiliaComponent, FamiliasMobileComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule.forChild(routes)]
})
export class FamiliasModule {}
