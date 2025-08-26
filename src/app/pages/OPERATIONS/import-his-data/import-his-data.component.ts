import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit, ViewChild } from '@angular/core';
import {
  DxDataGridModule,
  DxButtonModule,
  DxPopupModule,
  DxDataGridComponent,
  DxValidationGroupComponent,
} from 'devextreme-angular';
import { FormPopupModule } from 'src/app/components';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services';
import { ImportMasterDataFormComponent } from '../../POP-UP_PAGES/import-master-data-form/import-master-data-form.component';
import { ViewImportedMasterDataFormComponent } from '../../POP-UP_PAGES/view-imported-master-data-form/view-imported-master-data-form.component';
import {
  ImportHISDataFormModule,
  ImportHISDataFormComponent,
} from '../../POP-UP_PAGES/import-his-data/import-his-data.component';
import { DataSource } from 'devextreme/common/data';
import notify from 'devextreme/ui/notify';

@Component({
  selector: 'app-import-his-data',
  templateUrl: './import-his-data.component.html',
  styleUrl: './import-his-data.component.scss',
})
export class ImportHISDataComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;

  @ViewChild(ImportHISDataFormComponent, { static: false })
  ImportHISDataFormComponent: ImportHISDataFormComponent;

  @ViewChild(ViewImportedMasterDataFormComponent, { static: false })
  viewImportedMasterDataForm: ViewImportedMasterDataFormComponent;

  @ViewChild('validationGroup', { static: true })
  validationGroup: DxValidationGroupComponent;

  isNewFormPopupOpened: boolean = false;
  readonly allowedPageSizes: any = [5, 10, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;
  popupwidth: any = '65%';
  UserID: any;
  dataSource: any;
  selectedData: any;
  ViewDataPopup: any;
  currentPathName: string;
  initialized: boolean;

  addButtonOptions = {
    text: 'New',
    icon: 'bi bi-file-earmark-plus',
    type: 'default',
    stylingMode: 'contained',
    hint: 'Add new entry',
    onClick: () => this.show_new_Form(),
    elementAttr: { class: 'add-button' },
  };

  isFilterRowVisible: boolean = false;

  constructor(private service: DataService) {
    this.UserID = sessionStorage.getItem('UserID');
  }

  ngOnInit(): void {
    this.loadImportHisLogDataSource();
  }

  // ============ Load Import HIS Log DataSource ============
  loadImportHisLogDataSource() {
    this.dataSource = new DataSource<any>({
      load: () =>
        new Promise((resolve, reject) => {
          this.service.get_Importing_His_Log_List().subscribe({
            next: (res: any) => {
              if (res.flag === '1') {
                resolve(res.data || []);
              } else {
                reject(res.message || 'Failed to load data');
              }
            },
            error: (err) => reject(err.message || 'Server error'),
          });
        }),
    });
  }
  // ======= filtert row enable and hide ======
  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  // =========== close button click ===========
  CloseEditForm() {
    this.isNewFormPopupOpened = false;
    this.ViewDataPopup = false;
    this.dataGrid.instance.refresh();
    this.loadImportHisLogDataSource();
  }
  // ======== show new inport popup =======
  show_new_Form() {
    this.isNewFormPopupOpened = true;
  }
  // ============ detailed view click ========
  viewDetails = (e: any) => {
    const id = e.row.key.ID;
    if (!id) {
      notify({
        message: 'No valid record selected.',
        type: 'warning',
        displayTime: 3000,
        position: 'top right',
      });
      return;
    }

    this.service.fetch_His_Data_log_view(id).subscribe({
      next: (res: any) => {
        if (res) {
          this.selectedData = res;
          this.ViewDataPopup = true;
          notify({
            message: 'Record details loaded successfully.',
            type: 'success',
            displayTime: 3000,
            position: 'top right',
          });
        } else {
          notify({
            message: 'No details found for this record.',
            type: 'info',
            displayTime: 3000,
            position: 'top right',
          });
        }
      },
      error: () => {
        notify({
          message: 'Failed to fetch record details.',
          type: 'error',
          displayTime: 5000,
          position: 'top right',
        });
      },
    });
  };

  formatImportTime(rowData: any): string {
    const celldate = rowData.ImportTime;
    if (!celldate) return '';

    const date = new Date(celldate);

    // Format the date and time using the user's system locale
    const formattedDate = date.toLocaleDateString(); // Formats according to the user's system date format
    const formattedTime = date.toLocaleTimeString(); // Formats according to the user's system time format

    // Combine date and time
    return `${formattedDate}, ${formattedTime}`;
  }

  refresh = () => {
    this.dataGrid.instance.refresh();
  };

  onClearData() {
    this.ImportHISDataFormComponent.clearData();
  }

}

@NgModule({
  imports: [
    CommonModule,
    DxDataGridModule,
    DxButtonModule,
    FormPopupModule,
    DxPopupModule,
    ImportHISDataFormModule,
  ],
  providers: [],
  exports: [],
  declarations: [ImportHISDataComponent],
})
export class ImportHISDataModule {}
