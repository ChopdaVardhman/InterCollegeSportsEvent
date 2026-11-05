import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface SportOption {
Sport_ID: number;
Sport_Name: string;
Min_player:number;
}

export interface StudentOption {
 ue_id: string | null;
  Student_name: string;
  DateofBirth: string;
  College_Full_Name_E: string;
  current_semester_name_e: string;
  current_course_year_name_e: string;
  Father_Name_E: string;
   Degree_Programme_Name_E:string;
  Gender_ID:string;
}

export interface SportsRegistrationItem {
  Registration_id: number;
  ue_id: string;
  Student_name: string;
  DateofBirth: string;
  College_Full_Name_E: string;
  current_semester_name_e: string;
  current_course_year_name_e: string;
  Father_Name_E: string;
  Sport_ID: number;
  Sport_Name: string;
  Category_ID: number;
  Sports_Category: string;
  Created_At: string;
  Group_name: string;
  Gender?: string;                 // <-- YEH ADD KAREIN
  gender?: string;
}

// Interface for API Envelope
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class SportsService {
  private gamesUrl = `${environment.apiUrl}/sportslist`;
  // Student search backend route
  private studentsUrl = `${environment.apiUrl}/studentlist`;

  private apiUrl = `${environment.apiUrl}/sports-registration`;

  private apiUrllist = `${environment.apiUrl}/sports-registration`;

  private baseUrl = 'http://localhost:3510/api/sports';

  constructor(private http: HttpClient) {}

  // 1. Games fetch karne ke liye (Step 1)
  getSportsByTypeId(typeId: number): Observable<SportOption[]> {
    return this.http.get<SportOption[]>(`${this.gamesUrl}/${typeId}`);
  }

  saveSportsRegistration(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

getRegistrations(): Observable<any> {
    return this.http.get<any>(this.apiUrllist);
  }

  // 1. Saari registrations fetch karne ka method
  getAllRegistrations(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/all-registrations`);
  }

  // 2. Sport master se min player fetch karne ka method
  getSportMaster(sportId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/master/${sportId}`);
  }

  // 3. Group update karne ka method
  updateGroup(groupName: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/update-group/${groupName}`, data);
  }

  // 4. Player remove karne ka method
  removePlayer(registrationId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/remove-group-player/${registrationId}`);
  }

searchStudents(query: string, collegeId: string | number): Observable<StudentOption[]> {
    const trimmedQuery = (query || '').trim().toLowerCase();
    const url = `${environment.apiUrl}/students/college/${collegeId}`;

    return this.http.get<any>(url).pipe(
      map(res => {
        const list: StudentOption[] = Array.isArray(res) ? res : (res.data || []);
        
        if (!trimmedQuery) {
          return list;
        }

        // Student_name ya ue_id dono me search match karega
        return list.filter(student => 
          (student.Student_name && student.Student_name.toLowerCase().includes(trimmedQuery)) ||
          (student.ue_id && student.ue_id.toString().toLowerCase().includes(trimmedQuery))
        );
      })
    );
  }
}