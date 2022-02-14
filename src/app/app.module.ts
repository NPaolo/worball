import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { DialogComponent } from './dialog/dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; 
import { MatButtonModule } from '@angular/material/button';
import { NgxGoogleAnalyticsModule } from 'ngx-google-analytics';
import { HeaderComponent } from './header/header.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    DialogComponent,
    HeaderComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    // Material modules
    MatCardModule,
    MatDialogModule,
    MatButtonModule,
    MatSnackBarModule,
    MatIconModule,
    MatMenuModule,
    BrowserAnimationsModule,
    NgxGoogleAnalyticsModule.forRoot('G-Z7KXKM6680'),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
