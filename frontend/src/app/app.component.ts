import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  showTopNav = false;

  constructor(private router: Router) {
    this.showTopNav = !this.router.url.startsWith('/login');
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.showTopNav = !event.urlAfterRedirects.startsWith('/login');
      });
  }
}
