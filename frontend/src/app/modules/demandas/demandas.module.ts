import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DemandasComponent } from './demandas.component';

const routes: Routes = [
  { path: '', component: DemandasComponent }
];

@NgModule({
  declarations: [DemandasComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule.forChild(routes)]
})
export class DemandasModule {}
