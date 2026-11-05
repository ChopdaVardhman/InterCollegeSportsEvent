import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SportsService } from '../servies/sports-registration.service';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-drs-student-list',
  styleUrl: './drs-student-list.css',
  templateUrl: './drs-student-list.html',
})
export class DrsStudentList implements OnInit {

  registrationList: any[] = [];
  filteredList: any[] = [];
  paginatedList: any[] = []; // Current page par jo rows dikhengi
  isLoading: boolean = false;
  totalRecords: number = 0;

  // Pagination States
  currentPage: number = 1;
  pageSize: number = 10;
  pageSizeOptions: number[] = [10, 25, 50, 100];
  totalPages: number = 1;

  // Filter States
  searchStudentTerm: string = '';
  selectedCollege: string = '';
  selectedSport: string = '';
  selectedCategory: string = '';
  selectedGroup: string = '';

  // Dropdown options arrays
  uniqueColleges: string[] = [];
  uniqueSports: string[] = [];
  uniqueGroups: string[] = [];

  constructor(
    private sportsService: SportsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRegisteredStudents();
  }

  loadRegisteredStudents(): void {
    this.isLoading = true;
    this.sportsService.getRegistrations().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.registrationList = res.data || [];
          this.totalRecords = res.total || this.registrationList.length;
          this.filteredList = this.registrationList;
          
          this.extractDropdownOptions();
          this.updatePagination();
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching registrations:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  extractDropdownOptions(): void {
    const colleges = new Set<string>();
    const sports = new Set<string>();
    const groups = new Set<string>();

    this.registrationList.forEach(item => {
      if (item.College_Full_Name_E) colleges.add(item.College_Full_Name_E.trim());
      if (item.Sport_Name) sports.add(item.Sport_Name.trim());
      if (item.Group_name) groups.add(item.Group_name.trim());
    });

    this.uniqueColleges = Array.from(colleges).sort();
    this.uniqueSports = Array.from(sports).sort();
    this.uniqueGroups = Array.from(groups).sort();
  }

  applyFilters(): void {
    const studentTerm = (this.searchStudentTerm || '').toLowerCase().trim();
    
    this.filteredList = this.registrationList.filter(item => {
      const matchesStudent = !studentTerm || 
        (item.Student_name && item.Student_name.toLowerCase().includes(studentTerm)) ||
        (item.ue_id && item.ue_id.toString().toLowerCase().includes(studentTerm));

      const matchesCollege = !this.selectedCollege || 
        (item.College_Full_Name_E && item.College_Full_Name_E.trim() === this.selectedCollege.trim());

      const matchesSport = !this.selectedSport || 
        (item.Sport_Name && item.Sport_Name.trim() === this.selectedSport.trim());

      const matchesCategory = !this.selectedCategory || 
        (item.Sports_Category && item.Sports_Category.trim().toLowerCase() === this.selectedCategory.trim().toLowerCase());

      const matchesGroup = !this.selectedGroup || 
        (item.Group_name && item.Group_name.trim() === this.selectedGroup.trim());

      return matchesStudent && matchesCollege && matchesSport && matchesCategory && matchesGroup;
    });

    // Filter change hote hi page 1 par jao
    this.currentPage = 1;
    this.updatePagination();
    this.cdr.detectChanges();
  }

  resetFilters(): void {
    this.searchStudentTerm = '';
    this.selectedCollege = '';
    this.selectedSport = '';
    this.selectedCategory = '';
    this.selectedGroup = '';
    this.filteredList = this.registrationList;
    this.currentPage = 1;
    this.updatePagination();
    this.cdr.detectChanges();
  }

  // ==========================================
  // Pagination Core Methods
  // ==========================================
  updatePagination(): void {
    // 1. Total Pages calculate
    this.totalPages = Math.ceil(this.filteredList.length / this.pageSize) || 1;
    
    // 2. Bounds check
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    // 3. Slice range
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + Number(this.pageSize);
    this.paginatedList = [...this.filteredList.slice(startIndex, endIndex)];
    this.cdr.detectChanges();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  onPageSizeChange(): void {
    this.pageSize = Number(this.pageSize);
    this.currentPage = 1;
    this.updatePagination();
  }


  trackByStudent(index: number, item: any): any {
  return item.ue_id || index;
}

  get startIndex(): number {
    return this.filteredList.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    const calculated = this.currentPage * this.pageSize;
    return calculated > this.filteredList.length ? this.filteredList.length : calculated;
  }

  // PDF Export Main Function
  exportPDF(type: string): void {
    let dataToPrint = [...this.filteredList]; // Current active filters ke sath PDF export hogi
    let reportTitle = 'INDIRA GANDHI KRISHI VISHWAVIDYALAYA - Registration Directory';

    const collegeFilter = this.selectedCollege ? this.selectedCollege.trim() : '';
    const sportFilter = this.selectedSport ? this.selectedSport.trim() : '';
    const groupFilter = this.selectedGroup ? this.selectedGroup.trim() : '';

    if (type === 'all') {
      reportTitle = 'IGKV Inter-College Sports - Complete Registration Directory';
    } else if (type === 'college') {
      reportTitle = 'IGKV Inter-College Sports - College Wise Grouped Report';
    } else if (type === 'sport') {
      reportTitle = 'IGKV Inter-College Sports - Sports Wise Grouped Report';
    } else if (type === 'individual') {
      dataToPrint = dataToPrint.filter(item => item.Sports_Category?.trim().toLowerCase() === 'individual');
      reportTitle = 'IGKV Inter-College Sports - Individual Games';
    } else if (type === 'group') {
      dataToPrint = dataToPrint.filter(item => item.Sports_Category?.trim().toLowerCase() === 'group');
      reportTitle = 'IGKV Inter-College Sports - Group Games';
    }

    if (dataToPrint.length === 0) {
      alert('No records available for the selected export option or active filters.');
      return;
    }

    const doc = new jsPDF('l', 'mm', 'a4');

    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('INDIRA GANDHI KRISHI VISHWAVIDYALAYA, RAIPUR (C.G.)', 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(reportTitle, 14, 21);
    doc.text(`Generated On: ${new Date().toLocaleDateString()} | Total Records: ${dataToPrint.length}`, 14, 27);

    const tableColumns = [
      { header: '#', dataKey: 'index' },
      { header: 'Student Name & UE ID', dataKey: 'student' },
      { header: "Father's Name", dataKey: 'father' },
      { header: 'Sport / Discipline', dataKey: 'sport' },
      { header: 'Category', dataKey: 'category' },
      { header: 'Group / Team Name', dataKey: 'group' },
      { header: 'Academic Details', dataKey: 'academic' },
      { header: 'Gender', dataKey: 'gender' },
      { header: 'College Name', dataKey: 'college' }
    ];

    const tableRows = dataToPrint.map((item, index) => ({
      index: index + 1,
      student: `${item.Student_name || ''}\nUE ID: ${item.ue_id || ''}`,
      father: item.Father_Name_E || '',
      sport: item.Sport_Name || '',
      category: item.Sports_Category || '',
      group: item.Group_name || 'Individual Entry',
      academic: `${item.current_course_year_name_e || ''}\n${item.current_semester_name_e || ''}`,
      gender: item.Gender || '',
      college: item.College_Full_Name_E || ''
    }));

    autoTable(doc, {
      columns: tableColumns,
      body: tableRows,
      startY: 33,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, textColor: [51, 65, 85] },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
    }

    doc.save(`Sports_Report_${type}_${Date.now()}.pdf`);
  }
}