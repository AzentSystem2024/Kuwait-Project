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

  readonly allowedPageSizes: any = [50, 100, 1000];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;

  columnData: any[] = [];
  dataSource: any[] = [];
  isColumnsLoaded = false;

  isSaving: boolean = false;
  gridLoading: boolean = false;

  insuranceList: any = [];
  selectedInsuranceId: any;
  selectedInsurance: any;
  isLoading: boolean = false;

  constructor(private dataservice: DataService) {}

  ngOnInit(): void {
    if (this.viewData) {
      this.selectedInsurance = this.viewData.InsuranceName;
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

  downloadTemplate() {
    if (!this.columnData || this.columnData.length === 0) {
      notify('No columns to download template.', 'error', 1000);
      return;
    }
    const headers = this.columnData.map((c) => c.caption);
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, 'HIS_template.xlsx');
  }

  // ===== trigger file input =======
  selectFile() {
    this.fileInput.nativeElement.click();
  }

  // ========= handle file selection and read the Excel file =======
  onFileSelected(event: any) {
    const target: DataTransfer = <DataTransfer>event.target;
    if (target.files.length !== 1) {
      notify({
        message: 'Please select a single Excel file.',
        type: 'error',
        displayTime: 5000,
        position: { my: 'right top', at: 'right top', of: window },
      });
      return;
    }

    const file = target.files[0];
    const reader: FileReader = new FileReader();

    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });

      // Get first sheet
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      // Get headers (first row only)
      const sheetHeaders: string[] = this.getHeaders(ws);

      // Expected headers from API columnData
      const expectedHeaders: string[] = this.columnData.map(
        (c: any) => c.dataField
      );

      // Compare sets
      const missingInExcel = expectedHeaders.filter(
        (h) => !sheetHeaders.includes(h)
      );
      const extraInExcel = sheetHeaders.filter(
        (h) => !expectedHeaders.includes(h)
      );

      if (missingInExcel.length > 0 || extraInExcel.length > 0) {
        notify({
          message:
            `Column mismatch!\n\n` +
            (missingInExcel.length
              ? `Missing in Excel: ${missingInExcel.join(', ')}\n`
              : '') +
            (extraInExcel.length
              ? `Extra in Excel: ${extraInExcel.join(', ')}\n`
              : ''),
          type: 'error',
          displayTime: 5000,
          position: { my: 'right top', at: 'right top', of: window },
        });
        this.resetFileInput();
        return;
      }

      // 👉 If headers match → load JSON data
      const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
      this.dataSource = data;

      this.resetFileInput();

      notify({
        message: 'Excel file loaded successfully!',
        type: 'success',
        displayTime: 5000,
        position: { my: 'right top', at: 'right top', of: window },
      });
    };

    reader.readAsBinaryString(file);
  }

  // ====== Utility function to extract headers from sheet ===
  getHeaders(sheet: XLSX.WorkSheet): string[] {
    const headers: string[] = [];
    const range = XLSX.utils.decode_range(sheet['!ref']!);

    const R = range.s.r; // First row index
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = sheet[XLSX.utils.encode_cell({ c: C, r: R })];
      let hdr = 'UNKNOWN ' + C;
      if (cell && cell.t) hdr = XLSX.utils.format_cell(cell);
      headers.push(hdr.trim());
    }
    return headers;
  }
  // ========= main save import data ===========
  onSaveClick() {
    const userId = Number(sessionStorage.getItem('UserID')) || 0;
    const insuranceId = this.selectedInsuranceId || 0;

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

    const payload = {
      userId: userId,
      insuranceId: insuranceId,
      import_his_data: this.dataSource || [],
    };

    this.dataservice.Import_His_Data(payload).subscribe({
      next: (res: any) => {
        if (res.flag === '1') {
          this.close();
          notify({
            message: 'Data imported successfully!',
            type: 'success',
            displayTime: 3000,
            position: { at: 'top right', my: 'top right', of: window },
          });
        } else {
          notify({
            message: res.message || 'Import failed.',
            type: 'error',
            displayTime: 3000,
            position: { at: 'top right', my: 'top right', of: window },
          });
        }
      },
      error: () => {
        notify({
          message: 'An error occurred while saving.',
          type: 'error',
          displayTime: 3000,
          position: { at: 'top right', my: 'top right', of: window },
        });
      },
      complete: () => {
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
  ],
  providers: [],
  declarations: [ImportHISDataFormComponent],
  exports: [ImportHISDataFormComponent],
})
export class ImportHISDataFormModule {}
