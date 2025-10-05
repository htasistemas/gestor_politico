import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './modules/shared/auth.guard';
import { AdminGuard } from './modules/shared/admin.guard';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadChildren: () => import('./modules/login/login.module').then(m => m.LoginModule) },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () => import('./modules/dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'familias',
    canActivate: [AuthGuard],
    loadChildren: () => import('./modules/familias/familias.module').then(m => m.FamiliasModule)
  },
  {
    path: 'demandas',
    canActivate: [AuthGuard],
    loadChildren: () => import('./modules/demandas/demandas.module').then(m => m.DemandasModule)
  },
  {
    path: 'configuracoes',
    canActivate: [AdminGuard],
    loadChildren: () => import('./modules/configuracoes/configuracoes.module').then(m => m.ConfiguracoesModule)
  },
  {
    path: 'georreferenciamento',
    canActivate: [AdminGuard],
    loadChildren: () =>
      import('./modules/georreferenciamento/georreferenciamento.module').then(m => m.GeoReferenciamentoModule)
  },
  {
    path: 'perfil',
    canActivate: [AuthGuard],
    loadChildren: () => import('./modules/perfil/perfil.module').then(m => m.PerfilModule)
  },
  {
    path: 'usuarios',
    canActivate: [AdminGuard],
    loadChildren: () => import('./modules/usuarios/usuarios.module').then(m => m.UsuariosModule)
  },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
