import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';

import { SportsService, SportsRegistrationItem } from '../servies/sports-registration.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-list-of-participent-detailes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule
  ],
  templateUrl: './list-of-participent-detailes.html',
  styleUrl: './list-of-participent-detailes.css',
})
export class ListOfParticipentDetailes implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'Registration_id',
    'Sport_Name',
    'Sports_Category',
    'ue_id',
    'Student_name',
    'Gender',
    'Father_Name_E',
    'Group_name',
    'DateofBirth',
    'course_sem',
    'College_Full_Name_E',
    'actions'
  ];

  dataSource = new MatTableDataSource<SportsRegistrationItem>([]);
  allRegistrationsList: SportsRegistrationItem[] = []; // Master copy filtered dropdowns ke liye

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  isLoading: boolean = false;
  errorMessage: string = '';

  // Filter models
  searchQuery: string = '';
  selectedCategory: string = '';
  selectedSport: string = '';
  selectedGender: string = '';
  selectedGroup: string = '';

  categoryOptions: string[] = [];
  sportOptions: string[] = [];
  genderOptions: string[] = ['Male', 'Female'];
  groupOptions: string[] = [];

  constructor(
    private sportsService: SportsService, 
    private router: Router, 
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.setupCustomFilterPredicate();
    this.fetchRegisteredStudents();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  setupCustomFilterPredicate(): void {
    this.dataSource.filterPredicate = (data: SportsRegistrationItem, filter: string) => {
      const search = JSON.parse(filter);
      const cat = search.category;
      const sport = search.sport;
      const gender = search.gender;
      const group = search.group;

      // 1. Dropdown filters check
      const matchesCat = !cat || data.Sports_Category === cat;
      const matchesSport = !sport || data.Sport_Name === sport;
      const matchesGender = !gender || (data.Gender && data.Gender.toLowerCase() === gender.toLowerCase());
      
      // Group check: exact match ignoring whitespace case
      const itemGroup = (data.Group_name || '').trim().toLowerCase();
      const targetGroup = (group || '').trim().toLowerCase();
      const matchesGroup = !targetGroup || itemGroup === targetGroup;

      if (!matchesCat || !matchesSport || !matchesGender || !matchesGroup) {
        return false;
      }

      // 2. Global Text Search check
      const rawSearch = (search.text || '').trim().toLowerCase();
      if (!rawSearch) {
        return true;
      }

      const searchWords = rawSearch.split(/\s+/).filter(Boolean);

      const normalize = (val: string | null | undefined) => 
        (val ? val.toString().toLowerCase().replace(/\s+/g, ' ') : '');

      const combinedRowText = [
        normalize(data.Student_name),
        normalize(data.ue_id),
        normalize(data.Father_Name_E),
        normalize(data.College_Full_Name_E),
        normalize(data.Group_name),
        normalize(data.Sport_Name)
      ].join(' ');

      return searchWords.every((word: string) => combinedRowText.includes(word));
    };
  }

  fetchRegisteredStudents(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.sportsService.getRegistrations().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        let list: any[] = [];

        if (res && Array.isArray(res.data)) {
          list = res.data;
        } else if (Array.isArray(res)) {
          list = res;
        }

        // 1. LocalStorage values
        const storedCollegeId = (localStorage.getItem('college_id') || '').trim();
        const storedCollegeName = (localStorage.getItem('college_name') || '').trim().toLowerCase();

        const locationKeyword = storedCollegeName.split(',').pop()?.trim() || '';

        const cleanStr = (val: string | null | undefined) =>
          (val ? val.toString().toLowerCase().replace(/[^a-z0-9]/g, '') : '');
        const storedClean = cleanStr(storedCollegeName);

        // 2. Filter students according to logged-in college
        if (storedCollegeId || storedClean) {
          list = list.filter((item: any) => {
            const itemCollegeId = String(item.College_Id || item.college_id || '').trim();
            if (storedCollegeId && itemCollegeId && itemCollegeId === storedCollegeId) {
              return true;
            }

            const itemCollegeName = item.College_Full_Name_E || item.college_name || '';
            const itemClean = cleanStr(itemCollegeName);

            if (locationKeyword && itemCollegeName.toLowerCase().includes(locationKeyword)) {
              return true;
            }

            return (
              itemClean === storedClean ||
              (storedClean && itemClean.includes(storedClean)) ||
              (itemClean && storedClean.includes(itemClean))
            );
          });
        }

        // 3. Gender formatting
        list = list.map((item: any) => {
          const rawGender = (item.Gender ?? item.gender ?? '').toString().trim();
          const upper = rawGender.toUpperCase();

          let formattedGender = '-';
          if (upper === 'M' || upper === 'MALE') {
            formattedGender = 'Male';
          } else if (upper === 'F' || upper === 'FEMALE') {
            formattedGender = 'Female';
          } else if (rawGender && rawGender !== '-') {
            formattedGender = rawGender;
          }

          return {
            ...item,
            Gender: formattedGender,
            gender: formattedGender
          };
        });

        console.log('=== Filtered Records for Current College ===', list.length);
        console.table(list);

        this.allRegistrationsList = list;
        this.dataSource.data = list;

        // Populate unique categories
        this.categoryOptions = [...new Set(list.map(i => i.Sports_Category).filter(Boolean))];
        
        // Sports & Groups dropdown options set karein
        this.updateSportOptions();
        this.updateGroupOptions();

        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = 'Server connect issue !';
        console.error('=== Fetch Registration Error ===', err);
      }
    });
  }

  // Jab Category dropdown change hoga
  onCategoryChange(): void {
    this.selectedSport = '';
    this.selectedGroup = '';
    this.updateSportOptions();
    this.updateGroupOptions();
    this.applyFilters();
  }

  // Category ke according Sports options update karna
  updateSportOptions(): void {
    if (this.selectedCategory) {
      const filtered = this.allRegistrationsList
        .filter(item => item.Sports_Category === this.selectedCategory)
        .map(item => item.Sport_Name)
        .filter(Boolean);
      this.sportOptions = [...new Set(filtered)].sort();
    } else {
      this.sportOptions = [...new Set(this.allRegistrationsList.map(item => item.Sport_Name).filter(Boolean))].sort();
    }
  }

  // Unique Group / Team Names populate karna (khali ya hyphen ignore karke)
  updateGroupOptions(): void {
    let dataset = this.allRegistrationsList;
    if (this.selectedCategory) {
      dataset = dataset.filter(item => item.Sports_Category === this.selectedCategory);
    }
    if (this.selectedSport) {
      dataset = dataset.filter(item => item.Sport_Name === this.selectedSport);
    }

    const groups = dataset
      .map(item => (item.Group_name || '').trim())
      .filter(g => g !== '' && g !== '-' && g !== '—');

    this.groupOptions = [...new Set(groups)].sort();
  }

  onSportChange(): void {
    this.updateGroupOptions();
    this.applyFilters();
  }

  applyFilters(): void {
    const filterState = {
      text: this.searchQuery || '',
      category: this.selectedCategory || '',
      sport: this.selectedSport || '',
      gender: this.selectedGender || '',
      group: this.selectedGroup || ''
    };
    this.dataSource.filter = JSON.stringify(filterState);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.selectedSport = '';
    this.selectedGender = '';
    this.selectedGroup = '';
    this.updateSportOptions();
    this.updateGroupOptions();
    this.applyFilters();
  }

  // Stats cards ke dynamic counts
  get totalCount(): number {
    return this.dataSource?.data?.length || 0;
  }

  get sportsCount(): number {
    const sports = new Set(this.dataSource?.data?.map(d => d.Sport_Name).filter(Boolean));
    return sports.size;
  }

  get individualCount(): number {
    return this.dataSource?.data?.filter(d => (d.Sports_Category || '').toLowerCase() === 'individual').length || 0;
  }

  get groupCount(): number {
    return this.dataSource?.data?.filter(d => (d.Sports_Category || '').toLowerCase() === 'group').length || 0;
  }

  goToRegister(): void {
    this.router.navigate(['/registration']);
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

  deleteRegistration(id: number | string): void {
    const confirmDelete = confirm(`Are you sure you want to delete registration ID: ${id}?`);
    
    if (!confirmDelete) {
      return;
    }

// <<<<<<< HEAD
    // const apiUrl = `http://localhost:3510/api/delete-registration/${id}`;
// =======
    const apiUrl = `${environment.apiUrl}/delete-registration/${id}`;
// >>>>>>> 75e8b88746288330b164d807e74bfce6938ba8d2

    this.http.delete(apiUrl).subscribe({
      next: () => {
        Swal.fire({
  icon: 'success',
  title: 'Deleted!',
  text: 'Record successfully deleted!',
  timer: 1500,
  showConfirmButton: false
});
        this.fetchRegisteredStudents();
      },
      error: (err) => {
        console.error('Delete error:', err);
       Swal.fire({
  icon: 'error',
  title: 'Deletion Failed',
  text: 'Failed to delete record. Please check server logs.',
  confirmButtonColor: '#d33'
});
      }
    });
  }

 exportToPDF(): void {
  const doc = new jsPDF('landscape', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const collegeName = localStorage.getItem('college_name') || 'DKS COLLEGE OF AGRICULTURE & RESEARCH STATION, BHATAPARA (DKS CARS)';
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).toUpperCase();

  // MatTableDataSource se filtered data uthana
  const list = this.dataSource.filteredData.length ? this.dataSource.filteredData : this.dataSource.data;

  // Gender Identifiers
  const isMale = (g: string | null | undefined) => 
    (g || '').trim().toLowerCase() === 'male' || (g || '').trim().toUpperCase() === 'M';
  const isFemale = (g: string | null | undefined) => 
    (g || '').trim().toLowerCase() === 'female' || (g || '').trim().toUpperCase() === 'F';

  // 1. Data Segregation
  const individualMaleRaw = list.filter(i => (i.Sports_Category || '').toLowerCase() === 'individual' && isMale(i.Gender));
  const individualFemaleRaw = list.filter(i => (i.Sports_Category || '').toLowerCase() === 'individual' && isFemale(i.Gender));
  const groupMaleRaw = list.filter(i => (i.Sports_Category || '').toLowerCase() === 'group' && isMale(i.Gender));
  const groupFemaleRaw = list.filter(i => (i.Sports_Category || '').toLowerCase() === 'group' && isFemale(i.Gender));

  // 2. Aggregator Function for Individual Sports
  const aggregateIndividualSports = (rawList: any[]) => {
    const map: { [key: string]: { sportName: string; category: string; college: string; students: any[] } } = {};
    rawList.forEach(item => {
      const sport = (item.Sport_Name || 'Unspecified').trim();
      if (!map[sport]) {
        map[sport] = {
          sportName: sport,
          category: 'Individual',
          college: item.College_Full_Name_E,
          students: []
        };
      }
      map[sport].students.push(item);
    });
    return Object.values(map);
  };

  // 3. Aggregator Function for Group Sports
  const aggregateGroupTeams = (rawList: any[]) => {
    const map: { [key: string]: { sportName: string; groupName: string; college: string; students: any[] } } = {};
    rawList.forEach(item => {
      const sport = (item.Sport_Name || 'Unspecified').trim();
      const group = (item.Group_name || 'Team Roster').trim();
      const key = `${sport}___${group}`;
      if (!map[key]) {
        map[key] = {
          sportName: sport,
          groupName: group,
          college: item.College_Full_Name_E,
          students: []
        };
      }
      map[key].students.push(item);
    });
    return Object.values(map);
  };

  const indMaleAggregated = aggregateIndividualSports(individualMaleRaw);
  const indFemaleAggregated = aggregateIndividualSports(individualFemaleRaw);
  const grpMaleAggregated = aggregateGroupTeams(groupMaleRaw);
  const grpFemaleAggregated = aggregateGroupTeams(groupFemaleRaw);

  // Main PDF Generation Logic Function (Called after logo loading check)
  const generatePDFContent = (logoDataUri?: string) => {
    // --- Header Banner ---
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 62, 'F');

    // Add Logo on Left Side if loaded successfully
    if (logoDataUri) {
      doc.addImage(logoDataUri, 'PNG', 35, 11, 40, 40);
    }

    // 1. University Full Name (Top)
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(226, 232, 240);
    doc.text('INDIRA GANDHI KRISHI VISHWAVIDYALAYA, RAIPUR (C.G.)', pageWidth / 2, 17, { align: 'center' });

    // 2. Directory Title (Middle)
    doc.setFontSize(13.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('INTER-COLLEGE SPORTS REGISTRATION DIRECTORY', pageWidth / 2, 35, { align: 'center' });

    // 3. College Name (Bottom)
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(collegeName.toUpperCase(), pageWidth / 2, 51, { align: 'center' });

    // Sub-header Line
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('ACADEMIC SESSION: 2026 – 2027', 35, 74);
    doc.text(`REPORT GENERATED ON: ${currentDate}`, pageWidth - 35, 74, { align: 'right' });

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.75);
    doc.line(35, 80, pageWidth - 35, 80);

    let currentY = 96;

    // Helper method: Draw aggregated table
    const renderAggregatedSection = (
      title: string,
      data: any[],
      isGroup: boolean,
      headerColor: [number, number, number]
    ) => {
      if (currentY > pageHeight - 110) {
        doc.addPage();
        currentY = 45;
      }

      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
      doc.text(title, 35, currentY);

      const rows = data.map((item, idx) => {
        const candidatesList = item.students.map((s: any, sIdx: number) => 
          `${sIdx + 1}. ${s.Student_name || '-'} (${s.ue_id || 'N/A'})`
        ).join('\n');

        const countLabel = isGroup 
          ? `${item.students.length} ${item.students.length === 1 ? 'Player' : 'Players'}`
          : `${item.students.length} ${item.students.length === 1 ? 'Candidate' : 'Candidates'}`;

        const categoryOrTeam = isGroup 
          ? (item.groupName !== 'Team Roster' ? `Team: ${item.groupName}` : 'Group')
          : 'Individual';

        return [
          idx + 1,
          item.sportName,
          categoryOrTeam,
          countLabel,
          candidatesList,
          item.college
        ];
      });

      autoTable(doc, {
        startY: currentY + 6,
        head: [['S.No.', 'Sport Name', isGroup ? 'Category / Team' : 'Category', 'Total Candidates', 'Enrolled Candidates & UE ID', 'College Name']],
        body: rows.length ? rows : [['-', '-', '-', '-', 'No Records Registered', '-']],
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 5,
          valign: 'middle',
          overflow: 'linebreak'
        },
        headStyles: {
          fillColor: headerColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 35, halign: 'center' },
          1: { cellWidth: 100, fontStyle: 'bold' },
          2: { cellWidth: 110, halign: 'center' },
          3: { cellWidth: 95, halign: 'center', fontStyle: 'bold' },
          4: { cellWidth: 260 },
          5: { cellWidth: 'auto' }
        },
        margin: { left: 35, right: 35 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 24;
    };

    // Section 1: Individual Boys (Blue)
    renderAggregatedSection('1. INDIVIDUAL SPORTS DISCIPLINE - MALE (BOYS)', indMaleAggregated, false, [10, 61, 145]);

    // Section 2: Individual Girls (Pink/Maroon)
    renderAggregatedSection('2. INDIVIDUAL SPORTS DISCIPLINE - FEMALE (GIRLS)', indFemaleAggregated, false, [139, 21, 56]);

    // Section 3: Group Boys (Dark Green)
    renderAggregatedSection('3. GROUP & TEAM SQUAD DISCIPLINE - MALE (BOYS TEAMS)', grpMaleAggregated, true, [10, 84, 40]);

    // Section 4: Group Girls (Royal Purple)
    renderAggregatedSection('4. GROUP & TEAM SQUAD DISCIPLINE - FEMALE (GIRLS TEAMS)', grpFemaleAggregated, true, [74, 21, 110]);

    // Signatures & Pagination on Last Page
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);

      if (p === totalPages) {
        const sigY = pageHeight - 40;
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);

        doc.text('_____________________________', 35, sigY - 8);
        doc.text('Prepared By: Administrative Assistant', 35, sigY + 5);

        doc.text('_____________________________', pageWidth - 170, sigY - 8);
        doc.text('Approved By: Dean / Sports In-Charge', pageWidth - 170, sigY + 5);
      }

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${p} of ${totalPages} | DKS CARS Sports Roster Portal`,
        pageWidth / 2,
        pageHeight - 12,
        { align: 'center' }
      );
    }

    doc.save(`Sports_Registration_Directory_${Date.now()}.pdf`);
  };

  // Load Logo Image and trigger PDF generation
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.src = 'IGKVlogo.webp'; // Ensure this path matches your assets folder structure

  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, 0, 0);
    const dataUri = canvas.toDataURL('image/png');
    generatePDFContent(dataUri);
  };

  img.onerror = () => {
    // Fallback if logo fails to load: generate PDF without logo
    generatePDFContent();
  };
}
}