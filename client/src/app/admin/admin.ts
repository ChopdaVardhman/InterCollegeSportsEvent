import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {
  isLoginOpen: boolean = false;

  facilities = [
    {
      title: 'Main Administrative Campus',
      url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80'
    },
    {
      title: 'Olympic Synthetic Track',
      url: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=600&auto=format&fit=crop&q=80'
    },
    {
      title: 'Championship Football Turf',
      url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=80'
    },
    {
      title: 'Indoor Multi-Court Arena',
      url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&auto=format&fit=crop&q=80'
    }
  ];

  constructor(private router: Router) {}


  openLoginSlider(): void {
    this.isLoginOpen = true;
  }

  closeLoginSlider(): void {
    this.isLoginOpen = false;
  }

  onLoginSubmit(event: Event): void {
    event.preventDefault();
    this.closeLoginSlider();
    this.router.navigate(['/registration']);
  }
}