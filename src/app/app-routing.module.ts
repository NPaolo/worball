import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { PremierLeagueComponent } from './premier-league/premier-league.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  // { path: 'premier-league', component: PremierLeagueComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
