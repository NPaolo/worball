import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';

// COMPONENTS
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { SerieAComponent } from './serie-a/serie-a.component';
import { NbaComponent } from './nba/nba.component';
import { HeaderComponent } from './header/header.component';
import { DialogComponent } from './dialog/dialog.component';

// MATERIAL
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; 
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';

// ANALYTICS
import { NgxGoogleAnalyticsModule } from 'ngx-google-analytics';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    DialogComponent,
    HeaderComponent,
    NbaComponent,
    SerieAComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgxGoogleAnalyticsModule.forRoot('G-Z7KXKM6680'),
  // MATERIAL
    MatCardModule,
    MatDialogModule,
    MatButtonModule,
    MatSnackBarModule,
    MatIconModule,
    MatMenuModule,
    MatRippleModule,
    BrowserAnimationsModule,

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
