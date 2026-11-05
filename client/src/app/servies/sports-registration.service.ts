import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'; // <-- 1. HttpParams add kiya gaya hai
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface SportOption {
  Sport_ID: number;
  Sport_Name: string;
  Min_player: number;
}

export interface StudentOption {
  ue_id: string | null;
  Student_name: string;
  DateofBirth: string;
  College_Full_Name_E: string;
  current_semester_name_e: string;
  current_course_year_name_e: string;
  Father_Name_E: string;
  Degree_Programme_Name_E: string;
  Gender_ID: string;
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
  Gender?: string;
  gender?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class SportsService {
  private gamesUrl = `${environment.apiUrl}/sportslist`;
  private studentsUrl = `${environment.apiUrl}/studentlist`;
  private apiUrl = `${environment.apiUrl}/sports-registration`;
  private apiUrllist = `${environment.apiUrl}/sports-registration`;

  // <-- 2. baseUrl ko update karke groupEventUpdate route par set kiya gaya hai
  private baseUrl = `${environment.apiUrl}/groupEventUpdate`;

  constructor(private http: HttpClient) {}

  getSportsByTypeId(typeId: number): Observable<SportOption[]> {
    return this.http.get<SportOption[]>(`${this.gamesUrl}/${typeId}`);
  }

  saveSportsRegistration(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  getRegistrations(): Observable<any> {
    return this.http.get<any>(this.apiUrllist);
  }

  // <-- 3. College ID ke sath registrations fetch karne ka updated method (HttpParams ke sath)
  getAllRegistrations(collegeId: number | string): Observable<any> {
    const params = new HttpParams().set('collegeId', collegeId.toString());
    return this.http.get<any>(`${this.baseUrl}/all-registrations`, { params });
  }

  // Group update karne ka method
  updateGroup(groupName: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/update-group/${groupName}`, data);
  }

  // Player remove karne ka method
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

        return list.filter(student => 
          (student.Student_name && student.Student_name.toLowerCase().includes(trimmedQuery)) ||
          (student.ue_id && student.ue_id.toString().toLowerCase().includes(trimmedQuery))
        );
      })
    );
  }
}