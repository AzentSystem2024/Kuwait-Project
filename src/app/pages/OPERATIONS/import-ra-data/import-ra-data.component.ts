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
import { tap } from 'rxjs/operators';

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
  selectedInsuranceName: any;
  RaSummaryColumns: any;
  // ================= CLASS LEVEL =================
  private excelColumnMismatchMessage: string | null = null;
  excelColumnMismatchMap: {};

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

  onInsuranceChanged(e: any) {
    const insuranceId = e.value;
    this.selectedInsuranceId = insuranceId;
    const selectedInsurance = this.insuranceList.find(
      (x: any) => x.ID === insuranceId
    );
    this.selectedInsuranceName = selectedInsurance?.DESCRIPTION || '';
    // MUST subscribe
    this.fetch_RA_Column_Data_ByInsurance(insuranceId).subscribe();
  }

  //======= fetch column data ========
  fetch_RA_Column_Data_ByInsurance(insuranceId: number) {
    const payload = { InsuranceID: insuranceId };

    return this.service.get_RA_Data_Column_List(payload).pipe(
      tap((res: any) => {
        if (res.flag === '1') {
          this.columnData = res.data.map((col: any) => ({
            dataField: col.ColumnName,
            caption: col.ColumnTitle,

            // IMPORTANT FIX
            dataType: col.Type === 'DECIMAL' ? 'number' : 'string',

            type: col.Type,

            format:
              col.Type === 'DECIMAL'
                ? {
                    type: 'fixedPoint',
                    precision: 3,
                  }
                : undefined,
          }));

          this.RaSummaryColumns = this.generateSummaryColumns(res.data);
        }
      })
    );
  }

  //======= finding summary columns and summary format =======
  generateSummaryColumns(reportColumns) {
    const decimalColumns = reportColumns.filter(
      (col) => col.Type === 'DECIMAL'
    );

    const intColumns = reportColumns.filter((col) => col.Type === 'Int32');

    return {
      totalItems: [
        ...decimalColumns.map((col) =>
          this.createSummaryItem(col, false, 'sum', 'decimal')
        ),
        ...intColumns.map((col) =>
          this.createSummaryItem(col, false, 'sum', 'count')
        ),
      ],
      groupItems: [
        ...decimalColumns.map((col) =>
          this.createSummaryItem(col, true, 'sum', 'decimal')
        ),
        ...intColumns.map((col) =>
          this.createSummaryItem(col, true, 'sum', 'count')
        ),
      ],
    };
  }

  //========== summary format making ========
  createSummaryItem(col, isGroupItem = false, summaryType = 'sum', formatType) {
    return {
      column: col.ColumnName,
      summaryType: summaryType,
      displayFormat: formatType === 'count' ? '{0} ' : '{0}',
      valueFormat:
        formatType === 'decimal'
          ? {
              style: 'decimal',
              minimumFractionDigits: 3,
              maximumFractionDigits: 3,
            }
          : null,
      alignByColumn: isGroupItem,
      showInGroupFooter: isGroupItem,
    };
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

    const fileName = `${this.selectedInsuranceName}_RA_Template.xlsx`;

    const headers = this.columnData.map((c) => c.caption);
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, fileName);
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

  // ============ File Selected from Excel ============
  onFileSelected(event: any) {
    const target: DataTransfer = event.target as DataTransfer;

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
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const bstr: string = e.target.result;

      const wb: XLSX.WorkBook = XLSX.read(bstr, {
        type: 'binary',
        cellDates: true,
      });

      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];

      const rawData = XLSX.utils.sheet_to_json(ws, {
        defval: '',
        raw: false,
      });

      if (!rawData.length) {
        this.isLoading = false;
        return;
      }

      const excelCaptions = Object.keys(rawData[0] || {});
      const normalizedExcelCaptions = excelCaptions.map((c) =>
        this.normalizeCaption(c)
      );

      // ================= COLUMN MISMATCH MAP (SOURCE OF TRUTH) =================
      this.excelColumnMismatchMap = {};
      const mismatchMessages: string[] = [];

      this.columnData.forEach((col, index) => {
        const expectedCaption = col.caption;
        const expectedField = col.dataField;

        const normalizedExpected = this.normalizeCaption(expectedCaption);

        // PRIMARY: caption-based match (normalized)
        const captionExists =
          normalizedExcelCaptions.includes(normalizedExpected);

        if (!captionExists) {
          // SECONDARY: index-based fallback
          const actualCaptionAtIndex = excelCaptions[index] || 'Not Found';

          this.excelColumnMismatchMap[expectedField] = {
            expectedCaption: expectedCaption,
            expectedField: expectedField,
            index: index,
            actualField: actualCaptionAtIndex,
          };

          mismatchMessages.push(
            `${expectedCaption} → Found: ${actualCaptionAtIndex}`
          );
        }
      });

      this.excelColumnMismatchMessage =
        mismatchMessages.length > 0
          ? `Excel column mismatch detected:\n${mismatchMessages.join('\n')}`
          : null;
      // ========================================================================

      // ================= MAP EXCEL DATA (caption → dataField) =================
      let mappedData = rawData.map((row: any) => {
      const newRow: any = {};

      excelCaptions.forEach((excelCaption, excelIndex) => {
      const colDef = this.columnData[excelIndex];
        if (!colDef) return;

    const backendField = colDef.dataField;
    newRow[backendField] = row[excelCaption];
  });

  return newRow;
});


      // ================= FORMAT FIELDS =================
      const dateFields = this.columnData
        .filter((c) => c.type === 'DATETIME')
        .map((c) => c.dataField);

      const decimalFields = this.columnData
        .filter((c) => c.type === 'DECIMAL' || c.type === 'NUMBER')
        .map((c) => c.dataField);

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
        }, 0);
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
      .replace(/\u00A0/g, ' ') // non-breaking space
      .replace(/\s+/g, ' ') // collapse multiple spaces
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
      const cleaned = value.trim().replace(/,/g, '').replace(/\s+/g, '');
      if (cleaned === '' || isNaN(Number(cleaned))) {
        return 0;
      }
      return Number(cleaned);
    }

    return 0;
  }

  // ========= Strict dd/MM/yyyy Validator =========
  isValidDDMMYYYY(value: any): boolean {
    if (!value || typeof value !== 'string') return false;
    const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    return regex.test(value);
  }

  // ======== Utility function to extract headers from sheet ====
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
    const rowData = e?.row?.data;
    this.LogID = e?.row?.key?.ID;

    if (!this.LogID || !rowData) {
      notify({
        message: 'No valid record selected.',
        type: 'warning',
        displayTime: 3000,
        position: 'top right',
      });
      return;
    }

    // Resolve InsuranceID from InsuranceName
    const insuranceId = this.getInsuranceIdByName(rowData.InsuranceName);

    if (!insuranceId) {
      notify({
        message: 'Unable to resolve Insurance.',
        type: 'error',
        displayTime: 3000,
        position: 'top right',
      });
      return;
    }

    this.selectedInsuranceId = insuranceId;
    this.isLoading = true;

    // 1) Load columns + summary
    this.fetch_RA_Column_Data_ByInsurance(insuranceId).subscribe({
      next: () => {
        // 2) Load selected record data
        this.service.fetch_RA_Data_log_view(this.LogID).subscribe({
          next: (res: any) => {
            if (res) {
              this.selectedData = res;
              this.ViewDataPopup = true;
            } else {
              notify({
                message: 'No details found for this record.',
                type: 'info',
                displayTime: 3000,
                position: 'top right',
              });
            }
            this.isLoading = false;
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
      },
      error: () => {
        this.isLoading = false;
        notify({
          message: 'Failed to load column configuration.',
          type: 'error',
          displayTime: 5000,
          position: 'top right',
        });
      },
    });
  };

  private getInsuranceIdByName(name: string): number | null {
    if (!name || !this.insuranceList?.length) return null;

    const match = this.insuranceList.find(
      (x: any) => x.DESCRIPTION?.toLowerCase() === name.toLowerCase()
    );

    return match ? match.ID : null;
  }

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
