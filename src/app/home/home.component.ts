import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import {MatRippleModule} from '@angular/material/core';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  league: string;

  constructor(
    public dialog: MatDialog,
    private _snackBar: MatSnackBar,
    private router: Router
  ) {
    }

  ngOnInit(): void {
  }

  goTo(route: string) {
    this.league = route;
    this.router.navigateByUrl(route)
  }

}
