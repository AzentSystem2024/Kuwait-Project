import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgModule,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  DxButtonModule,
  DxDataGridComponent,
  DxDataGridModule,
  DxLoadPanelModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxValidatorModule,
} from 'devextreme-angular';
import { DataService } from 'src/app/services';
import * as XLSX from 'xlsx';
import notify from 'devextreme/ui/notify';

@Component({
  selector: 'app-import-his-data-import',
  templateUrl: './import-his-data.component.html',
  styleUrl: './import-his-data.component.scss',
  providers: [DataService],
})
export class ImportHISDataFormComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;

  @ViewChild('fileInput', { static: false }) fileInput: ElementRef;

  @Output() closeForm = new EventEmitter();

  @Input() viewData: any = null;
  @Input() dataSource: any = null;
  @Input() selectedInsurance: any = null;

  readonly allowedPageSizes: any = [50, 100, 1000];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;

  columnData: any[] = [];

  isColumnsLoaded = false;

  isSaving: boolean = false;
  isLoading: boolean = false;

  insuranceList: any = [];

  constructor(private dataservice: DataService) {}

  ngOnInit(): void {
    if (this.viewData) {
      this.selectedInsurance = this.viewData.InsuranceID;
      this.dataSource = this.viewData.import_his_data;
    } else {
    }
    this.fetch_insurance_dropdown_data();
    this.fetch_His_Column_List();
  }
  // ======== column list fetching ======
  fetch_His_Column_List() {
    this.dataservice.get_His_Data_Column_List().subscribe((res: any) => {
      if (res.flag === '1') {
        this.columnData = res.data.map((col: any) => ({
          dataField: col.ColumnName,
          caption: col.ColumnTitle,
          width: 150,
          wordWrapEnabled: true,
        }));
        this.isColumnsLoaded = true;
      }
    });
  }

  //======== get_insurance_dropdown ========
  fetch_insurance_dropdown_data() {
    this.dataservice.Get_GropDown('INSURANCE').subscribe((res: any) => {
      if (res) {
        this.insuranceList = res;
      }
    });
  }
  // ========= oncell prepared ======
  onCellPrepared(e: any) {
    if (e.rowType === 'data') {
      const column = this.columnData.find(
        (c) => c.dataField === e.column.dataField
      );
      if (column?.IsMandatory && !e.value) {
        e.cellElement.style.backgroundColor = '#FFC1C3';
        notify(`Error: ${column.caption} is mandatory`, 'error', 1500);
      }
    }
  }
  // ========= main save import data ===========
  onSaveClick() {
    const userId = Number(sessionStorage.getItem('UserID')) || 0;
    const insuranceId = this.selectedInsurance || 0;

    if (!insuranceId || insuranceId === 0) {
      notify({
        message: 'Please select an Insurance before saving.',
        type: 'error',
        displayTime: 3000,
        position: { at: 'top right', my: 'top right', of: window },
      });
      return;
    }

    this.isSaving = true;
    this.isLoading = true;

    const payload = {
      userId: userId,
      insuranceId: insuranceId,
      import_his_data: this.dataSource || [],
    };

    this.dataservice.Import_His_Data(payload).subscribe({
      next: (res: any) => {
        if (res.flag === '1') {
          this.isLoading = false;
          this.close();
          notify({
            message: 'Data imported successfully!',
            type: 'success',
            displayTime: 3000,
            position: { at: 'top right', my: 'top right', of: window },
          });
        } else {
          this.isLoading = false;
          notify({
            message: res.message || 'Import failed.',
            type: 'error',
            displayTime: 3000,
            position: { at: 'top right', my: 'top right', of: window },
          });
        }
      },
      error: () => {
        this.isLoading = false;
        notify({
          message: 'An error occurred while saving.',
          type: 'error',
          displayTime: 3000,
          position: { at: 'top right', my: 'top right', of: window },
        });
      },
      complete: () => {
        this.isLoading = false;
        this.isSaving = false;
      },
    });
  }

  // Error handler to manage error notifications and state
  handleError(error: any) {
    if (error.status === 0) {
      notify(
        {
          message:
            'Network error: Please check your internet connection and try again.',
          position: { at: 'top right', my: 'top right' },
          displayTime: 1000,
        },
        'error'
      );
    } else if (error.status === 500) {
      notify(
        {
          message:
            'Server error: Unable to process the request right now. Please try again later.',
          position: { at: 'top right', my: 'top right' },
          displayTime: 1000,
        },
        'error'
      );
    } else {
      notify(
        {
          message: 'Failed to import data. Please try again.',
          position: { at: 'top right', my: 'top right' },
          displayTime: 1000,
        },
        'error'
      );
    }
    console.error('Error during data import:', error);
    this.isSaving = false;
    this.isLoading = false;
  }

  // ========== clear input selector ======
  resetFileInput() {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  clearData() {
    this.dataSource = [];
    this.columnData = [];
    this.viewData = null;
  }

  close() {
    this.clearData();
    this.isLoading = false;
    this.closeForm.emit();
  }
}

@NgModule({
  imports: [
    CommonModule,
    DxDataGridModule,
    DxButtonModule,
    DxSelectBoxModule,
    DxValidatorModule,
    DxTextBoxModule,
    DxLoadPanelModule,
  ],
  providers: [],
  declarations: [ImportHISDataFormComponent],
  exports: [ImportHISDataFormComponent],
})
export class ImportHISDataFormModule {}
