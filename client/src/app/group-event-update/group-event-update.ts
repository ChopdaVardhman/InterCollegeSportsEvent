import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { SportsService, StudentOption } from '../servies/sports-registration.service';
import { debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  selector: 'app-group-event-update',
  styleUrl: './group-event-update.css',
  templateUrl: './group-event-update.html',
})
export class GroupEventUpdate implements OnInit {
  allRegistrations: any[] = [];
  
  uniqueSports: string[] = [];
  uniqueGroups: string[] = [];
  filteredGroups: string[] = [];
  
  selectedSportName: string = '';
  selectedGroupName: string = '';
  groupMembers: any[] = [];
  minPlayers: number = 1;
  
  collegeId: any = localStorage.getItem('college_id');

  groupData: any = {
    Sport_ID: '',
    Category_ID: '',
    College_Id: '',
    Gender: ''
  };

  // --- Live Search & Autocomplete States ---
  studentSearchControl = new FormControl('');
  studentResults: StudentOption[] = [];
  isLoadingStudents: boolean = false;
  showDropdown: boolean = false;
  selectedStudent: StudentOption | null = null;

  constructor(
    private sportsService: SportsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.collegeId) {
      this.loadAllGroupsData();
    } else {
      Swal.fire('Warning', 'College ID not found in local storage. Please login again.', 'warning');
    }

    // Debounced Student Search Autocomplete Listener with Duplicate Filter
    this.studentSearchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term: string | null) => {
        const query = term ? term.trim() : '';
        if (query.length < 2 || !this.collegeId) {
          this.studentResults = [];
          this.showDropdown = false;
          this.cdr.detectChanges();
          return of([]);
        }

        this.isLoadingStudents = true;
        this.cdr.detectChanges();
        return this.sportsService.searchStudents(query, this.collegeId);
      })
    ).subscribe({
      next: (data: StudentOption[]) => {
        const rawList = data || [];
        
        // --- FIX 1: Jo students pehle se is group me added hain, unhe search results se filter out karna ---
        this.studentResults = rawList.filter(student => 
          !this.groupMembers.some(member => String(member.ue_id) === String(student.ue_id))
        );

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

  loadAllGroupsData() {
    this.sportsService.getAllRegistrations(this.collegeId).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.allRegistrations = res.data;
          this.uniqueSports = [...new Set(this.allRegistrations.map((item: any) => item.Sport_Name))];
          this.uniqueGroups = [...new Set(this.allRegistrations.map((item: any) => item.Group_name))];
          
          if (this.selectedSportName && this.selectedGroupName) {
            this.onGroupSelect(this.selectedGroupName);
          }

          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error fetching registrations:', err);
      }
    });
  }

  onSportSelect(sportName: string) {
    this.selectedSportName = sportName;
    this.selectedGroupName = '';
    this.groupMembers = [];
    this.studentSearchControl.reset('', { emitEvent: false });
    this.selectedStudent = null;
    
    if (!sportName) {
      this.filteredGroups = [];
      return;
    }

    this.filteredGroups = [
      ...new Set(
        this.allRegistrations
          .filter(item => item.Sport_Name === sportName)
          .map(item => item.Group_name)
      )
    ];
  }

  onGroupSelect(groupName: string) {
    this.selectedGroupName = groupName;
    this.studentSearchControl.reset('', { emitEvent: false });
    this.selectedStudent = null;

    if (!groupName) {
      this.groupMembers = [];
      return;
    }

    this.groupMembers = this.allRegistrations.filter(
      item => item.Sport_Name === this.selectedSportName && item.Group_name === groupName
    );

    if (this.groupMembers.length > 0) {
      this.groupData = { ...this.groupMembers[0] };
      this.minPlayers = this.groupMembers[0].Min_player || 1;
    }
  }

  updateGroupDetails() {
    this.sportsService.updateGroup(this.selectedGroupName, this.groupData).subscribe({
      next: (res: any) => {
        Swal.fire('Updated!', 'Group details updated successfully.', 'success');
        this.loadAllGroupsData();
      },
      error: (err) => {
        Swal.fire('Error!', err.error.message || 'Failed to update.', 'error');
      }
    });
  }

  selectStudent(student: StudentOption): void {
    this.selectedStudent = student;
    this.showDropdown = false;
    const completeName = (student.Student_name || '').trim();
    this.studentSearchControl.setValue(completeName, { emitEvent: false });
    this.cdr.detectChanges();
  }

  closeDropdownWithDelay(): void {
    setTimeout(() => {
      this.showDropdown = false;
      this.cdr.detectChanges();
    }, 200);
  }

  addStudentToGroup() {
    if (!this.selectedStudent) {
      Swal.fire('Warning', 'Please search and select a student from the dropdown first.', 'warning');
      return;
    }

    // --- FIX 2: Double security check before sending payload ---
    const isAlreadyMember = this.groupMembers.some(
      m => String(m.ue_id) === String(this.selectedStudent?.ue_id)
    );

    if (isAlreadyMember) {
      Swal.fire('Already Added', 'This student is already a member of this group.', 'warning');
      this.selectedStudent = null;
      this.studentSearchControl.reset('');
      return;
    }

    const payload = {
      ue_id: this.selectedStudent.ue_id ? this.selectedStudent.ue_id.toString().trim() : null,
      student_name: (this.selectedStudent.Student_name || '').trim(),
      father_name: (this.selectedStudent.Father_Name_E || '').trim(),
      College_Full_Name_E: (this.selectedStudent.College_Full_Name_E || '').trim(),
      dob: this.selectedStudent.DateofBirth || null,
      degree_programme: (this.selectedStudent.Degree_Programme_Name_E || '').trim(),
      course_year: (this.selectedStudent.current_course_year_name_e || '').trim(),
      semester: (this.selectedStudent.current_semester_name_e || '').trim(),
      gender: (this.selectedStudent.Gender_ID || '').trim(),
      Sport_ID: Number(this.groupData.Sport_ID),
      Category_ID: Number(this.groupData.Category_ID),
      college_id: Number(this.collegeId),
      Group_name: this.selectedGroupName
    };

    this.sportsService.saveSportsRegistration(payload).subscribe({
      next: (res: any) => {
        if (res.success) {
          Swal.fire('Success!', 'Student added to group successfully.', 'success');
          this.selectedStudent = null;
          this.studentSearchControl.reset('');
          this.loadAllGroupsData();
          this.onGroupSelect(this.selectedGroupName);
        } else {
          Swal.fire('Error!', res.message || 'Failed to add student.', 'error');
        }
      },
      error: (err) => {
        Swal.fire('Error!', err.error?.message || 'Failed to add student.', 'error');
      }
    });
  }

  removePlayer(player: any) {
    if (this.groupMembers.length <= this.minPlayers) {
      Swal.fire(
        'Action Restricted!',
        `Cannot remove player! This sport requires a minimum of ${this.minPlayers} players in a group.`,
        'warning'
      );
      return;
    }

    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to remove ${player.Student_name} from this group?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.sportsService.removePlayer(player.Registration_id).subscribe({
          next: (res: any) => {
            Swal.fire('Removed!', res.message, 'success');
            this.loadAllGroupsData();
            this.onGroupSelect(this.selectedGroupName);
          },
          error: (err) => {
            Swal.fire('Error!', err.error.message || 'Failed to remove player.', 'error');
          }
        });
      }
    });
  }
}