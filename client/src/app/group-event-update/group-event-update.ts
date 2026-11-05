import { Component } from '@angular/core';
import { SportsService } from '../servies/sports-registration.service';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  imports: [FormsModule , CommonModule],
  selector: 'app-group-event-update',
  styleUrl: './group-event-update.css',
  templateUrl: './group-event-update.html',
})
export class GroupEventUpdate {
  allRegistrations: any[] = [];
  uniqueGroups: string[] = [];
  selectedGroupName: string = '';
  groupMembers: any[] = [];
  minPlayers: number = 1;
  
  groupData: any = {
    Sport_ID: '',
    Category_ID: '',
    College_Id: '',
    Gender: ''
  };

  // Yahan service inject ki gayi hai
  constructor(private sportsService: SportsService ) {}

  ngOnInit(): void {
    this.loadAllGroupsData();
  }

  // Service ka method yahan call kiya gaya hai
  loadAllGroupsData() {
    this.sportsService.getAllRegistrations().subscribe({
      next: (res) => {
        if (res && res.success) {
          this.allRegistrations = res.data;
          this.uniqueGroups = [...new Set(this.allRegistrations.map(item => item.Group_name))];
        }
      },
      error: (err) => {
        console.error('Error fetching registrations:', err);
      }
    });
  }

  onGroupSelect(groupName: string) {
    this.selectedGroupName = groupName;
    if (!groupName) {
      this.groupMembers = [];
      return;
    }

    this.groupMembers = this.allRegistrations.filter(item => item.Group_name === groupName);

    if (this.groupMembers.length > 0) {
      this.groupData = { ...this.groupMembers[0] };
      this.fetchSportMinPlayers(this.groupData.Sport_ID);
    }
  }

  fetchSportMinPlayers(sportId: number) {
    this.sportsService.getSportMaster(sportId).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.minPlayers = res.data.Min_player || 1;
        }
      }
    });
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
          },
          error: (err) => {
            Swal.fire('Error!', err.error.message || 'Failed to remove player.', 'error');
          }
        });
      }
    });
}
}
