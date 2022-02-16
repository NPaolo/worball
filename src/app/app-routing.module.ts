import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { NbaComponent } from './nba/nba.component';
import { SerieAComponent } from './serie-a/serie-a.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'serie-a', component: SerieAComponent },
  { path: 'nba', component: NbaComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
