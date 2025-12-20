import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  NgModule,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  DxDataGridModule,
  DxButtonModule,
  DxPopupModule,
  DxDataGridComponent,
  DxValidationGroupComponent,
  DxLoadPanelModule,
  DxSelectBoxModule,
  DxDateBoxModule,
} from 'devextreme-angular';
import { FormPopupModule } from 'src/app/components';

import { DataService } from 'src/app/services';
import { ImportMasterDataFormComponent } from '../../POP-UP_PAGES/import-master-data-form/import-master-data-form.component';
import { ViewImportedMasterDataFormComponent } from '../../POP-UP_PAGES/view-imported-master-data-form/view-imported-master-data-form.component';
import {
  ImportHISDataFormModule,
  ImportHISDataFormComponent,
} from '../../POP-UP_PAGES/import-his-data/import-his-data.component';
import { DataSource } from 'devextreme/common/data';
import notify from 'devextreme/ui/notify';
import * as XLSX from 'xlsx';

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

  @ViewChild('fileInput', { static: false }) fileInput: ElementRef;

  isNewFormPopupOpened: boolean = false;
  readonly allowedPageSizes: any = [15, 25, 'all'];
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
    text: '',
    icon: 'bi bi-file-earmark-plus',
    type: 'default',
    stylingMode: 'text',
    hint: 'Import Excel Data',
    onClick: () => this.selectFile(),
    elementAttr: { class: 'add-button' },
  };

  isFilterRowVisible: boolean = false;
  columnData: any[] = [];
  isColumnsLoaded = false;
  ImportedDataSource: any;

  isLoading: boolean = false;
  insuranceList: any;
  selectedInsuranceId: any;
  downloadButtonOptions: any;
  excelColumnMismatchMessage: any;
  excelColumnMismatchMap: any;

  constructor(private service: DataService) {
    this.UserID = sessionStorage.getItem('UserID');
  }

  ngOnInit(): void {
    this.loadImportHisLogDataSource();
    this.fetch_His_Column_List();
    this.fetch_insurance_dropdown_data();
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

  // ======== column list fetching ======
  fetch_His_Column_List() {
    this.service.get_His_Data_Column_List().subscribe((res: any) => {
      if (res.flag === '1') {
        this.columnData = res.data.map((col: any) => ({
          dataField: col.ColumnName,
          caption: col.ColumnTitle,
          type: col.Type,
          format:
            col.Type === 'DECIMAL'
              ? {
                  type: 'fixedPoint',
                  precision: 3,
                }
              : undefined,
        }));
        console.log('Column DAta :>', this.columnData);
        this.isColumnsLoaded = true;
      }
    });
  }

  // ============ Load Import HIS Log DataSource ============
  loadImportHisLogDataSource() {
    this.dataSource = new DataSource<any>({
      load: () =>
        new Promise((resolve, reject) => {
          this.service.get_Importing_His_Log_List().subscribe({
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
    XLSX.writeFile(workbook, 'HIS_template.xlsx');
  }

  // ===== trigger file input =======
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

  // ============ File Selected from Excel ============
  onFileSelected(event: any) {
    const target: DataTransfer = event.target as DataTransfer;

    if (!target.files || target.files.length !== 1) {
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
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const bstr: string = e.target.result;

      const wb: XLSX.WorkBook = XLSX.read(bstr, {
        type: 'binary',
        cellDates: true,
      });

      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];

      const rawData: any[] = XLSX.utils.sheet_to_json(ws, {
        defval: '',
        raw: false,
      });

      if (!rawData.length) {
        this.isLoading = false;
        return;
      }

      const excelHeaders = Object.keys(rawData[0] || {});
      const normalizedExcelHeaders = excelHeaders.map((h) =>
        this.normalizeCaption(h)
      );

      // ================= BUILD HEADER → DATAFIELD MAP =================
      const headerToDataField: Record<string, string> = {};

      this.columnData.forEach((col: any) => {
        // PRIMARY: Caption
        headerToDataField[this.normalizeCaption(col.caption)] = col.dataField;

        // FALLBACK: Column Name
        headerToDataField[this.normalizeCaption(col.dataField)] = col.dataField;
      });

      // ================= COLUMN MISMATCH MAP =================
      this.excelColumnMismatchMap = {};
      const mismatchMessages: string[] = [];

      this.columnData.forEach((col: any, index: number) => {
        const captionKey = this.normalizeCaption(col.caption);
        const fieldKey = this.normalizeCaption(col.dataField);

        const exists =
          normalizedExcelHeaders.includes(captionKey) ||
          normalizedExcelHeaders.includes(fieldKey);

        if (!exists) {
          // 👉 Show current Excel column name (index-based fallback)
          const actualExcelColumn = excelHeaders[index] || 'Unknown Column';

          this.excelColumnMismatchMap[col.dataField] = {
            expectedCaption: col.caption,
            expectedField: col.dataField,
            actualField: actualExcelColumn,
          };

          mismatchMessages.push(`${col.caption} → Found: ${actualExcelColumn}`);
        }
      });

      this.excelColumnMismatchMessage =
        mismatchMessages.length > 0
          ? `Excel column mismatch detected:\n${mismatchMessages.join('\n')}`
          : null;

      // ================= MAP EXCEL DATA =================
      let mappedData = rawData.map((row: any) => {
        const newRow: any = {};

        Object.keys(row).forEach((excelHeader) => {
          const key = this.normalizeCaption(excelHeader);
          const dataField = headerToDataField[key];

          if (dataField) {
            newRow[dataField] = row[excelHeader];
          }
        });

        return newRow;
      });

      // ================= FORMAT FIELDS =================
      const dateFields = this.columnData
        .filter((c: any) => c.type === 'DATETIME')
        .map((c: any) => c.dataField);

      const decimalFields = this.columnData
        .filter((c: any) => c.type === 'DECIMAL' || c.type === 'NUMBER')
        .map((c: any) => c.dataField);

      mappedData = this.formatDateFields(mappedData, dateFields, decimalFields);

      this.ImportedDataSource = mappedData;

      this.isLoading = false;
      this.isNewFormPopupOpened = true;

      // 🔔 SHOW ERROR AFTER POPUP OPENS
      if (this.excelColumnMismatchMessage) {
        setTimeout(() => {
          notify({
            message: this.excelColumnMismatchMessage!,
            type: 'error',
            displayTime: 7000,
            position: { my: 'right top', at: 'right top', of: window },
          });
        },2500);
      }

      this.resetFileInput();
    };

    reader.readAsBinaryString(file);
  }

  // ============ format date fields ============
  formatDateFields(
    data: any[],
    dateFields: string[],
    decimalFields: string[] = []
  ): any[] {
    return data.map((row) => {
      const newRow = { ...row };

      dateFields.forEach((field) => {
        let value = newRow[field];
        if (!value) return;

        let dateObj: Date | null = null;

        // Case 1: Excel serial number
        if (typeof value === 'number') {
          dateObj = new Date((value - 25569) * 86400 * 1000);
        }

        // Case 2: Date object
        else if (value instanceof Date && !isNaN(value.getTime())) {
          dateObj = new Date(
            value.getFullYear(),
            value.getMonth(),
            value.getDate()
          );
        }

        // Case 3: String-based date (ALL formats)
        else if (typeof value === 'string') {
          let cleaned = value.trim();
          // Remove ordinal suffixes: 1st, 2nd, 3rd, 4th
          cleaned = cleaned.replace(/(\d+)(st|nd|rd|th)/gi, '$1');
          let parsed: Date | null = null;
          // Handle dd-MM-yyyy or dd/MM/yyyy
          if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(cleaned)) {
            const [dd, mm, yyyy] = cleaned.split(/[-/]/);
            parsed = new Date(+yyyy, +mm - 1, +dd);
          } else {
            // Fix GMT issues
            cleaned = cleaned.replace(/GMT\s*\+.*$/i, 'GMT');
            if (/GMT$/i.test(cleaned)) {
              cleaned = cleaned.replace(/GMT$/i, 'GMT+0000');
            }
            parsed = new Date(cleaned);
          }

          // FORCE OUTPUT FORMAT dd/MM/yyyy
          if (parsed && !isNaN(parsed.getTime())) {
            const day = String(parsed.getDate()).padStart(2, '0');
            const month = String(parsed.getMonth() + 1).padStart(2, '0');
            const year = parsed.getFullYear();

            newRow[field] = `${day}/${month}/${year}`;
          }
        }

        // Final formatting: dd/MM/yyyy
        if (dateObj) {
          const day = String(dateObj.getDate()).padStart(2, '0');
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const year = dateObj.getFullYear();
          newRow[field] = `${day}/${month}/${year}`;
        }
      });

      // ================= DECIMAL FIELDS =================
      decimalFields.forEach((field) => {
        newRow[field] = this.normalizeDecimal(newRow[field]);
      });

      return newRow;
    });
  }

  private normalizeCaption(value: string): string {
    return value
      ?.toString()
      .replace(/\u00A0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  // ============ normalize decimal ============
  private normalizeDecimal(value: any): number {
    if (value === null || value === undefined) return 0;

    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const cleaned = value.replace(/,/g, '').trim();
      return isNaN(Number(cleaned)) ? 0 : Number(cleaned);
    }

    return 0;
  }

  // ========= Strict dd/MM/yyyy Validator =========
  isValidDDMMYYYY(value: any): boolean {
    if (!value || typeof value !== 'string') return false;
    return /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/.test(value);
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

  // ========== clear input selector ======
  resetFileInput() {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
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
    this.resetFileInput();
    this.loadImportHisLogDataSource();
    this.fetch_His_Column_List();
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

    this.isLoading = true; //  show loading

    this.service.fetch_His_Data_log_view(id).subscribe({
      next: (res: any) => {
        if (res) {
          this.selectedData = res;
          this.isLoading = false; //  stop loading
          this.ViewDataPopup = true;
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
        this.isLoading = false; // stop loading on error
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
    this.isLoading = false;
    this.selectedInsuranceId = null;
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
    DxLoadPanelModule,
    DxSelectBoxModule,
    DxDateBoxModule,
  ],
  providers: [],
  exports: [],
  declarations: [ImportHISDataComponent],
})
export class ImportHISDataModule {}
