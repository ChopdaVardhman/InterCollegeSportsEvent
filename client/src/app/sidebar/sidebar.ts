import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2'; // <--- Yeh line add karein

@Component({
  imports: [CommonModule, RouterModule],
  selector: 'app-sidebar',
  styleUrl: './sidebar.css',
  templateUrl: './sidebar.html',
})
export class Sidebar {

  userRole: string = '';

  
  constructor(private router: Router) {}

  ngOnInit(): void {
    // LocalStorage se user_role nikalna (jo 'drs' hai)
    this.userRole = localStorage.getItem('user_role') || '';
  }

  onLogout(): void {
    Swal.fire({
      title: 'Sign Out?',
      text: 'Aapka current session close ho jayega!',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Logout',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        sessionStorage.clear();
        this.router.navigate(['/']); // Login route
      }
    });
  }
}