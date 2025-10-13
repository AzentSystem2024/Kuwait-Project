import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  NgModule,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  DxDataGridComponent,
  DxValidationGroupComponent,
  DxDataGridModule,
  DxButtonModule,
  DxPopupModule,
  DxSelectBoxModule,
  DxValidatorModule,
  DxLoadPanelModule,
} from 'devextreme-angular';
import { DataSource } from 'devextreme/common/data';
import notify from 'devextreme/ui/notify';
import { FormPopupModule } from 'src/app/components';
import { DataService } from 'src/app/services';

import * as XLSX from 'xlsx';
import {
  ImportRADataPopupModule,
  ImportRADataPopupComponent,
} from '../../POP-UP_PAGES/import-ra-data-popup/import-ra-data-popup.component';

@Component({
  selector: 'app-import-ra-data',
  templateUrl: './import-ra-data.component.html',
  styleUrl: './import-ra-data.component.scss',
})
export class ImportRADataComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;

  @ViewChild(ImportRADataPopupComponent, { static: false })
  ImportRADataFormComponent: ImportRADataPopupComponent;

  @ViewChild('validationGroup', { static: true })
  validationGroup: DxValidationGroupComponent;

  @ViewChild('fileInput', { static: false }) fileInput: ElementRef;

  isNewFormPopupOpened: boolean = false;
  readonly allowedPageSizes: any = [10, 20, 'all'];
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

  isFilterRowVisible: boolean = false;
  columnData: any;
  isColumnsLoaded = false;
  ImportedDataSource: any;

  insuranceList: any;
  selectedInsuranceId: any = null;

  downloadButtonOptions: any;

  addButtonOptions: any;
  selectedInsuranceDesc: any;

  isLoading: boolean = false;
  LogID: any;

  constructor(private service: DataService) {
    this.UserID = sessionStorage.getItem('UserID');
  }

  ngOnInit(): void {
    this.loadImportRALogDataSource();
    this.fetch_insurance_dropdown_data();
    this.isLoading = false;

    this.addButtonOptions = {
      text: '',
      icon: 'bi bi-file-earmark-plus',
      type: 'default',
      stylingMode: 'contained',
      hint: 'Import Excel Data',
      onClick: () => this.selectFile(),
      elementAttr: { class: 'add-button' },
    };

    this.downloadButtonOptions = {
      hint: 'Download Template',
      icon: 'download',
      type: 'default',
      stylingMode: 'contained',
      onClick: () => this.downloadTemplate(),
    };
  }

  //======== get_insurance_dropdown ========
  fetch_insurance_dropdown_data() {
    this.service.Get_GropDown('INSURANCE').subscribe((res: any) => {
      if (res) {
        this.insuranceList = res;
      }
    });
  }

  //======= fetch column data ========
  fetch_RA_Column_Data() {
    const payload = { InsuranceID: this.selectedInsuranceId };
    this.service.get_RA_Data_Column_List(payload).subscribe((res: any) => {
      if (res.flag === '1') {
        this.columnData = res.data.map((col: any) => ({
          dataField: col.ColumnName,
          caption: col.ColumnTitle,
          type: col.Type,
        }));
      }
    });
  }

  // ======== Load Import HIS Log DataSource ========
  loadImportRALogDataSource() {
    this.dataSource = new DataSource<any>({
      load: () =>
        new Promise((resolve, reject) => {
          this.service.get_Importing_RA_Log_List().subscribe({
            next: (res: any) => {
              if (res.flag === '1') {
                this.isLoading = false;
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

  // ========== download excel template columns xl file ======
  downloadTemplate() {
    if (!this.columnData || this.columnData.length === 0) {
      notify('No columns to download template.', 'error', 1000);
      return;
    }
    const headers = this.columnData.map((c) => c.caption);
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, 'RA_template.xlsx');
  }

  // ===== trigger file input =====
  selectFile() {
    if (this.selectedInsuranceId) {
      this.fileInput.nativeElement.click();
    } else {
      notify({
        message: 'Please select a insurance.',
        type: 'error',
        displayTime: 5000,
        position: { my: 'right top', at: 'right top', of: window },
      });
    }
  }

  // ============ File Selected from Excel =========
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

    this.isLoading = true;
    const file = target.files[0];
    const reader: FileReader = new FileReader();

    reader.onload = (e: any) => {
      const bstr: string = e.target.result;

      const wb: XLSX.WorkBook = XLSX.read(bstr, {
        type: 'binary',
        cellDates: true,
      });

      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      // Raw Excel Data
      const rawData = XLSX.utils.sheet_to_json(ws, { defval: '', raw: true });

      // Map Captions to Data Fields
      const captionToField: Record<string, string> = {};
      this.columnData.forEach((col) => {
        captionToField[col.caption] = col.dataField;
      });

      let mappedData = rawData.map((row: any) => {
        const newRow: any = {};
        Object.keys(row).forEach((caption) => {
          const field = captionToField[caption];
          if (field) newRow[field] = row[caption];
        });
        return newRow;
      });

      // Date Fields from Column Settings
      const dateFields = this.columnData
        .filter((c) => c.type === 'DATETIME')
        .map((c) => c.dataField);

      // Format and Fix Date Issues
      mappedData = this.formatDateFields(mappedData, dateFields);

      this.ImportedDataSource = mappedData;
      this.isLoading = false;
      this.isNewFormPopupOpened = true;
      this.resetFileInput();
    };

    reader.readAsBinaryString(file);
  }

  // ========= Format & Fix Date (One-Day Minus Bug Fixed) =========
  formatDateFields(data: any[], dateFields: string[]): any[] {
    return data.map((row) => {
      const newRow = { ...row };

      dateFields.forEach((field) => {
        let value = newRow[field];
        if (!value) return;

        let dateObj: Date | null = null;

        // Case 1: Excel Serial Number (e.g., 45857)
        if (typeof value === 'number') {
          // Excel epoch conversion (handles 1900 bug)
          dateObj = new Date(Math.round((value - 25567 - 1) * 86400 * 1000));
        }
        // Case 2: Already a Date object
        else if (value instanceof Date) {
          dateObj = new Date(
            Date.UTC(value.getFullYear(), value.getMonth(), value.getDate())
          );
        }
        // Case 3: String date input
        else {
          const temp = new Date(value);
          if (!isNaN(temp.getTime())) dateObj = temp;
        }

        if (dateObj) {
          // Format dd/MM/yyyy
          const day = String(dateObj.getUTCDate()).padStart(2, '0');
          const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
          const year = dateObj.getUTCFullYear();
          newRow[field] = `${day}/${month}/${year}`;
        }
      });

      return newRow;
    });
  }

  // ========= Strict dd/MM/yyyy Validator =========
  isValidDDMMYYYY(value: any): boolean {
    if (!value || typeof value !== 'string') return false;
    const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    return regex.test(value);
  }

  // ======== Utility function to extract headers from sheet ========
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

  // ========== clear input selector ========
  resetFileInput() {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  // ========= filtert row enable and hide =========
  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  // =========== close button click ===========
  CloseEditForm() {
    this.isNewFormPopupOpened = false;
    this.ViewDataPopup = false;
    this.selectedData = null;
    this.dataGrid.instance.refresh();
    this.resetFileInput();
    this.loadImportRALogDataSource();
    this.fetch_insurance_dropdown_data();
  }
  // ======== show new inport popup =======
  show_new_Form() {
    this.isNewFormPopupOpened = true;
  }
  // ============ detailed view click ========
  viewDetails = (e: any) => {
    this.LogID = e.row.key.ID;
    if (!this.LogID && e) {
      notify({
        message: 'No valid record selected.',
        type: 'warning',
        displayTime: 3000,
        position: 'top right',
      });
      return;
    }
    this.isLoading = true;

    this.service.fetch_RA_Data_log_view(this.LogID).subscribe({
      next: (res: any) => {
        if (res) {
          this.selectedData = res;
          this.isLoading = false;

          this.ViewDataPopup = true;
        } else {
          this.isLoading = false;

          notify({
            message: 'No details found for this record.',
            type: 'info',
            displayTime: 3000,
            position: 'top right',
          });
        }
      },
      error: () => {
        this.isLoading = false;
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
    this.ImportRADataFormComponent.clearData();
    this.isLoading = false;
    this.selectedInsuranceId = null;
    this.loadImportRALogDataSource();
  }
}

@NgModule({
  imports: [
    CommonModule,
    DxDataGridModule,
    DxButtonModule,
    FormPopupModule,
    DxPopupModule,
    ImportRADataPopupModule,
    DxSelectBoxModule,
    DxValidatorModule,
    DxLoadPanelModule,
  ],
  providers: [],
  exports: [],
  declarations: [ImportRADataComponent],
})
export class ImportRADataModule {}
