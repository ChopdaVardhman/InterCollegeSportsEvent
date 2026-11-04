import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { SportsService, SportOption, StudentOption } from '../servies/sports-registration.service';
import { debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { Router } from '@angular/router';

import Swal from 'sweetalert2';

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-sports-registration',
  styleUrl: './sports-registration.css',
  templateUrl: './sports-registration.html',
})
export class SportsRegistration implements OnInit {
  sportsForm!: FormGroup;
  sportsList: SportOption[] = [];
  isLoadingSports: boolean = false;
  selectedGameId: number | null = null;
  empName: string = '';
  postName: string = '';
  collegeName: string = '';

  // Search States
  studentSearchControl = new FormControl('');
  studentResults: StudentOption[] = [];
  isLoadingStudents: boolean = false;
  showDropdown: boolean = false;
  selectedStudent: StudentOption | null = null;

  // Multiple Group Members list
  selectedMembers: StudentOption[] = [];

  constructor(
    private fb: FormBuilder,
    private sportsService: SportsService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1. Reactive Form initialize
    this.sportsForm = this.fb.group({
      eventTypeId: [1, Validators.required],
      sportId: ['', Validators.required],
      group_name: [''],

      // Student Details (Individual view display)
      ue_id: [{ value: '', disabled: true }],
      Student_name: [{ value: '', disabled: true }],
      Father_Name_E: [{ value: '', disabled: true }],
      DateofBirth: [{ value: '', disabled: true }],
      College_Full_Name_E: [{ value: '', disabled: true }],
      current_course_year_name_e: [{ value: '', disabled: true }],
      current_semester_name_e: [{ value: '', disabled: true }],
      Degree_Programme_Name_E: [{ value: '', disabled: true }],
      Gender_ID: [{ value: '', disabled: true }]
    });

    // 2. Load Dean & College details from localStorage
    const savedDean = localStorage.getItem('deanDetails');
    if (savedDean) {
      try {
        const dean = JSON.parse(savedDean);
        this.empName = dean.Emp_Name || localStorage.getItem('emp_name') || '';
        this.postName = dean.Post_Name || localStorage.getItem('post_name') || '';
        this.collegeName = dean.College_Name_E || localStorage.getItem('college_name') || '';
      } catch (err) {
        console.error('Error parsing dean details from localStorage', err);
      }
    } else {
      this.empName = localStorage.getItem('emp_name') || '';
      this.postName = localStorage.getItem('post_name') || '';
      this.collegeName = localStorage.getItem('college_name') || '';
    }

    // 3. Initial load: 1 (Individual)
    this.fetchSports(1);

    // 4. Initially keep search input strictly disabled
    this.studentSearchControl.disable({ emitEvent: false });

    // 5. Function to evaluate whether search box should be enabled or disabled
    const evaluateSearchState = () => {
      const sportId = this.sportsForm.get('sportId')?.value;
      const eventTypeId = Number(this.sportsForm.get('eventTypeId')?.value);
      const groupName = (this.sportsForm.get('group_name')?.value || '').trim();

      // Rule 1: Disable if sport is not chosen
      if (!sportId) {
        if (this.studentSearchControl.enabled) {
          this.studentSearchControl.disable({ emitEvent: false });
          this.clearSelectedStudent();
        }
        this.cdr.detectChanges();
        return;
      }

      // Rule 2: Disable if Group Event and group name is missing
      if (eventTypeId === 2 && !groupName) {
        if (this.studentSearchControl.enabled) {
          this.studentSearchControl.disable({ emitEvent: false });
          this.clearSelectedStudent();
        }
        this.cdr.detectChanges();
        return;
      }

      // Enable if conditions pass
      if (this.studentSearchControl.disabled) {
        this.studentSearchControl.enable({ emitEvent: false });
        this.cdr.detectChanges();
      }
    };

    // 6. Category switch listener (Individual / Group)
    this.sportsForm.get('eventTypeId')?.valueChanges.subscribe((typeId: number) => {
      this.sportsForm.get('sportId')?.reset('');
      this.selectedGameId = null;
      this.selectedMembers = [];
      this.clearSelectedStudent();

      const groupControl = this.sportsForm.get('group_name');
      if (Number(typeId) === 2) {
        groupControl?.setValidators([Validators.required]);
      } else {
        groupControl?.clearValidators();
        groupControl?.setValue('');
      }
      groupControl?.updateValueAndValidity();

      if (typeId) {
        this.fetchSports(Number(typeId));
      }

      evaluateSearchState();
    });

    // 7. Sport change listener
    this.sportsForm.get('sportId')?.valueChanges.subscribe((gameId) => {
      this.selectedGameId = gameId ? Number(gameId) : null;
      evaluateSearchState();
    });

    // 8. Group Name input listener
    this.sportsForm.get('group_name')?.valueChanges.subscribe(() => {
      evaluateSearchState();
    });

    // 9. Debounced Student Search Autocomplete Listener
    this.studentSearchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term: string | null) => {
        if (this.isSearchDisabled()) {
          this.studentResults = [];
          this.showDropdown = false;
          this.cdr.detectChanges();
          return of([]);
        }

        const query = term ? term.trim() : '';
        if (query.length < 2) {
          this.studentResults = [];
          this.showDropdown = false;
          this.cdr.detectChanges();
          return of([]);
        }

        const collegeId = localStorage.getItem('college_id');
        if (!collegeId) {
          this.studentResults = [];
          this.showDropdown = false;
          this.cdr.detectChanges();
          return of([]);
        }

        this.isLoadingStudents = true;
        this.cdr.detectChanges();
        return this.sportsService.searchStudents(query, collegeId);
      })
    ).subscribe({
      next: (data: StudentOption[]) => {
        this.studentResults = data || [];
        this.isLoadingStudents = false;
        this.showDropdown = this.studentResults.length > 0;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Student search error:', err);
        this.isLoadingStudents = false;
        this.studentResults = [];
        this.showDropdown = false;
        this.cdr.detectChanges();
      }
    });
  }

  fetchSports(typeId: number): void {
    this.isLoadingSports = true;
    this.sportsService.getSportsByTypeId(typeId).subscribe({
      next: (res: any) => {
        this.sportsList = res.data || [];
        this.isLoadingSports = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('API Error:', err);
        this.isLoadingSports = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSportChange(event: Event): void {
    const gameId = (event.target as HTMLSelectElement).value;
    this.selectedGameId = Number(gameId);
  }

  getSelectedSportName(): string {
    const currentSportId = this.sportsForm.get('sportId')?.value;
    if (!currentSportId) return 'Not Chosen';
    const found = this.sportsList.find(s => String(s.Sport_ID) === String(currentSportId));
    return found ? found.Sport_Name : 'Not Chosen';
  }

  isSearchDisabled(): boolean {
    const sportId = this.sportsForm.get('sportId')?.value;
    const eventTypeId = Number(this.sportsForm.get('eventTypeId')?.value);
    const groupName = (this.sportsForm.get('group_name')?.value || '').trim();

    if (!sportId) {
      return true;
    }

    if (eventTypeId === 2 && !groupName) {
      return true;
    }

    return false;
  }

  selectStudent(student: StudentOption): void {
    this.selectedStudent = student;
    this.showDropdown = false;

    const completeName = (student.Student_name || '').trim();
    this.studentSearchControl.setValue(completeName, { emitEvent: false });

    if (Number(this.sportsForm.get('eventTypeId')?.value) === 1) {
      const rawGender = (student.Gender_ID || '').trim().toUpperCase();
      let genderLabel = rawGender;
      if (rawGender === 'M') {
        genderLabel = 'Male';
      } else if (rawGender === 'F') {
        genderLabel = 'Female';
      }

      this.sportsForm.patchValue({
        ue_id: student.ue_id || '',
        Student_name: completeName,
        Father_Name_E: (student.Father_Name_E || '').trim(),
        DateofBirth: student.DateofBirth || '',
        College_Full_Name_E: student.College_Full_Name_E || '',
        current_course_year_name_e: student.current_course_year_name_e || '',
        current_semester_name_e: student.current_semester_name_e || '',
        Degree_Programme_Name_E: (student.Degree_Programme_Name_E || '').trim(),
        Gender_ID: genderLabel
      });
    }

    this.cdr.detectChanges();
  }

  addMemberToGroup(): void {
    if (!this.selectedStudent) {
      Swal.fire({
        icon: 'warning',
        title: 'Action Required',
        text: 'Please search and select a candidate first.',
        confirmButtonColor: '#f39c12'
      });
      return;
    }

    // Duplicate check in roster
    const isAlreadyAdded = this.selectedMembers.some(
      m => m.ue_id?.toString() === this.selectedStudent?.ue_id?.toString()
    );

    if (isAlreadyAdded) {
      Swal.fire({
        icon: 'warning',
        title: 'Duplicate Entry',
        text: 'This student has already been added to the team roster.',
        confirmButtonColor: '#f39c12'
      });
      return;
    }

    this.selectedMembers.push({ ...this.selectedStudent });
    this.clearSelectedStudent();
    this.cdr.detectChanges();
  }

  removeMember(index: number): void {
    this.selectedMembers.splice(index, 1);
    this.cdr.detectChanges();
  }

  clearSelectedStudent(): void {
    this.selectedStudent = null;
    this.studentSearchControl.reset('');
    this.sportsForm.patchValue({
      ue_id: '',
      Student_name: '',
      Father_Name_E: '',
      DateofBirth: '',
      College_Full_Name_E: '',
      current_course_year_name_e: '',
      current_semester_name_e: '',
      Degree_Programme_Name_E: '',
      Gender_ID: ''
    });
  }

  closeDropdownWithDelay(): void {
    setTimeout(() => {
      this.showDropdown = false;
      this.cdr.detectChanges();
    }, 200);
  }

  onSave(): void {
    const rawData = this.sportsForm.getRawValue();
    const isGroup = Number(rawData.eventTypeId) === 2;

    if (!rawData.sportId) {
      Swal.fire({
        icon: 'warning',
        title: 'Discipline Missing',
        text: 'Please select a tournament sport / discipline before proceeding.',
        confirmButtonColor: '#f39c12'
      });
      return;
    }

    const collegeId = localStorage.getItem('college_id') ? Number(localStorage.getItem('college_id')) : null;

    // --- Min Players Validation Check ---
    const sport = this.getSelectedSport();
    if (isGroup && sport && sport.Min_player) {
      if (this.selectedMembers.length < sport.Min_player) {
        Swal.fire({
          icon: 'warning',
          title: 'Minimum Players Required',
          text: `Minimum ${sport.Min_player} players are required for ${sport.Sport_Name}. You have added only ${this.selectedMembers.length}.`,
          confirmButtonColor: '#f39c12'
        });
        return;
      }
    }

    // CASE 1: GROUP EVENT SAVE
    if (isGroup) {
      if (!rawData.group_name || !rawData.group_name.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'Team Name Required',
          text: 'Please enter a valid official Group / Team name.',
          confirmButtonColor: '#f39c12'
        });
        return;
      }

      if (this.selectedMembers.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Empty Team Roster',
          text: 'At least one participant must be added to the team roster.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#f39c12'
        });
        return;
      }

      const payload = {
        Category_ID: Number(rawData.eventTypeId),
        Sport_ID: Number(rawData.sportId),
        Group_name: rawData.group_name.trim(),
        students: this.selectedMembers.map(s => ({
          ue_id: s.ue_id ? s.ue_id.toString().trim() : null,
          student_name: (s.Student_name || '').trim(),
          father_name: (s.Father_Name_E || '').trim(),
          College_Full_Name_E: (s.College_Full_Name_E || '').trim(),
          dob: s.DateofBirth || null,
          degree_programme: (s.Degree_Programme_Name_E || '').trim(),
          course_year: (s.current_course_year_name_e || '').trim(),
          semester: (s.current_semester_name_e || '').trim(),
          gender: (s.Gender_ID || '').trim(),
          college_id: collegeId
        }))
      };

      this.sportsService.saveSportsRegistration(payload).subscribe({
        next: (res: any) => {
          if (res.success) {
            Swal.fire({
              icon: 'success',
              title: 'Team Registered!',
              text: `Team "${rawData.group_name}" and its enrolled participants have been registered successfully.`,
              confirmButtonText: 'OK',
              confirmButtonColor: '#16a34a',
              timer: 3000,
              timerProgressBar: true
            });
            this.onReset();
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Registration Failed',
              text: res.message || 'Unable to register team participants. Please review the details.',
              confirmButtonText: 'OK',
              confirmButtonColor: '#dc2626'
            });
          }
        },
        error: (err: any) => {
          console.error('Save error:', err);
          Swal.fire({
            icon: 'error',
            title: 'Server Error',
            text: err.error?.message || 'Unable to communicate with the server. Please try again.',
            confirmButtonText: 'Close',
            confirmButtonColor: '#dc2626'
          });
        }
      });

    // CASE 2: INDIVIDUAL EVENT SAVE
    } else {
      if (!this.selectedStudent) {
        Swal.fire({
          icon: 'warning',
          title: 'Candidate Not Selected',
          text: 'Please search and select a verified student profile.',
          confirmButtonColor: '#f39c12'
        });
        return;
      }

      const payload = {
        Category_ID: Number(rawData.eventTypeId),
        Sport_ID: Number(rawData.sportId),
        Group_name: null,
        ue_id: rawData.ue_id || null,
        student_name: (rawData.Student_name || '').trim(),
        father_name: (rawData.Father_Name_E || '').trim(),
        College_Full_Name_E: (rawData.College_Full_Name_E || '').trim(),
        dob: rawData.DateofBirth || null,
        degree_programme: (rawData.Degree_Programme_Name_E || '').trim(),
        gender: (rawData.Gender_ID || '').trim(),
        course_year: (rawData.current_course_year_name_e || '').trim(),
        semester: (rawData.current_semester_name_e || '').trim(),
        college_id: collegeId
      };

      this.sportsService.saveSportsRegistration(payload).subscribe({
        next: (res: any) => {
          if (res.success) {
            Swal.fire({
              icon: 'success',
              title: 'Registration Successful!',
              text: `${payload.student_name} has been enrolled successfully.`,
              confirmButtonText: 'OK',
              confirmButtonColor: '#16a34a',
              timer: 3000,
              timerProgressBar: true
            });
            this.onReset();
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Registration Failed',
              text: res.message || 'Unable to register the participant.',
              confirmButtonText: 'OK',
              confirmButtonColor: '#dc2626'
            });
          }
        },
        error: (err: any) => {
          console.error('Save error:', err);
          Swal.fire({
            icon: 'error',
            title: 'Server Error',
            text: err.error?.message || 'Unable to connect to the server. Please check your network.',
            confirmButtonText: 'Close',
            confirmButtonColor: '#dc2626'
          });
        }
      });
    }
  }

  // 1. Selected sport object find karne ke liye
  getSelectedSport(): SportOption | null {
    const currentSportId = this.sportsForm.get('sportId')?.value;
    if (!currentSportId) return null;
    return this.sportsList.find(s => String(s.Sport_ID) === String(currentSportId)) || null;
  }

  // 2. Getter jo check karega ki minimum players poore hue hain ya nahi
get isPlayerCountValid(): boolean {
    const eventTypeId = Number(this.sportsForm.get('eventTypeId')?.value);
    const sportId = this.sportsForm.get('sportId')?.value;
    const groupName = (this.sportsForm.get('group_name')?.value || '').trim();

    // 1. Agar Sport hi select nahi hai toh hamesha false rahega
    if (!sportId) return false;

    // 2. Agar Individual Event hai (Category_ID = 1)
    if (eventTypeId === 1) {
      return this.selectedStudent !== null;
    }

    // 3. Agar Group Event hai (Category_ID = 2)
    if (eventTypeId === 2) {
      // Agar group/team name khali hai toh false rahega
      if (!groupName) return false;

      const sport = this.getSelectedSport();
      if (!sport || !sport.Min_player) return false;
      
      // Group members ki sankhya database ke Min_player se match honi chahiye
      return this.selectedMembers.length >= sport.Min_player;
    }

    return false;
  }

  logout(): void {
    localStorage.removeItem('userData');
    localStorage.removeItem('college_id');
    localStorage.removeItem('college_name');
    localStorage.removeItem('active_post');
    localStorage.removeItem('deanDetails');
    localStorage.removeItem('emp_name');
    localStorage.removeItem('post_name');
    localStorage.removeItem('office_name');

    this.router.navigate(['/']);
  }

  onSearchClick(): void {
  const sportId = this.sportsForm.get('sportId')?.value;
  const eventTypeId = Number(this.sportsForm.get('eventTypeId')?.value);
  const groupName = (this.sportsForm.get('group_name')?.value || '').trim();

  // 1. Agar Sport select nahi hai
  if (!sportId) {
    Swal.fire({
      icon: 'warning',
      title: 'Select Sport First',
      text: 'Please select a tournament sport / discipline before searching for students.',
      confirmButtonColor: '#f39c12'
    });
    return;
  }

  // 2. Agar Group Event hai aur Team Name khali hai
  if (eventTypeId === 2 && !groupName) {
    Swal.fire({
      icon: 'warning',
      title: 'Team Name Required',
      text: 'Please enter Group / Team Name first before enrolling students.',
      confirmButtonColor: '#f39c12'
    }).then(() => {
      // Focus seedhe team name wale input box par bhej dega
      const teamInput = document.querySelector('input[formControlName="group_name"]') as HTMLInputElement;
      if (teamInput) {
        teamInput.focus();
      }
    });
    return;
  }
}

  onReset(): void {
    this.sportsForm.reset({
      eventTypeId: 1,
      sportId: '',
      group_name: '',
      ue_id: '',
      Student_name: '',
      Father_Name_E: '',
      DateofBirth: '',
      College_Full_Name_E: '',
      current_course_year_name_e: '',
      current_semester_name_e: '',
      Degree_Programme_Name_E: '',
      Gender_ID: ''
    });

    this.studentSearchControl.reset('');
    this.studentSearchControl.disable({ emitEvent: false });
    this.selectedStudent = null;
    this.selectedMembers = [];
    this.selectedGameId = null;
    this.studentResults = [];
    this.fetchSports(1);
    this.cdr.detectChanges();
  }

  goToList(): void {
    this.router.navigate(['/registrationList']);
  }
}