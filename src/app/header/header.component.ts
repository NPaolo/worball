import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  @Input() league: string;

  constructor(
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  goTo(route: string) {
    this.league = route;
    this.router.navigateByUrl(route)
  }

}
