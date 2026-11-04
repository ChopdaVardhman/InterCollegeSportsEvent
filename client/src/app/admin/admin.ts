import { Component, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

import Swal from 'sweetalert2';

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
  imports: [CommonModule, FormsModule], 
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit, OnDestroy {
  // --- Authorized Employees Whitelist (Excel Sheet Data) ---
  readonly allowedEmpIds: string[] = [
    '1015', '1034', '1125', '1137', '1138', '1219', '1300', '1351', '1355', 
    '1418', '1425', '1434', '1506', '1507', '1508', '1509', '1510', '1511', 
    '1512', '1513', '1514', '1518', '1519', '1875', '1884', '1897', '1917', 
    '1935', '1938', '1956', '2062', '2091', '2188', '2204', '2256', '2271', 
    '2275', '2318'
  ];

  // --- Login Slider & Role State ---
  isLoginOpen: boolean = false;
  activeLoginRole: 'dean' | 'drs' = 'dean'; // Track karega ki Dean login hai ya DRS

  empl_ID: string = '';
  password: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  // --- Sports Carousel ViewChild Reference ---
  @ViewChild('sportsCarousel') sportsCarousel!: ElementRef<HTMLDivElement>;

  // --- Facilities Carousel Data ---
  facilities: Facility[] = [
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

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  // --- Login Slidebar Handlers ---
  openLoginSlider(role: 'dean' | 'drs' = 'dean'): void {
    this.activeLoginRole = role;
    this.isLoginOpen = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeLoginSlider(): void {
    this.isLoginOpen = false;
  }

  onLoginSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const inputId = (this.empl_ID || '').trim();

    // ----------------------------------------------------
    // 1. DEAN LOGIN LOGIC (Existing ASMX Web Service)
    // ----------------------------------------------------
    if (this.activeLoginRole === 'dean') {
      if (!this.allowedEmpIds.includes(inputId)) {
        this.errorMessage = 'Dean login Only !';
        alert(this.errorMessage);
        return;
      }

      const url = '/DSSNew/webservices/Admin_MIS_new.asmx/getUserDetails';
      const body = new HttpParams()
        .set('empl_ID', inputId)
        .set('password', this.password);

      const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

      this.http.post(url, body.toString(), { headers, responseType: 'text' })
        .subscribe({
          next: (response: string) => {
            try {
              let parsedData: any = response;

              if (typeof response === 'string' && response.includes('<string')) {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(response, 'text/xml');
                const innerText = xmlDoc.getElementsByTagName('string')[0]?.textContent || '';
                parsedData = JSON.parse(innerText);
              } else if (typeof response === 'string') {
                parsedData = JSON.parse(response);
              }

              const userResult = parsedData?.Result?.[0];

              if (userResult && userResult.Success === '1') {
                const verifiedEmpId = String(userResult._User_Name || inputId).trim();

                if (!this.allowedEmpIds.includes(verifiedEmpId)) {
                  this.errorMessage = 'Dean Login Only !';
                  alert(this.errorMessage);
                  localStorage.clear();
                  return;
                }

                const postList: any[] = parsedData?.PostDetails || [];
                const loginInfo = parsedData?.LoginDetail?.[0] || {};

                const activePost = postList.find((p: any) => p.Post_Name && p.Post_Name.toLowerCase().includes('dean'))
                                    || postList.find((p: any) => p.College_Id)
                                    || postList[0] 
                                    || {};

                this.successMessage = 'Login Successful! Redirecting...';
               Swal.fire({
  icon: 'success',
  title: 'Login Successful!',
  text: 'Redirecting to registration portal...',
  timer: 1500,
  showConfirmButton: false
});

                if (activePost && activePost.College_Id) {
                  localStorage.setItem('college_id', String(activePost.College_Id));
                  localStorage.setItem('college_name', activePost.College_Name_E || '');
                  localStorage.setItem('active_post', JSON.stringify(activePost));

                  const deanData = {
                    Empl_ID: loginInfo.Empl_ID || activePost.Emp_id || inputId,
                    Emp_Name: loginInfo.Emp_Name || activePost.Emp_Name || '',
                    Contact_No_1: loginInfo.Contact_No_1 || activePost.Contact_No_1 || '',
                    Contact_No_2: loginInfo.Contact_No_2 || '',
                    Email_Id: loginInfo.Email_Id || '',
                    Post_Name: activePost.Post_Name || loginInfo.Post_Name || '',
                    Post_Short_Name: activePost.Post_Short_Name || loginInfo.Post_Short_Name || '',
                    Upgraded_Post_Code: loginInfo.Upgraded_Post_Code || activePost.Post_Code || '',
                    Office_Name: activePost.Office_Name || loginInfo.Office_Name || '',
                    Office_Short_Name: activePost.Office_Short_Name || loginInfo.Office_Short_Name || '',
                    Office_Code: String(activePost.Office_Code || loginInfo.Office_Code || ''),
                    College_Id: activePost.College_Id,
                    College_Name_E: activePost.College_Name_E || ''
                  };

                  localStorage.setItem('deanDetails', JSON.stringify(deanData));
                  localStorage.setItem('emp_name', deanData.Emp_Name);
                  localStorage.setItem('office_name', deanData.Office_Name);
                  localStorage.setItem('post_name', deanData.Post_Name);
                }

                localStorage.setItem('userData', JSON.stringify(userResult));
                localStorage.setItem('user_role', 'dean');

                this.closeLoginSlider();
                this.router.navigate(['/registration']);

              } else {
                this.errorMessage = userResult?.Message || 'Login Unsuccessful. Invalid credentials.';
                alert(this.errorMessage);
              }
            } catch (error) {
              console.error('Parsing error:', error);
              this.errorMessage = 'Login Unsuccessful. Unexpected response format.';
              alert(this.errorMessage);
            }
          },
          error: (err) => {
            console.error('API Error:', err);
            this.errorMessage = 'Login Unsuccessful. Server connection failed.';
            alert(this.errorMessage);
          }
        });
    } 
    
    // ----------------------------------------------------
    // 2. DRS LOGIN LOGIC (Node.js Backend API Endpoint)
    // ----------------------------------------------------
    else {
      if (!inputId || !this.password) {
        this.errorMessage = 'Please enter User Name and Password!';
        return;
      }

// <<<<<<< HEAD
      // const drsUrl = 'http://localhost:3510/api/drs/login'; // Apka backend DRS login route
// =======
      const drsUrl = `${environment.apiUrl}/drs/login`;
// >>>>>>> 75e8b88746288330b164d807e74bfce6938ba8d2
      const drsBody = {
        User_Name: inputId,
        Password: this.password
      };

      this.http.post<any>(drsUrl, drsBody).subscribe({
        next: (response) => {
          if (response && response.success) {
            this.successMessage = 'DRS Login Successful! Redirecting...';
            Swal.fire({
  icon: 'success',
  title: 'DRS Login Successful!',
  text: 'Redirecting to portal...',
  timer: 1500,
  showConfirmButton: false
});

            // LocalStorage mein DRS session save karein
            localStorage.setItem('drs_data', JSON.stringify(response.data));
            localStorage.setItem('user_role', 'drs');

            this.closeLoginSlider();
            this.router.navigate(['/drs/registrationList']); // Ya jo bhi route aapko DRS ke baad kholna ho
          } else {
            this.errorMessage = response?.message || 'Invalid DRS Username or Password.';
            alert(this.errorMessage);
          }
        },
        error: (err) => {
          console.error('DRS API Error:', err);
          this.errorMessage = err.error?.message || 'Server connection failed for DRS login.';
          alert(this.errorMessage);
        }
      });
    }
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