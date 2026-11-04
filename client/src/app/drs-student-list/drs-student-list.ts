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
  isLoading: boolean = false;
  totalRecords: number = 0;

  // Filter States
  searchStudentTerm: string = '';    // Student Name ya UE ID ke liye
  selectedCollege: string = '';        // College dropdown ke liye
  selectedSport: string = '';          // Sport dropdown ke liye
  selectedCategory: string = '';       // Individual / Group dropdown ke liye
  selectedGroup: string = '';          // New: Group Name dropdown ke liye

  // Dropdown options arrays
  uniqueColleges: string[] = [];
  uniqueSports: string[] = [];
  uniqueGroups: string[] = [];         // New: Unique groups array

  constructor(
    private sportsService: SportsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRegisteredStudents();
  }

  // Backend API se registered students fetch karna
  loadRegisteredStudents(): void {
    this.isLoading = true;
    this.sportsService.getRegistrations().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.registrationList = res.data || [];
          this.totalRecords = res.total || this.registrationList.length;
          this.filteredList = this.registrationList;
          
          // Data aate hi dropdown options extract karna
          this.extractDropdownOptions();
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

  // Unique colleges, sports, aur groups ki list banane ke liye
  extractDropdownOptions(): void {
    const colleges = new Set<string>();
    const sports = new Set<string>();
    const groups = new Set<string>();

    this.registrationList.forEach(item => {
      if (item.College_Full_Name_E) {
        colleges.add(item.College_Full_Name_E.trim());
      }
      if (item.Sport_Name) {
        sports.add(item.Sport_Name.trim());
      }
      if (item.Group_name) {
        groups.add(item.Group_name.trim());
      }
    });

    this.uniqueColleges = Array.from(colleges).sort();
    this.uniqueSports = Array.from(sports).sort();
    this.uniqueGroups = Array.from(groups).sort();
  }

  // Multi-Filter Logic (Student Name, College, Sport, Category, Group Name)
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

      // New: Group Name match check
      const matchesGroup = !this.selectedGroup || 
        (item.Group_name && item.Group_name.trim() === this.selectedGroup.trim());

      return matchesStudent && matchesCollege && matchesSport && matchesCategory && matchesGroup;
    });

    this.cdr.detectChanges();
  }

  // Saare filters reset karne ke liye
  resetFilters(): void {
    this.searchStudentTerm = '';
    this.selectedCollege = '';
    this.selectedSport = '';
    this.selectedCategory = '';
    this.selectedGroup = '';
    this.filteredList = this.registrationList;
    this.cdr.detectChanges();
  }

  // PDF Export Main Function
 // PDF Export Main Function with College-Wise, Sport-Wise, and Team-Wise Grouping
  // PDF Export Main Function with College-Wise, Sport-Wise, and Team/Group-Wise Section Grouping
  exportPDF(type: string): void {
    let dataToPrint = [...this.registrationList];
    let reportTitle = 'INDIRA GANDHI KRISHI VISHWAVIDYALAYA - Registration Directory';

    const collegeFilter = this.selectedCollege ? this.selectedCollege.trim() : '';
    const sportFilter = this.selectedSport ? this.selectedSport.trim() : '';
    const groupFilter = this.selectedGroup ? this.selectedGroup.trim() : '';

    // 1) All Data Print
    if (type === 'all') {
      reportTitle = 'IGKV Inter-College Sports - Complete Registration Directory (College & Team Sections)';
      if (collegeFilter) {
        dataToPrint = this.registrationList.filter(item => item.College_Full_Name_E?.trim() === collegeFilter);
        reportTitle = `IGKV Inter-College Sports - Complete Directory | College: ${collegeFilter}`;
      }
    } 
    // 2) College Wise Report
    else if (type === 'college') {
      reportTitle = 'IGKV Inter-College Sports - College Wise Grouped Report';
      if (collegeFilter) {
        dataToPrint = this.registrationList.filter(item => item.College_Full_Name_E?.trim() === collegeFilter);
        reportTitle = `IGKV Inter-College Sports - College Report: ${collegeFilter}`;
      }
    } 
    // 3) Sports Wise Report
    else if (type === 'sport') {
      reportTitle = 'IGKV Inter-College Sports - Sports Wise Grouped Report';
      if (sportFilter) {
        dataToPrint = this.registrationList.filter(item => item.Sport_Name?.trim() === sportFilter);
        reportTitle = `IGKV Inter-College Sports - Sport Report: ${sportFilter}`;
      }
    } 
    // 4) Individual Games List
    else if (type === 'individual') {
      dataToPrint = this.registrationList.filter(
        item => item.Sports_Category?.trim().toLowerCase() === 'individual'
      );
      reportTitle = 'IGKV Inter-College Sports - Individual Games (College & Group Sections)';

      if (collegeFilter) {
        dataToPrint = dataToPrint.filter(item => item.College_Full_Name_E?.trim() === collegeFilter);
        reportTitle += ` | College: ${collegeFilter}`;
      }
      if (sportFilter) {
        dataToPrint = dataToPrint.filter(item => item.Sport_Name?.trim() === sportFilter);
        reportTitle += ` | Sport: ${sportFilter}`;
      }
      if (groupFilter) {
        dataToPrint = dataToPrint.filter(item => item.Group_name?.trim() === groupFilter);
        reportTitle += ` | Group: ${groupFilter}`;
      }
    } 
    // 5) Group Games List
    else if (type === 'group') {
      dataToPrint = this.registrationList.filter(
        item => item.Sports_Category?.trim().toLowerCase() === 'group'
      );
      reportTitle = 'IGKV Inter-College Sports - Group Games (Team-Wise Sections)';

      if (collegeFilter) {
        dataToPrint = dataToPrint.filter(item => item.College_Full_Name_E?.trim() === collegeFilter);
        reportTitle += ` | College: ${collegeFilter}`;
      }
      if (sportFilter) {
        dataToPrint = dataToPrint.filter(item => item.Sport_Name?.trim() === sportFilter);
        reportTitle += ` | Sport: ${sportFilter}`;
      }
      if (groupFilter) {
        dataToPrint = dataToPrint.filter(item => item.Group_name?.trim() === groupFilter);
        reportTitle += ` | Group/Team: ${groupFilter}`;
      }
    }

    if (dataToPrint.length === 0) {
      alert('No records available for the selected export option or active filters.');
      return;
    }

    // --- jsPDF Initialization ---
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape A4 format

    // --- Header & University Branding ---
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('INDIRA GANDHI KRISHI VISHWAVIDYALAYA, RAIPUR (C.G.)', 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(reportTitle, 14, 21);
    doc.text(`Generated On: ${new Date().toLocaleDateString()} | Total Records: ${dataToPrint.length}`, 14, 27);

    let startY = 33;

    // --- Table Columns Mapping ---
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

    // A) College-wise & Team/Group-wise nested sections (For 'all', 'college', 'individual', or 'group' reports)
    if (((type === 'all' || type === 'college' || type === 'individual' || type === 'group') && !collegeFilter)) {
      
      // Step 1: Group by College Name
      const collegeGrouped = dataToPrint.reduce((acc: any, item: any) => {
        const collegeName = item.College_Full_Name_E || 'Other College';
        if (!acc[collegeName]) acc[collegeName] = [];
        acc[collegeName].push(item);
        return acc;
      }, {});

      let globalIndex = 1;
      for (const [collegeName, collegeStudents] of Object.entries(collegeGrouped)) {
        if (startY > 170) {
          doc.addPage();
          startY = 20;
        }

        // College Main Heading
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(`College: ${collegeName} (${(collegeStudents as any[]).length} Students)`, 14, startY);
        startY += 5;

        // Step 2: Group by Group/Team Name within the same College so same group members stay together
        const teamGrouped = (collegeStudents as any[]).reduce((acc: any, item: any) => {
          const teamName = item.Group_name || 'Individual Entry';
          if (!acc[teamName]) acc[teamName] = [];
          acc[teamName].push(item);
          return acc;
        }, {});

        for (const [teamName, teamMembers] of Object.entries(teamGrouped)) {
          if (startY > 175) {
            doc.addPage();
            startY = 20;
          }

          // Team / Group Sub-Heading
          doc.setFontSize(9.5);
          doc.setTextColor(37, 99, 235); // Blue sub-heading for group names
          doc.text(`   -> Group / Team Name: ${teamName} (${(teamMembers as any[]).length} Members)`, 14, startY);
          startY += 4;

          const rows = (teamMembers as any[]).map((item) => ({
            index: globalIndex++,
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
            body: rows,
            startY: startY,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 3, textColor: [51, 65, 85] },
            headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] }
          });

          startY = (doc as any).lastAutoTable.finalY + 6;
        }
        startY += 4;
      }
    } 
    // B) Sport-wise sections
    else if (type === 'sport' && !sportFilter) {
      const groupedData = dataToPrint.reduce((acc: any, item: any) => {
        const sportName = item.Sport_Name || 'Other Sport';
        if (!acc[sportName]) acc[sportName] = [];
        acc[sportName].push(item);
        return acc;
      }, {});

      let globalIndex = 1;
      for (const [sportName, students] of Object.entries(groupedData)) {
        if (startY > 175) {
          doc.addPage();
          startY = 20;
        }

        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(`Sport / Discipline: ${sportName} (${(students as any[]).length} Participants)`, 14, startY);
        startY += 5;

        // Inside sport, group by team name as well
        const teamGrouped = (students as any[]).reduce((acc: any, item: any) => {
          const teamName = item.Group_name || 'Individual Entry';
          if (!acc[teamName]) acc[teamName] = [];
          acc[teamName].push(item);
          return acc;
        }, {});

        for (const [teamName, teamMembers] of Object.entries(teamGrouped)) {
          if (startY > 175) {
            doc.addPage();
            startY = 20;
          }

          doc.setFontSize(9.5);
          doc.setTextColor(37, 99, 235);
          doc.text(`   -> Group / Team Name: ${teamName} (${(teamMembers as any[]).length} Members)`, 14, startY);
          startY += 4;

          const rows = (teamMembers as any[]).map((item) => ({
            index: globalIndex++,
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
            body: rows,
            startY: startY,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 3, textColor: [51, 65, 85] },
            headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] }
          });

          startY = (doc as any).lastAutoTable.finalY + 6;
        }
        startY += 4;
      }
    } 
    // C) Standard single table when specific college or sport filter is active
    else {
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
        startY: startY,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3, textColor: [51, 65, 85] },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });
    }

    // Page numbers footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
    }

    doc.save(`Sports_Report_${type}_${Date.now()}.pdf`);
  }
}