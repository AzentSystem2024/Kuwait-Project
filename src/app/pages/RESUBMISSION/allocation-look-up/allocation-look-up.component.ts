import { CommonModule } from '@angular/common';
import { Component, NgModule, ViewChild } from '@angular/core';
import {
  DxDataGridModule,
  DxButtonModule,
  DxDropDownButtonModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxLookupModule,
  DxPopupModule,
  DxLoadPanelModule,
  DxDataGridComponent,
  DxTabsModule,
  DxTreeListModule,
  DxNumberBoxModule,
} from 'devextreme-angular';
import { FormPopupModule } from 'src/app/components';
import { AllocationPageModule } from '../PopUp-Pages/allocation-page/allocation-page.component';
import { AllocationPageComponent } from '../PopUp-Pages/allocation-page/allocation-page.component';
import { ResubmissionServiceService } from '../resubmission-service.service';
import { DataSource } from 'devextreme/common/data';
import notify from 'devextreme/ui/notify';
import { ExcelImportLookupPageComponent } from '../PopUp-Pages/excel-import-lookup-page/excel-import-lookup-page.component';
import { ExcelImportLookupModule } from '../PopUp-Pages/excel-import-lookup-page/excel-import-lookup-page.component';

@Component({
  selector: 'app-allocation-look-up',
  templateUrl: './allocation-look-up.component.html',
  styleUrl: './allocation-look-up.component.scss',
})
export class AllocationLookUpComponent {
  @ViewChild('mainDataGrid', { static: false })
  mainDataGrid!: DxDataGridComponent;

  readonly allowedPageSizes: any = [5, 10, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;

  dataSource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        this.loadingVisible = true;
        this.resubServ.get_resubmission_LogData_List().subscribe({
          next: (response: any) => {
            this.loadingVisible = false;
            resolve(response.Data);
          },
          error: (error) => reject(error.message),
        });
      }),
  });

  columns: any = [
    { dataField: 'AllocationNo', caption: 'Allocation No', dataType: 'number' },
    {
      dataField: 'AllocationDate',
      caption: 'Allocation Date',
      dataType: 'date',
      format: 'yyyy-MM-dd',
    },
    {
      dataField: 'SelectedClaimCount',
      caption: 'Selected Claim Count',
      dataType: 'number',
    },
    { dataField: 'Facility', caption: 'Facility', dataType: 'string' },
    { dataField: 'AllocatedTo', caption: 'Allocated To', dataType: 'string' },
    {
      dataField: 'AllocatedUser',
      caption: 'Allocated User',
      dataType: 'string',
    },
    { dataField: 'StatusName', caption: 'Status Name', dataType: 'string' },
    { dataField: 'Remarks', caption: 'Remarks', dataType: 'string' },
  ];

  isAddPopupOpened: boolean = false;
  loadingVisible: boolean = false;
  deletePopupVisible: boolean = false;
  deleteReason: any;
  rowToDelete: any;
  iseditPopupOpened: boolean = false;
  editRowData: any;

  isExcelPopupVisible: boolean = false;

  constructor(private resubServ: ResubmissionServiceService) {}

  loadDataSource(): DataSource<any> {
    return new DataSource<any>({
      load: () =>
        new Promise((resolve, reject) => {
          this.loadingVisible = true;
          this.resubServ.get_resubmission_LogData_List().subscribe({
            next: (response: any) => {
              this.loadingVisible = false;
              resolve(response.Data);
            },
            error: (error) => reject(error.message),
          });
        }),
    });
  }

  isEditable = (options: any) => options.row.data.StatusID === 0;
  //================== show new add form popup ===================
  show_new__Form() {
    this.isAddPopupOpened = true;
  }

  //===============show excel data lookup popup ===============
  show_excel_data_lookup() {
    this.isExcelPopupVisible = true;
  }
  //============ Row preparation for edit and delete button ========
  onRowPrepared(event: any) {
    if (event.rowType === 'data') {
      if (event.data.StatusID === 0) {
        event.component.option('editing.allowUpdating', true);
        event.component.option('editing.allowDeleting', true);
      } else {
        event.component.option('editing.allowUpdating', false);
        event.component.option('editing.allowDeleting', false);
      }
    }
  }
  //===================== referesh the datagrid ====================
  refresh = () => {
    this.mainDataGrid?.instance.refresh();
  };
  //================ popup hiding ======================
  On_PopUp_Hiding() {
    this.isAddPopupOpened = false;
    this.refresh();
  }

  //=============== enable delete row popup ===============
  onRowRemoving(event) {
    console.log('removing data ', event);
    event.cancel = true;
    this.rowToDelete = event.data;
    this.deleteReason = ''; // Reset input field
    this.deletePopupVisible = true;
  }

  //================== Delete a row data ===================
  deleteRow() {
    if (!this.rowToDelete) return;
    const userid = sessionStorage.getItem('UserID');
    const payload = {
      userID: userid,
      AllocationID: this.rowToDelete.AllocationID,
      CancelledRemarks: this.deleteReason,
    };
    this.resubServ.delete_allocated_data(payload).subscribe((response: any) => {
      if (response.Flag == '1') {
        notify(
          {
            message: `allocated data deleted successfully`,
            position: { at: 'top right', my: 'top right' },
          },
          'error'
        );
      }
      this.deleteReason = '';
      this.deletePopupVisible = false;
      this.refresh();
    });
  }
  // ================ row data updating event ==============
  onRowUpdating(event: any) {
    event.cancel = true;
    this.resubServ
      .get_selected_rowData_List(event.data.AllocationID)
      .subscribe((response: any) => {
        if (response) {
          console.log('selected row data :', response);
          this.editRowData = response;
          this.iseditPopupOpened = true;
        } else {
          this.iseditPopupOpened = false;
        }
      });
  }

  //========= data exporting to excel ===========
  onExporting(event) {}
}

@NgModule({
  imports: [
    CommonModule,
    DxDataGridModule,
    DxButtonModule,
    DxDataGridModule,
    DxDropDownButtonModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxLookupModule,
    DxPopupModule,
    FormPopupModule,
    AllocationPageModule,
    DxLoadPanelModule,
    DxTabsModule,
    DxTreeListModule,
    DxNumberBoxModule,
    ExcelImportLookupModule,
  ],
  providers: [],
  exports: [],
  declarations: [AllocationLookUpComponent],
})
export class AllocationLookUpModule {}
