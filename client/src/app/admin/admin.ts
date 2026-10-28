import { Component, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Facility {
  title: string;
  url: string;
  description?: string;
}

interface Sport {
  name: string;
  category: string;
  teams: number;
  icon: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit, OnDestroy {
  // --- Login Slider State (Original Unchanged) ---
  isLoginOpen: boolean = false;

  // --- Sports Carousel ViewChild Reference ---
  @ViewChild('sportsCarousel') sportsCarousel!: ElementRef<HTMLDivElement>;

  // --- Facilities Carousel Data ---
facilities = [
    {
      title: 'Olympic 8-Lane Synthetic Track',
      url: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=1200&auto=format&fit=crop&q=80',
      description: 'IAAF-certified all-weather synthetic track for sprint and relay championships.'
    },
    {
      title: 'Main Championship Football Arena',
      url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80',
      description: 'Natural turf tournament pitch equipped with professional lux night-lighting.'
    },
    {
      title: 'Indoor Maple Wood Badminton Court',
      url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&auto=format&fit=crop&q=80',
      description: 'Climate-controlled multi-court arena hosting singles and doubles fixtures.'
    },
    {
      title: 'Olympic Swimming & Aquatics Complex',
      url: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&auto=format&fit=crop&q=80',
      description: '50m ten-lane competition swimming pool with automated digital touchpad timing.'
    }
  ];

  // --- Sports Disciplines Data ---
  sportsList: Sport[] = [
    { name: 'Track & Field', category: 'Athletics', teams: 32, icon: '🏃‍♂️' },
    { name: 'Badminton', category: 'Indoor Court', teams: 28, icon: '🏸' },
    { name: 'Football (Soccer)', category: 'Outdoor Turf', teams: 16, icon: '⚽' },
    { name: 'Basketball', category: 'Hardcourt', teams: 24, icon: '🏀' },
    { name: 'Volleyball', category: 'Sand & Court', teams: 20, icon: '🏐' },
    { name: 'Table Tennis', category: 'Indoor Complex', teams: 30, icon: '🏓' },
    { name: 'Cricket', category: 'Championship Oval', teams: 18, icon: '🏏' }
  ];

  // --- Facility Slider Internal State ---
  currentFacilityIndex: number = 0;
  private autoSlideTimer?: ReturnType<typeof setInterval>;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  // --- Login Slidebar Handlers (Original Kept Pure) ---
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

  // --- Facilities Slider Handlers ---
  nextFacility(): void {
    this.currentFacilityIndex = (this.currentFacilityIndex + 1) % this.facilities.length;
  }

  prevFacility(): void {
    this.currentFacilityIndex =
      (this.currentFacilityIndex - 1 + this.facilities.length) % this.facilities.length;
  }

  goToFacility(index: number): void {
    this.currentFacilityIndex = index;
    this.resetAutoSlide();
  }

  private startAutoSlide(): void {
    this.autoSlideTimer = setInterval(() => {
      this.nextFacility();
    }, 3000);
  }

  private stopAutoSlide(): void {
    if (this.autoSlideTimer) {
      clearInterval(this.autoSlideTimer);
    }
  }

  private resetAutoSlide(): void {
    this.stopAutoSlide();
    this.startAutoSlide();
  }

  // --- Sports Carousel Smooth Horizontal Scroll ---
  scrollSports(direction: 'left' | 'right'): void {
    if (this.sportsCarousel?.nativeElement) {
      const scrollAmount = 300;
      this.sportsCarousel.nativeElement.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  }
}