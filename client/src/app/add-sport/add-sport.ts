import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-add-sport',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-sport.html',
  styleUrl: './add-sport.css'
})
export class AddSportComponent implements OnInit {
  sportForm!: FormGroup;
  isSubmitting: boolean = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.sportForm = this.fb.group({
      Category_ID: ['', Validators.required],
      Sport_Name: ['', [Validators.required, Validators.minLength(2)]],
      // Field completely empty rahegi aur min 1 allow karega
      Min_player: ['', [Validators.required, Validators.min(1)]]
    });
  }

  onSubmit(): void {
    if (this.sportForm.invalid) {
      this.sportForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const payload = {
      Category_ID: Number(this.sportForm.value.Category_ID),
      Sport_Name: this.sportForm.value.Sport_Name.trim(),
      Min_player: Number(this.sportForm.value.Min_player)
    };

    const apiUrl = `${environment.apiUrl}/sportslist/add-sport`;

    this.http.post(apiUrl, payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;

        Swal.fire({
          icon: 'success',
          title: 'Sport Registered!',
          text: `"${payload.Sport_Name}" has been successfully added to the directory.`,
          timer: 2000,
          showConfirmButton: false
        });

        // Form clean reset
        this.sportForm.reset({
          Category_ID: '',
          Sport_Name: '',
          Min_player: ''
        });
      },
      error: (err: any) => {
        this.isSubmitting = false;
        console.error('=== Add Sport Error ===', err);

        const backendMessage = 
          err?.error?.message || 
          err?.error?.error || 
          (typeof err?.error === 'string' ? err.error : 'There was a problem adding the sport. Please check server logs.');

        Swal.fire({
          icon: 'warning',
          title: 'Action Failed',
          text: backendMessage,
          confirmButtonColor: '#2563eb'
        });
      }
    });
  }
}