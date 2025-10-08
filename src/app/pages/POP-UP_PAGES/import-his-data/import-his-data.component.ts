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
  DxDateBoxModule,
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
  SUBMISSION_DATE: Date = new Date();
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

  //===================date format conversion ===================
  formatDateToDDMMYY(date: Date): string {
    if (!date) return '';

    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());

    return `${dd}/${mm}/${yyyy}`;
  }

  // ========= main save import data ===========
  async onSaveClick() {
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

    try {
      const allData = (this.dataSource || []).map((item) => ({
        ...item,
        SUBMISSION_DATE: this.formatDateToDDMMYY(this.SUBMISSION_DATE),
      }));

      const totalRecords = allData.length;
      const batchSize = 15000;

      if (totalRecords === 0) {
        notify({
          message: 'No data available to save.',
          type: 'warning',
          displayTime: 3000,
          position: { at: 'top right', my: 'top right', of: window },
        });
        this.isSaving = false;
        this.isLoading = false;
        return;
      }

      // Create one shared batch ID for all chunks
      const datetime = new Date().toISOString().replace(/[-:.TZ]/g, '');
      const batchId = `${insuranceId}_${datetime}`;

      const totalBatches = Math.ceil(totalRecords / batchSize);

      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, totalRecords);
        const currentBatch = allData.slice(start, end);

        const payload = {
          userId: userId,
          insuranceId: insuranceId,
          BatchNo: batchId,
          import_his_data: currentBatch,
        };

        await this.dataservice
          .Import_His_Data(payload)
          .toPromise()
          .then((res: any) => {
            if (res.flag === '1') {
              notify({
                message: `Batch ${
                  i + 1
                }/${totalBatches} uploaded successfully!`,
                type: 'success',
                displayTime: 2000,
                position: { at: 'top right', my: 'top right', of: window },
              });
            } else {
              throw new Error(res.message || `Batch ${i + 1} failed.`);
            }
          })
          .catch((err) => {
            console.error(`Error in batch ${i + 1}:`, err);
            notify({
              message: `Error importing batch ${i + 1}: ${err.message}`,
              type: 'error',
              displayTime: 4000,
              position: { at: 'top right', my: 'top right', of: window },
            });
            throw err; // stop further batches on error
          });
      }

      notify({
        message: 'All batches imported successfully!',
        type: 'success',
        displayTime: 4000,
        position: { at: 'top right', my: 'top right', of: window },
      });

      this.close();
    } catch (error) {
      console.error('Error during batch upload:', error);
      notify({
        message: 'An error occurred while importing data.',
        type: 'error',
        displayTime: 4000,
        position: { at: 'top right', my: 'top right', of: window },
      });
    } finally {
      this.isSaving = false;
      this.isLoading = false;
    }
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
    DxDateBoxModule,
  ],
  providers: [],
  declarations: [ImportHISDataFormComponent],
  exports: [ImportHISDataFormComponent],
})
export class ImportHISDataFormModule {}
