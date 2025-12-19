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
  DxCheckBoxModule,
  DxDataGridComponent,
  DxDataGridModule,
  DxDateBoxModule,
  DxLoadPanelModule,
  DxRadioGroupModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxValidatorModule,
} from 'devextreme-angular';
import { DataService } from 'src/app/services';
import * as XLSX from 'xlsx';
import notify from 'devextreme/ui/notify';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';

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
  @Input() mismatchedColumn: Record<
    string,
    {
      expectedCaption: string;
      expectedField: string;
      index: number;
      actualField: string;
    }
  > = {};

  readonly allowedPageSizes: any = [50, 100, 1000];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  SUBMISSION_DATE: Date = new Date();
  columnData: any[] = [];
  isChecked: boolean = false;
  isColumnsLoaded = false;
  isSaving: boolean = false;
  isLoading: boolean = false;
  insuranceList: any = [];
  isValidData: boolean = true;
  // Track invalid columns
  invalidColumns: Set<string> = new Set();
  duplicateRows: any[] = [];
  duplicateKeys: any;
  duplicateCombinations: Set<string>;
  Duplication_data: boolean = false;
  //=================manage duplication ==========
  priorities = [
    { key: 1, value: 'Skip Duplicated Data' },
    { key: 2, value: 'Overwrite (unprocessed)' },
    { key: 3, value: 'No Action' },
  ];

  mismatchedColumns: Set<string> = new Set();
  hasColumnMismatch: boolean = false;
  summaryColumnsData: any = null;
  selectedPriorityKey: number = 1;
  UniqueKeys: any[];
  mismathedTrue: boolean;
  columnDatasss: any;
  constructor(
    private dataservice: DataService,
    private masterService: MasterReportService
  ) {}

  ngOnInit(): void {
    if (this.viewData) {
      this.selectedInsurance = this.viewData.InsuranceID;

      this.dataservice.get_His_Data_Column_List().subscribe((res: any) => {
        const columnList = res.data;
        const rawData = this.viewData.import_his_data;
        // const convertedData = this.convertViewResponseKeys(rawData, columnList);
        this.buildSummaryFromData(rawData);
        this.dataSource = rawData;
      });
    }
    console.log('fetched datasource :>', this.dataSource);
    this.fetch_insurance_dropdown_data();
    this.fetch_His_Column_List();
    this.find_Unique_key();
  }

  getNumericColumns(data: any[]): string[] {
    if (!data || data.length === 0) return [];
    const numericCols: string[] = [];
    Object.keys(data[0]).forEach((key) => {
      const isPureNumberColumn = data.some((row) => {
        const val = row[key];
        return typeof val === 'number' && !isNaN(val);
      });

      if (isPureNumberColumn) {
        numericCols.push(key);
      }
    });

    return numericCols;
  }

  buildSummaryFromData(data: any[]) {
    const numericCols = this.getNumericColumns(data);
    this.summaryColumnsData = {
      totalItems: numericCols.map((col) => ({
        column: col,
        summaryType: 'sum',
        displayFormat: '{0}',
        valueFormat: {
          type: 'fixedPoint',
          precision: 3,
        },
      })),
    };
  }

  createColumnMap(columnList: any[]) {
    const map: Record<string, string> = {};
    columnList.forEach((col) => {
      map[col.ColumnName] = col.ColumnTitle;
    });
    return map;
  }

  detectMismatchedColumns() {
    this.mismatchedColumns.clear();
    this.hasColumnMismatch = false;

    if (!this.dataSource?.length || !this.columnData?.length) return;
    const excelColumns = Object.keys(this.dataSource[0]).map((c) =>
      c.trim().toLowerCase()
    );
    const hisColumns = this.columnData.map((c) =>
      c.dataField.trim().toLowerCase()
    );
    excelColumns.forEach((excelCol, index) => {
      if (!hisColumns.includes(excelCol)) {
        this.mismatchedColumns.add(Object.keys(this.dataSource[0])[index]);
      }
    });
    this.hasColumnMismatch = this.mismatchedColumns.size > 0;
    this.dataGrid?.instance.refresh();
  }

  //==================find unique Key=======================
  find_Unique_key() {
    const insuranceId = this.selectedInsurance;
    this.masterService
      .selected_Insurance_Row_Data(insuranceId)
      .subscribe((res: any) => {
        const selected_Data = res.data[0];
        this.UniqueKeys = selected_Data.uniqueKeys.filter(
          (item: any) => item.IsHisColumn === true
        );
      });
  }
  // ======== column list fetching ======
  fetch_His_Column_List() {
    this.dataservice.get_His_Data_Column_List().subscribe((res: any) => {
      if (res.flag === '1') {
        this.columnData = res.data.map((col: any) => ({
          dataField: col.ColumnTitle,
          caption: col.ColumnName,
          type: col.Type,
        }));
        this.columnDatasss = res.data.map((col: any) => ({
          dataField: col.ColumnName,
          caption: col.ColumnTitle,
          type: col.Type,
          width: 150,
          wordWrapEnabled: true,
          dataType: col.Type === 'DECIMAL' ? 'number' : 'string',

          format:
            col.Type === 'DECIMAL'
              ? {
                  type: 'fixedPoint',
                  precision: 3,
                }
              : undefined,
        }));
        this.isColumnsLoaded = true;
        this.detectMismatchedColumns();
        this.duplicated_Data();
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
  //=======================Duplicated data ==============
  duplicated_Data() {
    if (!this.viewData) {
      const userId = Number(sessionStorage.getItem('UserID')) || 0;
      const insuranceId = this.selectedInsurance || 0;
      if (!insuranceId) return;

      const titleToNameMap = this.getTitleToNameMap();

      const convertedData = (this.dataSource || []).map((row) =>
        this.mapRowForPayload(row, titleToNameMap)
      );

      const payload = {
        userId,
        insuranceId,
        BatchNo: `${insuranceId}_${Date.now()}`,
        import_his_data: convertedData,
      };
      this.dataservice
        .get_Duplicated_His_Data_List(payload)
        .subscribe((res) => this.get_duplicated_data(res));
    }
  }

  // ========== onCellPrepared validator ==========
  onCellPrepared(e: any) {
    /* ================= HEADER (MISMATCH) ================= */
    if (e.rowType === 'header' && e.column?.dataField) {
      const mismatch = this.mismatchedColumn?.[e.column.dataField];

      if (mismatch) {
        e.cellElement.style.backgroundColor = '#bd3341';
        e.cellElement.style.color = '#171717';
        e.cellElement.style.fontWeight = '600';
        e.cellElement.title =
          `Expected HIS Column:\n${mismatch.expectedCaption}\n\n` +
          `Excel Column Found:\n${mismatch.actualField}`;

        this.mismathedTrue = true;
        this.isValidData = false;
      }
      return;
    }

    /* ================= DATA VALIDATION ================= */
    if (e.rowType !== 'data') return;

    const colInfo = this.columnDatasss.find(
      (c: any) => c.dataField === e.column.dataField
    );
    if (!colInfo) return;

    // 🚫 Skip entire column if mismatch exists
    if (this.mismatchedColumn?.[colInfo.dataField]) {
      return;
    }

    const value = e.value;
    if (value === null || value === '') return;

    let isInvalid = false;
    let reason = '';

    // DATETIME validation
    if (colInfo.type === 'DATETIME' && !this.isValidDDMMYYYY(value)) {
      isInvalid = true;
      reason = 'Invalid Date format';
    }

    // DECIMAL validation
    if (colInfo.type === 'DECIMAL') {
      const rawVal = value?.toString().trim();
      if (rawVal === '' || rawVal === '-') return;

      const normalizedVal = rawVal.replace(/,/g, '');
      if (isNaN(Number(normalizedVal))) {
        isInvalid = true;
        reason = 'Invalid Decimal number';
      }
    }

    if (isInvalid) {
      this.highlightInvalidCell(e, `${reason}: "${value}"`);
      this.invalidColumns.add(colInfo.dataField);
      this.highlightColumnHeader(colInfo.dataField);
      this.isValidData = false;
    }
  }

  // ========== Strict dd/MM/yyyy format validator ==========
  isValidDDMMYYYY(value: any): boolean {
    if (!value || typeof value !== 'string') return false;
    // Allows dd/mm/yyyy or dd-mm-yyyy
    const regex = /^(0[1-9]|[12][0-9]|3[01])[\/-](0[1-9]|1[0-2])[\/-]\d{4}$/;
    return regex.test(value);
  }

  // =========== Highlight invalid cell ==========
  highlightInvalidCell(e: any, message: string) {
    e.cellElement.style.backgroundColor = '#ffcccc';
    e.cellElement.title = message;
  }

  // =========== Highlight column header ==========
  highlightColumnHeader(dataField: string) {
    setTimeout(() => {
      const headerCells = document.querySelectorAll(
        `.dx-header-row .dx-datagrid-text-content`
      );

      headerCells.forEach((headerCell: any) => {
        if (
          headerCell.innerText === dataField ||
          this.getCaptionByField(dataField) === headerCell.innerText
        ) {
          // 🚫 do not override mismatch tooltip
          if (!headerCell.title) {
            headerCell.title = 'Contains invalid data';
          }
          headerCell.style.color = '#ff9999';
          this.isValidData = false;
        }
      });
    }, 0);
  }

  // =========== Utility: get caption from columnData ==========
  getCaptionByField(field: string) {
    const col = this.columnData.find((c: any) => c.dataField === field);
    return col ? col.caption : '';
  }

  // =========== Row-level validation (prevent save) ==========
  onRowValidating(e: any) {
    const row = e.newData || e.oldData;

    e.isValid = true;
    e.errorText = '';

    this.columnData.forEach((col: any) => {
      // 🚫 Skip mismatched columns completely — ALWAYS
      if (this.mismatchedColumns?.[col.dataField]) {
        return;
      }

      const value = row[col.dataField];
      if (value === null || value === '') return;

      let isInvalid = false;

      if (col.type === 'DATETIME' && !this.isValidDDMMYYYY(value)) {
        isInvalid = true;
      }

      if (col.type === 'DECIMAL' && isNaN(Number(value))) {
        isInvalid = true;
      }

      if (isInvalid) {
        e.isValid = false;
        e.errorText = `${col.caption} has invalid value: ${value}`;
        this.invalidColumns.add(col.dataField);
        this.highlightColumnHeader(col.dataField);
      }
    });
  }

  onHeaderCellPrepared(e: any) {
    if (e.rowType !== 'header' || !e.column?.dataField) return;

    if (this.mismatchedColumns?.[e.column.dataField]) {
      this.mismathedTrue = true;
      e.cellElement.style.color = '#d32f2f';
      e.cellElement.style.fontWeight = '600';

      // Tooltip already set in onCellPrepared → do NOT override
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

  //============================get_duplicated_data=========================

  get_duplicated_data(res: any) {
    // These rows come from backend that already contain duplicates
    const duplicateRows = res.data[0].import_his_data || [];
    const isDuplicate_Value = res.IS_DUPLICATE;

    if (isDuplicate_Value == true) {
      this.Duplication_data = true;
    } else {
      this.Duplication_data = false;
    }

    this.duplicateRows = duplicateRows;

    // Create sets based on duplicate data returned from backend
    this.duplicateKeys = {
      ITEM_CODE: new Set(
        duplicateRows
          .map((row: any) => (row.ITEM_CODE ?? '').toString().trim())
          .filter((v) => v)
      ),
      INVOICE_NO: new Set(
        duplicateRows
          .map((row: any) => (row.INVOICE_NO ?? '').toString().trim())
          .filter((v) => v)
      ),
      INVOICE_DATE: new Set(
        duplicateRows
          .map((row: any) => {
            if (!row.INVOICE_DATE) return '';
            return new Date(row.INVOICE_DATE).toISOString().split('T')[0];
          })
          .filter((v) => v)
      ),
    };

    this.dataGrid.instance.refresh(); // Refresh to trigger onRowPrepared again
  }

  //========================= find the duplicated rows===============================
  onRowPrepared(e: any) {
    if (e.rowType !== 'data') return;
    const itemCode = (e.data.ITEM_CODE1 ?? '').toString().trim();
    const invoiceNo = (e.data.INVOICE_NO1 ?? '').toString().trim();
    const invoiceDate = e.data.TRANSACTION_DATE1;
    const duplicateColumns: string[] = [];

    // Compare grid cell values with duplicateKeys (from backend)
    if (this.duplicateKeys.ITEM_CODE.has(itemCode))
      duplicateColumns.push('ITEM_CODE');
    if (this.duplicateKeys.INVOICE_NO.has(invoiceNo))
      duplicateColumns.push('INVOICE_NO');
    if (this.duplicateKeys.INVOICE_DATE.has(invoiceDate))
      duplicateColumns.push('INVOICE_DATE');

    // Highlight row and add tooltip if any matches
    if (duplicateColumns.length > 0) {
      e.rowElement.style.color = '#be3f3fff'; // light red

      // e.rowElement.title = `Duplicate in: ${duplicateColumns.join(', ')}`;
      e.rowElement.title = 'Duplication Found';
    } else {
      e.rowElement.style.backgroundColor = ''; // reset
      e.rowElement.style.border = '';
      e.rowElement.title = '';
    }
  }

  getTitleToNameMap() {
    const map: any = {};
    this.columnData.forEach((col) => {
      map[col.dataField] = col.caption;
    });
    return map;
  }

  mapRowForPayload(row: any, titleToNameMap: any) {
    const apiRow: any = {};

    Object.keys(row).forEach((titleKey) => {
      const apiKey = titleToNameMap[titleKey];
      if (apiKey) {
        apiRow[apiKey] = row[titleKey];
      }
    });

    return apiRow;
  }

  // ========= main save import data ===========
  async onSaveClick() {
    if (
      !this.Duplication_data ||
      this.selectedPriorityKey == 1 ||
      this.selectedPriorityKey == 2
    ) {
      if (this.isChecked) {
        this.dataSource;
      }

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

      if (this.isValidData == false) {
        notify({
          message: `The Excel file contains invalid data. Please correct it before saving`,
          type: 'error',
          displayTime: 4000,
          position: { at: 'top right', my: 'top right', of: window },
        });
        return; // ❌ stop saving
      }

      this.isSaving = true;
      this.isLoading = true;

      try {
        const titleToNameMap = this.getTitleToNameMap();
        const allData = (this.dataSource || []).map((row) =>
          this.mapRowForPayload(row, titleToNameMap)
        );

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
            MANAGE_DUPLICATE: this.selectedPriorityKey,
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
      } finally {
        this.isSaving = false;
        this.isLoading = false;
      }
    } else {
      notify({
        message:
          'Duplicate data found. Please choose to skip or overwrite the (unprocessed) records.',
        type: 'success',
        displayTime: 4000,
        position: { at: 'top right', my: 'top right', of: window },
      });
    }
  }

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
    DxCheckBoxModule,
    DxRadioGroupModule,
  ],
  providers: [],
  declarations: [ImportHISDataFormComponent],
  exports: [ImportHISDataFormComponent],
})
export class ImportHISDataFormModule {}
