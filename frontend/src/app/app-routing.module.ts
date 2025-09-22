import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadChildren: () => import('./modules/login/login.module').then(m => m.LoginModule) },
  { path: 'dashboard', loadChildren: () => import('./modules/dashboard/dashboard.module').then(m => m.DashboardModule) },
  { path: 'familias', loadChildren: () => import('./modules/familias/familias.module').then(m => m.FamiliasModule) },
  { path: 'pessoas', loadChildren: () => import('./modules/pessoas/pessoas.module').then(m => m.PessoasModule) },
  { path: 'configuracoes', loadChildren: () => import('./modules/configuracoes/configuracoes.module').then(m => m.ConfiguracoesModule) },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
