import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dean-registration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dean-registration.html',
  styleUrl: './dean-registration.css'
})
export class DeanFormComponent {
  
  // Performa Data Model
  formData = {
    collegeName: '',
    deanName: '',
    managerMale: '',
    managerFemale: '',
    athleteNameContact: '',
    fatherName: '',
    dob: '',
    universityId: '',
    aadharNo: '',
    presentClassYear: '',
    courseDuration: '',
    passingYear12th: null as number | null,
    admissionDate: '',
    selectedAthletics: [] as string[],
    selectedTeams: [] as string[],
    isCertified: false
  };

  // Athletic Events (As printed on performa)
  athleticEvents: string[] = [
    '100 mtr.',
    '200 mtr.',
    '400 mtr.',
    '800 mtr.',
    '1500 mtr.',
    'Long Jump',
    'High Jump',
    'Shot Put',
    'Discus Throw',
    'Javelin Throw'
  ];

  // Team Events (As printed on performa)
  teamEvents: string[] = [
    '4x100 mtr. Relay',
    'Volleyball',
    'Kabbadi',
    'Kho-Kho',
    'Badminton',
    'Table Tennis'
  ];

  get selectedAthleticsCount(): number {
    return this.formData.selectedAthletics.length;
  }

  isAthleticSelected(event: string): boolean {
    return this.formData.selectedAthletics.includes(event);
  }

  // Max 3 Athletic Events validation rule
  isAthleticsDisabled(event: string): boolean {
    return this.selectedAthleticsCount >= 3 && !this.isAthleticSelected(event);
  }

  onAthleticToggle(event: string): void {
    const index = this.formData.selectedAthletics.indexOf(event);
    if (index > -1) {
      this.formData.selectedAthletics.splice(index, 1);
    } else {
      if (this.formData.selectedAthletics.length < 3) {
        this.formData.selectedAthletics.push(event);
      }
    }
  }

  isTeamSelected(event: string): boolean {
    return this.formData.selectedTeams.includes(event);
  }

  onTeamToggle(event: string): void {
    const index = this.formData.selectedTeams.indexOf(event);
    if (index > -1) {
      this.formData.selectedTeams.splice(index, 1);
    } else {
      this.formData.selectedTeams.push(event);
    }
  }

  onSubmit(): void {
    if (!this.formData.isCertified) {
      alert('Kripya declaration aur eligibility certificate checkbox ko check karein.');
      return;
    }

    console.log('Registration Performa Data:', this.formData);
    alert(`Registration Performa for "${this.formData.athleteNameContact}" submitted successfully under ${this.formData.collegeName}!`);
  }

  resetForm(): void {
    if (confirm('Kya aap form reset karna chahte hain?')) {
      this.formData = {
        collegeName: '',
        deanName: '',
        managerMale: '',
        managerFemale: '',
        athleteNameContact: '',
        fatherName: '',
        dob: '',
        universityId: '',
        aadharNo: '',
        presentClassYear: '',
        courseDuration: '',
        passingYear12th: null,
        admissionDate: '',
        selectedAthletics: [],
        selectedTeams: [],
        isCertified: false
      };
    }
  }
}