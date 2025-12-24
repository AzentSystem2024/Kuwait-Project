import { CommonModule } from '@angular/common';
import { Component, NgModule, ViewChild } from '@angular/core';
import {
  DxDataGridComponent,
  DxDataGridModule,
  DxButtonModule,
  DxDropDownButtonModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxLookupModule,
  DxPopupModule,
  DxLoadPanelModule,
  DxTabsModule,
  DxTreeListModule,
  DxNumberBoxModule,
} from 'devextreme-angular';
import { DataSource } from 'devextreme/common/data';
import notify from 'devextreme/ui/notify';
import { FormPopupModule } from 'src/app/components';
import { BatchUploadingModule } from '../PopUp-Pages/batch-uploading-page/batch-uploading-page.component';
import { ResubmissionServiceService } from '../resubmission-service.service';

@Component({
  selector: 'app-batch-uploading-look-up',
  templateUrl: './batch-uploading-look-up.component.html',
  styleUrl: './batch-uploading-look-up.component.scss',
})
export class BatchUploadingLookUpComponent {
  @ViewChild('mainDataGrid', { static: false })
  mainDataGrid!: DxDataGridComponent;

  readonly allowedPageSizes: any = [15, 25, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;

  dataSource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        this.loadingVisible = true;
        this.resubServ.get_resubmissionBatch_Upload_LogList().subscribe({
          next: (response: any) => {
            this.loadingVisible = false;
            resolve(response.data);
          },
          error: (error) => reject(error.message),
        });
      }),
  });

  isAddPopupOpened: boolean = false;
  loadingVisible: boolean = false;
  deletePopupVisible: boolean = false;
  deleteReason: any;
  rowToDelete: any;
  iseditPopupOpened: boolean = false;
  editRowData: any;
  IsEditing: boolean = false;

  isExcelPopupVisible: boolean = false;

  constructor(private resubServ: ResubmissionServiceService) {}

  loadDataSource(): DataSource<any> {
    return new DataSource<any>({
      load: () =>
        new Promise((resolve, reject) => {
          this.loadingVisible = true;
          this.resubServ.get_resubmissionBatch_Upload_LogList().subscribe({
            next: (response: any) => {
              this.loadingVisible = false;
              resolve(response.data);
            },
            error: (error) => reject(error.message),
          });
        }),
    });
  }

  isEditable = (options: any) => options.row.data.Status === 'Open';
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
    this.iseditPopupOpened = false;
    this.refresh();
  }

  //=============== enable delete row popup ===============
  onRowRemoving(event) {
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
      ResubmissionRevisionBatchUID:
        this.rowToDelete.ResubmissionRevisionBatchUID,
      cancelledRemarks: this.deleteReason,
    };
    this.resubServ
      .delete_revision_Batch_data(payload)
      .subscribe((response: any) => {
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
      .get_select_revision_Batch_data(event.data.ResubmissionRevisionBatchUID)
      .subscribe((response: any) => {
        if (response) {
          this.editRowData = response;
          this.IsEditing = true;
          this.iseditPopupOpened = true;
        } else {
          this.iseditPopupOpened = false;
          this.IsEditing = false;
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
    DxLoadPanelModule,
    DxTabsModule,
    DxTreeListModule,
    DxNumberBoxModule,
    BatchUploadingModule,
  ],
  providers: [],
  exports: [BatchUploadingLookUpComponent],
  declarations: [BatchUploadingLookUpComponent],
})
export class BatchUploadingLookUpModule {}
