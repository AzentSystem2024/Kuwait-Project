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

  constructor(private service: DataService) {
    this.UserID = sessionStorage.getItem('UserID');
  }

  ngOnInit(): void {
    this.loadImportHisLogDataSource();
    this.fetch_His_Column_List();
    this.fetch_insurance_dropdown_data();
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
        }));
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

    this.isLoading = true;
    const file = target.files[0];
    const reader: FileReader = new FileReader();

    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, {
        type: 'binary',
        cellDates: true,
      });

      // Get first sheet
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      // Get headers
      const sheetHeaders: string[] = this.getHeaders(ws);

      // Expected headers
      const expectedHeaders: string[] = this.columnData.map(
        (c: any) => c.caption
      );

      // Validate headers
      const missingInExcel = expectedHeaders.filter(
        (h) => !sheetHeaders.includes(h)
      );
      const extraInExcel = sheetHeaders.filter(
        (h) => !expectedHeaders.includes(h)
      );

      if (missingInExcel.length > 0 || extraInExcel.length > 0) {
        this.isLoading = false;
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

      // Convert sheet to JSON
      const rawData = XLSX.utils.sheet_to_json(ws, { defval: '' });

      // Map caption -> dataField
      const captionToField: Record<string, string> = {};
      this.columnData.forEach((col: any) => {
        captionToField[col.caption] = col.dataField;
      });

      // Identify columns
      const dateColumns = sheetHeaders.filter((h) =>
        h.toLowerCase().includes('date')
      );
      const monthColumns = sheetHeaders.filter((h) =>
        h.toLowerCase().includes('month')
      );

      // Format Excel date to dd/MM/yyyy
      const formatExcelDate = (value: any): string => {
        if (!value) return '';
        let dateObj: Date | null = null;

        if (value instanceof Date) {
          dateObj = value;
        } else if (typeof value === 'number') {
          // Excel serial number
          dateObj = XLSX.SSF.parse_date_code(value)
            ? new Date(Date.UTC(1899, 11, 30 + value))
            : null;
        } else if (typeof value === 'string') {
          const parsed = new Date(value);
          dateObj = isNaN(parsed.getTime()) ? null : parsed;
        }

        if (!dateObj) return value;

        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${day}/${month}/${year}`;
      };

      // Map rows + format date/month columns
      const mappedData = rawData.map((row: any) => {
        const newRow: any = {};
        Object.keys(row).forEach((caption) => {
          const field = captionToField[caption];
          if (field) {
            let value = row[caption];

            // Month columns: preserve MMM-YY
            if (monthColumns.includes(caption)) {
              if (value instanceof Date) {
                const month = value.toLocaleString('en-US', { month: 'short' });
                const year = String(value.getFullYear()).slice(-2);
                value = `${month}-${year}`;
              }
            }
            // Date columns: convert to dd/MM/yyyy
            else if (dateColumns.includes(caption)) {
              value = formatExcelDate(value);
            }

            newRow[field] = value;
          }
        });
        return newRow;
      });

      this.ImportedDataSource = mappedData;
      this.isLoading = false;
      this.isNewFormPopupOpened = true;
      this.resetFileInput();
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
