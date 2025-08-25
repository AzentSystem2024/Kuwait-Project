import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  NgModule,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {
  DxTabPanelModule,
  DxCheckBoxModule,
  DxSelectBoxModule,
  DxTemplateModule,
  DxTabsModule,
  DxTextBoxModule,
  DxButtonModule,
  DxDataGridModule,
  DxTreeViewModule,
  DxValidatorModule,
} from 'devextreme-angular';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';

@Component({
  selector: 'app-user-level-edit-form',
  templateUrl: './user-level-edit-form.component.html',
  styleUrls: ['./user-level-edit-form.component.scss'],
  providers: [MasterReportService],
})
export class UserLevelEditFormComponent implements OnInit, OnChanges {
  @Input() editValue: any;

  width: any = '100%';
  rtlEnabled: boolean = false;
  scrollByContent: boolean = true;
  showNavButtons: boolean = true;
  orientations: any = 'horizontal';
  stylingMode: any = 'primary';
  iconPosition: any = 'left';
  selectedTabData: any[] = [];
  selectedRows: { [key: number]: any[] } = {};
  selectedTab: number = 0;
  allSelectedRows: any[] = [];
  MenuDatasource: any;
  UserLevelValue: any = '';
  isErrorVisible: boolean = false;
  checkedRows: any;
  resetValue: boolean = false;
  constructor(private masterservice: MasterReportService) {}

  ngOnInit(): void {
    this.get_All_MenuList();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editValue'] && this.editValue) {
      console.log('selected edit data value is ', this.editValue);
      this.allSelectedRows = [];
      this.UserLevelValue = this.editValue.UserRoles;
      // Process the editData to match the new format
      const selectedMenuIds = this.editValue.usermenulist.map(
        (menu: any) => menu.MenuId
      );
      // Update selectedRows for each tab based on selectedMenuIds
      this.MenuDatasource.forEach((tab, index) => {
        this.selectedRows[index] = tab.Menus.filter((menu: any) =>
          selectedMenuIds.includes(menu.MenuId)
        ).map((menu: any) => menu.MenuId);
      });
      // Set the data for the initial tab
      this.selectedTab = 0;
      this.selectedTabData = this.MenuDatasource[this.selectedTab].Menus;
    }
  }

  get_All_MenuList() {
    this.masterservice.get_userLevel_menuList().subscribe((response: any) => {
      this.MenuDatasource = response.Data;
      if (this.MenuDatasource.length > 0) {
        this.selectedTabData = this.MenuDatasource[0].Menus;
      }
    });
  }

  onTabClick(event: any): void {
    this.selectedTab = event.itemIndex;
    this.selectedTabData = this.MenuDatasource[this.selectedTab].Menus;
  }

  onUserLevelValueChange(event: any): void {
    this.UserLevelValue = event.value;
    this.combineSelectedRows();
  }

  onSelectionChanged(event: any): void {
    if (this.UserLevelValue == '') {
      this.isErrorVisible = true;
    } else {
      this.selectedRows[this.selectedTab] = event.selectedRowKeys;
      this.combineSelectedRows();
    }
  }

  combineSelectedRows(): void {
    this.allSelectedRows = [];
    Object.keys(this.selectedRows).forEach((key) => {
      if (this.selectedRows[key].length > 0) {
        const existingEntry = this.allSelectedRows.find(
          (row) => row.userLevelname === this.UserLevelValue
        );
        if (existingEntry) {
          existingEntry.Menus = [
            ...existingEntry.Menus,
            ...this.selectedRows[key].map((menuId) => ({ MenuId: menuId })),
          ];
        } else {
          this.allSelectedRows.push({
            userLevelID: this.editValue.ID,
            userLevelname: this.UserLevelValue,
            Menus: this.selectedRows[key].map((menuId) => ({ MenuId: menuId })),
          });
        }
      }
    });
    console.log('all selected row data :', this.allSelectedRows);
  }

  getNewUSerLevelEditedData = () => ({ ...this.allSelectedRows });

  resetUserChanges = () => {
    this.editValue=''
  };
}
@NgModule({
  imports: [
    CommonModule,
    DxTabPanelModule,
    DxCheckBoxModule,
    DxSelectBoxModule,
    DxTemplateModule,
    DxTabsModule,
    DxTextBoxModule,
    DxButtonModule,
    DxDataGridModule,
    DxTreeViewModule,
    DxValidatorModule,
  ],
  providers: [],
  declarations: [UserLevelEditFormComponent],
  exports: [UserLevelEditFormComponent],
})
export class UserLevelEditFormModule {}
