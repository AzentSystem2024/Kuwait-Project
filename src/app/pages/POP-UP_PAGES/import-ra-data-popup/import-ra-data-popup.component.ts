import { FormItemDateModule } from './../../../components/utils/form-datebox/form-datebox.component';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  EventEmitter,
  Input,
  NgModule,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  DxDataGridComponent,
  DxDataGridModule,
  DxButtonModule,
  DxSelectBoxModule,
  DxValidatorModule,
  DxTextBoxModule,
  DxLoadPanelModule,
  DxCheckBoxModule,
  DxPopupModule,
  DxTagBoxModule,
  DxDateBoxModule,
} from 'devextreme-angular';
import notify from 'devextreme/ui/notify';
import { confirm, custom } from 'devextreme/ui/dialog';
import { DataService } from 'src/app/services';
import { finalize } from 'rxjs/operators';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import { DataSource } from 'devextreme/common/data';
import { exportDataGrid } from 'devextreme/excel_exporter';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { ReportEngineService } from '../../REPORT PAGES/report-engine.service';
import { Router } from '@angular/router';
import { ProcessScreenModule } from '../../OPERATIONS/process-screen/process-screen.component';
import { ProcessScreenComponent } from '../../OPERATIONS/process-screen/process-screen.component';
@Component({
  selector: 'app-import-ra-data-popup',
  templateUrl: './import-ra-data-popup.component.html',
  styleUrl: './import-ra-data-popup.component.scss',
})
export class ImportRADataPopupComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid!: DxDataGridComponent;
  @ViewChild(ProcessScreenComponent, { static: false })
  ProcessScreenComponent!: ProcessScreenComponent;

  @ViewChild(DxDataGridComponent, { static: true })
  itemsGridRef!: DxDataGridComponent;

  @ViewChild('raGrid', { static: false }) raGrid!: DxDataGridComponent;
  @ViewChild('hisGrid', { static: false }) hisGrid!: DxDataGridComponent;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;
  @ViewChild('distributeGrid', { static: false }) distributeGrid: any;

  @Input() LogID: any = null;
  @Input() fetchedData: any = null;
  @Input() dataSource: any = null;
  @Input() columnData: any = null;
  @Input() summaryColumns: any = null;
  @Input() selectedInsuranceId: any = null;
  @Input() mismatchedColumns: {
    [dataField: string]: {
      expectedCaption: string;
      expectedField: string;
      index: number;
      actualField: string;
    };
  } = {};
  @Input() fileName: string | null = null;

  @Output() closeForm = new EventEmitter();
  @Output() handleclose = new EventEmitter();

  readonly allowedPageSizes: any = [50, 100, 1000];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;

  isSaving: boolean = false;
  gridLoading: boolean = false;

  isLoading: boolean = false;
  isLoadingManualProcess: boolean = false;
  insuranceList: any;

  autoProcess: boolean = true;
  fullcolumnsData: any;
  selectedKeys: any[] = [];
  selectedColumns: any[] = [];
  selectedFieldNames: string[] = [];
  selecteRAuniqueKeys: any;
  RA_columns: any[] = [];
  selecteHISuniqueKeys: any;
  finalHISObjects: any;
  finalRAObjects: any;
  insurance_id: any;
  editColumns: any;
  ColumnNames: any;
  statusOptions = [
    { DESCRIPTION: 'Processed', ID: 'Processed' },
    { DESCRIPTION: 'Not Processed', ID: 'Not Processed' },
    { DESCRIPTION: 'Not Found', ID: 'Not Found' },
  ];
  selectedStatus: string | null = null;

  isProcessPopupVisible: boolean = false;
  RAGridData: any;
  RAProcessPopUpColumns: any;
  HISGridData: any;
  HISProcessPopUpColumns: any;

  lastRASelection: any = null;
  skipHisLoad: boolean = false;

  // Track selection & popup state
  isRASelected = false;
  isDistributePopupVisible = false;
  selectedRARow: any = null;
  selectedDistributeRows: any[] = [];
  DistributeHISGridData: any[] = [];
  DistributeHISColumns: any[] = [];
  RA_RECEIVING_DATE: Date = new Date();
  // ===== Footer total variables =====
  totalSelected: any = 0;
  totalRASelected: any = 0;

  autoProcessPopup: boolean = false;
  InsuranceColumns: any;
  uniqueKeyData: any;
  selectedUniqueColumns: any;

  totalPendingprocessed: number = 0;
  totalProcessed: number = 0;
  manualProcess: number = 0;
  notFound: number = 0;
  totalRaItems: number = 0;
  isFilterRowVisible: boolean = false;
  hisColumns: any[] = [];
  isInvalidData: boolean = false;
  private uniqueKeyChanged = false;
  invalidColumns: Set<string> = new Set();
  selected_Insurance_id: any;
  invalidData: boolean = false;
  showGrossMismatchPopup: boolean = false;
  confirmDistribute: boolean = false;
  // Header mismatch tracker (child-component only)
  precision: any;
  invalidRows = new Set<number>();
  focusedRowKey: any = null;
  rowInvalidNumbers: number[] = [];

  private headerMismatchMap = new Map<
    string,
    { expected: string; actual: string }
  >();

  selectedRARows: any[] = [];

  selectedRAIds: number[] = [];
  selectedRAIdsString: string = '';
  selectedDistributedRARows: any[] = [];

  HisgrossAmount: any;
  RagrossAmount: any;

  isHisSelected = false;
  totalNetPayable: any;
  TotalEDI: any;
  TotalRA: any;
  MatchedTotalHis: any;
  MatchedTotalRA: any;
  ManualProcessing: any;
  selected_his_Data: any[] = [];
  combinationMatchingPopup: boolean = false;

  selectedCombinationFormat: any;
  generatedPreview: any;
  selectedSeparator: any;
  sampleRARow: any[] = [];
  sampleHISRow: any[] = [];
  selectedSeparatorHIS: any;
  generatedPreviewRA: any;
  UniquekeyGernarationPayload: any = {
    InsuranceID: 0,
    UKeys: [],
  };
  hisrows: any;
  uniqueKeyObj: any[] = [];
  displayUniqueKeys: any[] = [];
  displayTableData: any;
  allowSelectAllFlag: boolean = false;
  autoProcessPopupscreen: boolean = false;
  identifiedPercent: any = 0;
  processedPercent: any = 0;
  manualPercent: any = 0;
  notFoundPercent: any = 0;
  identifiedHis: any;
  PendignHis: any;
  User_Id: any;

  constructor(
    private dataservice: DataService,
    private mastersrvce: MasterReportService,
    private reportengine: ReportEngineService,
    private cdRef: ChangeDetectorRef,
    private router: Router,
  ) {
    this.getHisColumnsForUniqueKey();
    this.get_RA_Columns_Data();
    const systemInfo = JSON.parse(
      sessionStorage.getItem('SYSTEM_INFO') || '{}',
    );
    console.log(systemInfo);
    this.precision = systemInfo.Data.NUMBER_INFO.DECIMAL_DIGITS;
    console.log(this.precision);
    this.sessionDetails();
  }

  async ngOnInit(): Promise<void> {
    this.isLoading = true;

    try {
      await this.fetch_insurance_dropdown_data();

      if (!this.fetchedData) {
        await this.viewDetails();
      } else {
        this.applyFetchedData(this.fetchedData);
      }
      this.ColumnNames = this.columnData.map((column: any) => column.caption);
      this.fetch_all_column_and_uniqueKey_data();
      setTimeout(() => {
        this.validateAndFocusFirstInvalidRow();
      }, 0);
    } catch (error) {
      notify({
        message: 'Initialization failed.',
        type: 'error',
        displayTime: 5000,
        position: 'top right',
      });
    } finally {
      this.isLoading = false;
    }
  }

  sessionDetails() {
    const LoginResponse = JSON.parse(localStorage.getItem('userData') || '{}');
    this.User_Id = LoginResponse.USER_ID;
  }
  // ============ detailed view ==========
  private async viewDetails(): Promise<void> {
    const logid = this.LogID;
    if (!logid) {
      return;
    }
    this.isLoading = true; //  start loading
    try {
      const res: any = await this.fetchRecordDetails(logid);
      if (res) {
        this.applyFetchedData(res);
      } else {
        notify({
          message: 'No details found for this record.',
          type: 'info',
          displayTime: 3000,
          position: 'top right',
        });
      }
    } catch (error) {
      notify({
        message: 'Failed to fetch record details.',
        type: 'error',
        displayTime: 5000,
        position: 'top right',
      });
    } finally {
      this.isLoading = false; //  stop loading
    }
  }

  // ============ helper to fetch details as Promise ==========
  private fetchRecordDetails(logid: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.dataservice.fetch_RA_Data_log_view(logid).subscribe({
        next: (res: any) => resolve(res),
        error: (err) => reject(err),
      });
    });
  }

  // ============ apply common operations ==========
  private applyFetchedData(res: any): void {
    this.fetchedData = res;
    this.selectedInsuranceId = res.InsuranceID;

    this.columnData = res.columns.map((col: any) => ({
      dataField: col.ColumnName,
      caption: col.ColumnTitle,
      width: 150,
      dataType: 'DECIMAL',
      format: {
        type: 'fixedPoint',
        precision: 3,
      },
    }));
    this.ColumnNames = this.columnData.map((column: any) => column.caption);
    this.initDataSource(res);

    this.selected_Insurance_id = res.InsuranceID;

    this.totalRaItems = res.data.length;

    this.totalPendingprocessed = res.data.filter(
      (item: any) => item.Status === 'Not Processed',
    ).length;

    this.totalProcessed = res.data.filter(
      (item: any) => item.Status === 'Processed',
    ).length;

    this.get_RA_Columns_Data();
  }

  // ============ initialize DataSource ==========
  private initDataSource(data: any): void {
    this.dataSource = new DataSource<any>({
      load: () =>
        new Promise((resolveLoad, rejectLoad) => {
          if (data?.data) {
            resolveLoad(data.data);
          } else {
            rejectLoad('No data found');
          }
        }),
    });
  }

  // ========== onCellPrepared validator ==========
  onCellPrepared(e: any) {
    if (e.rowType === 'header' && e.column?.dataField) {
      const mismatch = this.mismatchedColumns?.[e.column.dataField];

      if (mismatch) {
        e.cellElement.style.backgroundColor = '#bd3341';
        e.cellElement.style.color = '#171717';
        e.cellElement.style.fontWeight = '600';
        e.cellElement.title =
          `Expected:\n${mismatch.expectedCaption} (${mismatch.expectedField})\n\n` +
          `Current Excel Column:\n${mismatch.actualField}`;

        this.invalidData = true;
      }
      return;
    }

    /* ================= DATA VALIDATION ================= */
    if (e.rowType !== 'data') return;

    const colInfo = this.columnData.find(
      (c: any) => c.dataField === e.column.dataField,
    );
    if (!colInfo) return;

    // 🚫 Skip entire column if mismatch exists
    if (this.mismatchedColumns?.[colInfo.dataField]) {
      return;
    }

    const value = e.value;
    if (value === null || value === '') return;

    let isInvalid = false;
    let reason = '';

    // DATETIME validation (all formats allowed)
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
    }
  }

  // =========== Highlight column header ==========
  highlightColumnHeader(dataField: string) {
    setTimeout(() => {
      const headerCells = document.querySelectorAll(
        `.dx-header-row .dx-datagrid-text-content`,
      );

      headerCells.forEach((headerCell: any) => {
        if (
          headerCell.innerText === dataField ||
          this.getCaptionByField(dataField) === headerCell.innerText
        ) {
          // do NOT override mismatch tooltip
          if (!headerCell.title) {
            headerCell.title = 'Contains invalid data';
          }
          headerCell.style.color = '#ff9999';
          this.invalidData = true;
        }
      });
    }, 0);
  }

  // ========== Flexible Date / DateTime Validator =======
  isValidDDMMYYYY(value: any): boolean {
    if (!value || typeof value !== 'string') return false;
    const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    return regex.test(value);
  }

  highlightInvalidCell(e: any, message: string) {
    e.cellElement.style.backgroundColor = '#ffcccc';
    e.cellElement.title = message;
  }

  // =========== Utility: get caption from columnData =========
  getCaptionByField(field: string) {
    const col = this.columnData.find((c: any) => c.dataField === field);
    return col ? col.caption : '';
  }

  // =========== Row-level validation (prevent save) ==========
  onRowValidating(e: any) {
    const row = e.newData || e.oldData;

    this.columnData.forEach((col: any) => {
      const value = row[col.dataField];

      // Skip empty/null values
      if (value === null || value === '') return;

      let isInvalid = false;
      let reason = '';

      // DATETIME validation
      if (col.type === 'DATETIME' && !this.isValidDDMMYYYY(value)) {
        isInvalid = true;
        reason = `Invalid Date: "${value}"`;
      }

      // DECIMAL validation
      if (col.type === 'DECIMAL' && isNaN(Number(value))) {
        isInvalid = true;
        reason = `Invalid Decimal: "${value}"`;
      }

      if (isInvalid) {
        e.isValid = false;
        e.errorText = `${col.caption} has invalid value: ${value}`;
        this.invalidColumns.add(col.dataField);
        this.highlightColumnHeader(col.dataField);
      }
    });
  }

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  // ============= hide popup ===========
  handlePopupHidden(): void {
    if (this.fetchedData) {
      this.viewDetails();
    } else {
      this.close();
    }
  }

  // ========= fetch ra columns and unique key of selected data ========
  fetch_all_column_and_uniqueKey_data() {
    const insuranceId = this.selectedInsuranceId;
    if (insuranceId) {
      this.mastersrvce.selected_Insurance_Row_Data(insuranceId).subscribe({
        next: (res: any) => {
          if (res && res.flag === '1') {
            this.InsuranceColumns = res.data[0].columns.filter(
              (col: any) => col.HisMatched === true,
            );

            const uniqueKeyhis = res.data[0].uniqueKeys;

            this.uniqueKeyData = res.data[0].uniqueKeys;
            // set selected values (array of ColumnID from uniqueKeyData)
            this.selectedUniqueColumns = this.uniqueKeyData.map(
              (u: any) => u.ColumnID,
            );

            this.selecteRAuniqueKeys = uniqueKeyhis
              .filter((item: any) => item.IsHisColumn === false)
              .map((item: any) => item.ColumnID);

            this.selecteHISuniqueKeys = uniqueKeyhis
              .filter((item: any) => item.IsHisColumn === true)
              .map((item: any) => item.ColumnID);

            this.displayUniqueKeys = res.data[0].uniqueKeys;
            this.prepareDisplayLevels(this.displayUniqueKeys);

            // this.selecteHISuniqueKeys=this.
          } else {
            notify(
              res.message || 'Failed to fetch insurance details',
              'error',
              3000,
            );
          }
        },
        error: (err) => {
          notify('Something went wrong while fetching row data', 'error', 3000);
        },
      });
    }
  }

  // ======== get_insurance_dropdown ========
  fetch_insurance_dropdown_data(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.dataservice.Get_GropDown('INSURANCE').subscribe({
        next: (res: any) => {
          this.insuranceList = res;
          resolve(res);
        },
        error: (err) => reject(err),
      });
    });
  }

  //======== date format conversion =========
  formatDateToDDMMYY(date: Date): string {
    if (!date) return '';

    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());

    return `${dd}/${mm}/${yyyy}`;
  }

  async onSaveClick() {
    const userId = Number(sessionStorage.getItem('UserID')) || 0;
    const insuranceId = this.selectedInsuranceId || 0;
    this.selected_Insurance_id = insuranceId;

    // -------- Insurance validation --------
    if (!insuranceId || insuranceId === 0) {
      notify({
        message: 'Please select an Insurance before saving.',
        type: 'error',
        displayTime: 3000,
        position: { at: 'top right', my: 'top right', of: window },
      });
      return;
    }

    this.isLoading = true;
    this.isSaving = true;

    try {
      // -------- Read full datasource --------
      const allData = (this.dataSource || []).map((item: any) => ({ ...item }));

      // -------- No data check --------
      if (allData.length === 0) {
        notify({
          message: 'No data available to save.',
          type: 'warning',
          displayTime: 3000,
          position: { at: 'top right', my: 'top right', of: window },
        });
        this.isLoading = false;
        this.isSaving = false;
        return;
      }

      // -------- SAVE-TIME VALIDATION --------
      const invalidRows: number[] = [];

      allData.forEach((row: any, index: any) => {
        // Excel row number (assumes header row exists)
        const excelRowNo = row.__excelRowNo ?? index + 2;

        this.columnData.forEach((col: any) => {
          const value = row[col.dataField];

          if (value === null || value === '') return;

          // DATETIME validation
          if (col.type === 'DATETIME' && !this.isValidDDMMYYYY(value)) {
            invalidRows.push(excelRowNo);
          }

          // DECIMAL validation
          if (
            col.type === 'DECIMAL' &&
            isNaN(Number(value.toString().replace(/,/g, '')))
          ) {
            invalidRows.push(excelRowNo);
          }
        });
      });

      // -------- If invalid rows found → STOP SAVE --------
      const uniqueInvalidRows = [...new Set(invalidRows)].sort((a, b) => a - b);

      if (uniqueInvalidRows.length > 0) {
        const rowText =
          uniqueInvalidRows.length > 10
            ? uniqueInvalidRows.slice(0, 10).join(', ') + '...'
            : uniqueInvalidRows.join(', ');

        notify({
          message:
            `Cannot save Excel.\n\n` +
            `Invalid data found at row(s): ${rowText}`,
          type: 'error',
          displayTime: 6000,
          position: { at: 'top right', my: 'top right', of: window },
        });

        this.isLoading = false;
        this.isSaving = false;
        return; // STOP HERE
      }

      if (this.invalidData) {
        notify({
          message:
            'The Excel file contains invalid data. Please correct it before saving.',
          type: 'error',
          displayTime: 4000,
          position: { at: 'top right', my: 'top right', of: window },
        });
        this.isLoading = false;
        this.isSaving = false;
        return;
      }

      // -------- Batch save logic --------
      const batchSize = 15000;
      const totalRecords = allData.length;
      const datetime = new Date().toISOString().replace(/[-:.TZ]/g, '');
      const commonBatchId = `${insuranceId}_${datetime}`;
      const totalBatches = Math.ceil(totalRecords / batchSize);

      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, totalRecords);
        const currentBatch = allData.slice(start, end);

        const payload = {
          USerID: userId,
          InsuranceID: insuranceId,
          IsAutoProcessed: false,
          BatchNo: commonBatchId,
          FileName: this.fileName ?? '',
          import_ra_data: currentBatch,
        };

        const res: any = await this.dataservice
          .Import_RA_Data(payload)
          .toPromise();

        if (res?.flag === '1') {
          this.LogID = res.LogID;
          notify({
            message: `Batch ${i + 1}/${totalBatches} imported successfully!`,
            type: 'success',
            displayTime: 2000,
            position: { at: 'top right', my: 'top right', of: window },
          });
        } else {
          throw new Error(res?.message || `Batch ${i + 1} import failed`);
        }
      }

      // -------- Final success --------
      notify({
        message: 'All batches imported successfully!',
        type: 'success',
        displayTime: 4000,
        position: { at: 'top right', my: 'top right', of: window },
      });

      if (this.autoProcess) {
        this.get_RA_Columns_Data();
        this.totalRaItems = this.dataSource.length;
        // this.autoProcessPopup = true;
      } else {
        this.close();
      }
    } catch (error) {
      this.handleError(error);
    } finally {
      this.isLoading = false;
      this.isSaving = false;
    }
  }

  //==================porcessing popup autoprocess is checked
  onAutoProcessChanged(e: any) {
    this.autoProcess = e.value;
  }

  convertToYYYYMMDD(value: any): string | null {
    if (!value) return null;
    // Case 1: dd/MM/yyyy or dd-MM-yyyy
    if (typeof value === 'string') {
      const parts = value.split(/[\/-]/);
      if (parts.length === 3) {
        const [dd, mm, yyyy] = parts;
        if (dd && mm && yyyy) {
          return `${yyyy}/${mm.padStart(2, '0')}/${dd.padStart(2, '0')}`;
        }
      }
    }

    // Case 2: Date object
    if (value instanceof Date) {
      const yyyy = value.getFullYear();
      const mm = String(value.getMonth() + 1).padStart(2, '0');
      const dd = String(value.getDate()).padStart(2, '0');
      return `${yyyy}/${mm}/${dd}`;
    }

    // If string dd/MM/yyyy or dd-MM-yyyy
    if (typeof value === 'string') {
      const parts = value.includes('/') ? value.split('/') : value.split('-');

      if (parts.length === 3) {
        const [dd, mm, yyyy] = parts;
        return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
      }
    }

    return null;
  }

  // ========== Error notifications =======
  handleError(error: any) {
    if (error.status === 0) {
      notify(
        {
          message:
            'Network error: Please check your internet connection and try again.',
          position: { at: 'top right', my: 'top right' },
          displayTime: 1000,
        },
        'error',
      );
    } else if (error.status === 500) {
      notify(
        {
          message:
            'Server error: Unable to process the request right now. Please try again later.',
          position: { at: 'top right', my: 'top right' },
          displayTime: 1000,
        },
        'error',
      );
    } else {
      notify(
        {
          message: 'Failed to import data. Please try again.',
          position: { at: 'top right', my: 'top right' },
          displayTime: 1000,
        },
        'error',
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
    this.fetchedData = null;
  }

  close() {
    this.clearData();
    this.isLoading = false;
    this.closeForm.emit();
  }

  handleExporting(e: any): void {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');

    exportDataGrid({
      component: e.component,
      worksheet: worksheet,
      autoFilterEnabled: true,
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(
          new Blob([buffer], { type: 'application/octet-stream' }),
          'RA Data Export.xlsx',
        );
      });
    });
    e.cancel = true;
  }

  // =============================== process popup codes =========
  onStatusChange(e: any) {
    const statusValue = e.value;
    if (this.dataGrid && statusValue) {
      this.dataGrid.instance.filter(['Status', '=', statusValue]);
    } else {
      this.dataGrid.instance.clearFilter();
    }
  }

  // ========== Watch for unique key changes ==========
  onUniqueKeyChange(event: any) {
    this.selectedUniqueColumns = event.value;
    this.uniqueKeyChanged = true;
  }

  // ======== change unique key and process data =============
  onChangeAndProcess(): Promise<void> {
    return new Promise((resolve) => {
      const insurance = this.selectedInsuranceId;
      const logId = this.fetchedData?.ID || this.LogID;
      const payload = {
        InsuranceID: insurance,
        LogID: 0,
        RA_UNIQUE_KEY: this.selecteRAuniqueKeys.join(','),
        HIS_UNIQUE_KEY: this.selecteHISuniqueKeys.join(','),
      };

      this.isLoadingManualProcess = true;
      this.dataservice
        .manual_ReProcess_RA_Data(payload)
        .subscribe((res: any) => {
          this.isLoadingManualProcess = false;

          if (res && res.flag === '1') {
            this.TotalRA = res.TotalRA;
            this.MatchedTotalHis = res.MatchedTotalHis;
            this.MatchedTotalRA = res.MatchedTotalRA;
            this.ManualProcessing = res.ManualProcessing;
            this.TotalEDI = res.TotalEDI;
          } else {
            this.totalProcessed = 0;
            this.totalPendingprocessed = 0;
            this.manualProcess = 0;
            this.notFound = 0;
          }

          this.uniqueKeyChanged = false;
          resolve();
        });
    });
  }

  ProcessedCount(): Promise<void> {
    return new Promise((resolve) => {
      const insurance = this.selectedInsuranceId;
      const logId = this.fetchedData?.ID || this.LogID;
      const payload = {
        InsuranceID: insurance,
        LogID: logId,
      };

      this.isLoadingManualProcess = true;
      this.dataservice.RA_Data_Process_count(payload).subscribe((res: any) => {
        this.isLoadingManualProcess = false;

        if (res && res.flag === '1') {
          this.totalProcessed = res.TotalProcessed;
          this.totalPendingprocessed = res.PendingProcess;
          this.manualProcess = res.ManualProcess;
          this.notFound = res.NotFound;
        } else {
          this.totalProcessed = 0;
          this.totalPendingprocessed = 0;
          this.manualProcess = 0;
          this.notFound = 0;
        }

        resolve();
      });
    });
  }

  // =========== process popup open and data fetching =============
  async onProcessClick() {
    if (this.uniqueKeyChanged) {
      await this.onChangeAndProcess();
    }

    const insurance = this.selectedInsuranceId;
    const logId = this.fetchedData?.ID || this.LogID;

    const payload = {
      InsuranceID: insurance,
      LogID: logId,
    };

    this.isLoading = true;

    this.dataservice.fetch_HIS_Process_Data_list(payload).subscribe({
      next: (response: any) => {
        if (response.flag === '1') {
          this.HISProcessPopUpColumns = response.columns.map((col: any) => ({
            dataField: col.ColumnName,
            caption: col.ColumnTitle,
            minWidth: 100,
            maxWidth: 250,
            dataType: 'DECIMAL',
            format: {
              type: 'fixedPoint',
              precision: 3,
            },
          }));

          this.HISGridData = response.data;

          if (this.hisGrid?.instance) {
            this.hisGrid.instance.clearSelection();
            this.hisGrid.instance.option('focusedRowIndex', -1);
          }

          if (this.raGrid?.instance) {
            this.raGrid.instance.clearSelection();
            this.raGrid.instance.option('focusedRowIndex', -1);
          }

          this.isDistributePopupVisible = true;
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  onHISRowSelected(e: any) {
    if (!e.selectedRowKeys || e.selectedRowKeys.length === 0) {
      this.isHisSelected = false;
      return;
    }

    //  something selected → enable
    this.isHisSelected = true;

    // Allow only one selection at a time
    if (e.selectedRowKeys.length > 1) {
      const lastSelectedKey = e.selectedRowKeys[e.selectedRowKeys.length - 1];
      e.component.selectRows([lastSelectedKey], false);
    }

    const selectedRow = e.selectedRowsData[e.selectedRowsData.length - 1];
    if (!selectedRow) return;

    this.lastRASelection = selectedRow;

    const payload = {
      UniqueKey: selectedRow.UNIQUE_KEY,
      InsuranceID: this.selectedInsuranceId,
    };

    this.RAGridData = [];

    this.dataservice.fetch_RA_Process_Data_list(payload).subscribe({
      next: (response: any) => {
        if (response.flag === '1') {
          // this.isRASelected = true;
          this.RAGridData = response.data;
          this.RAProcessPopUpColumns = response.columns.map((col: any) => ({
            dataField: col.ColumnName,
            caption: col.ColumnTitle,
            minWidth: 100,
            maxWidth: 150,
            dataType: 'DECIMAL',
            format: {
              type: 'fixedPoint',
              precision: 3,
            },
          }));

          setTimeout(() => {
            const raGrid = this.raGrid?.instance;
            if (raGrid && this.RAGridData?.length) {
              const match = this.RAGridData.find(
                (row: any) =>
                  row.UNIQUE_KEY === selectedRow.UNIQUE_KEY &&
                  row.GROSS_CLAIMED === selectedRow.GROSS_CLAIMED,
              );

              const focusKey = match ? match.ID : this.RAGridData[0].ID;

              if (focusKey) {
                raGrid.option('focusedRowKey', null); // reset
                setTimeout(() => {
                  raGrid.option('focusedRowEnabled', true);
                  raGrid.option('focusedRowKey', focusKey);
                  raGrid.navigateToRow(focusKey);
                }, 50);
              }
            }
          }, 200);
        }
      },
      error: () => {
        // handle error
      },
    });
  }

  // ========HIS data row selection event =======
  onRADataRowSelected(e: any) {
    //  nothing selected → disable
    if (!e.selectedRowKeys || e.selectedRowKeys.length === 0) {
      this.isRASelected = false;
      return;
    }

    //  something selected → enable
    this.isRASelected = true;

    if (e.selectedRowKeys.length > 1) {
      const lastKey = e.selectedRowKeys[e.selectedRowKeys.length - 1];
      e.component.selectRows([lastKey], false);
    }
  }

  // ============== only allow to edit selected rows ==========
  isRowSelected(row: any): boolean {
    return this.selectedDistributeRows?.some((r) => r.ID === row.ID) || false;
  }

  distributeRA = async () => {
    this.isLoadingManualProcess = true;
    // this.onChangeAndProcess();

    try {
      this.isLoading = true;

      const payload = {
        InsuranceID: this.selectedInsuranceId,
        LogID: this.fetchedData?.ID || this.LogID,
        USER_ID: this.User_Id,
      };

      //  Await API to prevent UI blocking
      const response: any = await this.dataservice
        .fetch_HIS_Process_Data_list(payload)
        .toPromise();

      if (response.flag !== '1') return;
      this.isLoadingManualProcess = false;
      this.isDistributePopupVisible = true;

      //  Build HIS Columns (same logic)
      this.HISProcessPopUpColumns = response.columns.map((col: any) => ({
        dataField: col.ColumnName,
        caption: col.ColumnTitle,
        minWidth: 100,
        maxWidth: 250,
        dataType: 'DECIMAL',
        format: { type: 'fixedPoint', precision: 3 },
      }));

      //  Set Grid Data
      this.HISGridData = response.data;

      //  Build Distribute Grid Data (same)
      this.DistributeHISGridData = this.HISGridData.map((row: any) => ({
        ...row,
        NetPayable: null,
      }));

      //  Reset selection once
      this.selectedDistributeRows = [];

      //  Build Columns once (no logic change)
      this.DistributeHISColumns = [
        { type: 'selection', fixed: true, fixedPosition: 'left' },

        ...this.HISProcessPopUpColumns.map((col: any) => ({
          ...col,
          allowEditing: false,
        })),

        {
          dataField: 'OverBillingAmount',
          caption: 'Over Billing',
          dataType: 'number',
          allowEditing: (r: any) => this.isRowSelected(r),
          format: '#,##0.000',
        },

        {
          dataField: 'AuditingRejectedAmount',
          caption: 'Audit Rejected',
          dataType: 'number',
          allowEditing: (r: any) => this.isRowSelected(r),
          format: '#,##0.000',
        },

        {
          dataField: 'Co-PayandDeductible',
          caption: 'Co-pay & Deduction',
          dataType: 'number',
          allowEditing: (r: any) => this.isRowSelected(r),
          format: '#,##0.000',
        },

        {
          dataField: 'NetPayable',
          caption: 'Net Payable',
          dataType: 'number',
          format: '#,##0.000',
          allowEditing: false,
          calculateCellValue: (rowData: any) => {
            if (
              !this.selectedDistributeRows?.some((r) => r.ID === rowData.ID)
            ) {
              return null;
            }

            const claimed = Number(rowData.NET_AMOUNT1) || 0;
            const rejected = Number(rowData.AuditingRejectedAmount) || 0;
            const copay = Number(rowData['Co-PayandDeductible']) || 0;

            // console.log(claimed - rejected - copay);
            return claimed - rejected - copay;
          },
        },
      ];

      //  Reset grids (same behavior, but done once)
      this.hisGrid?.instance?.clearSelection();
      this.raGrid?.instance?.clearSelection();

      this.hisGrid?.instance?.option('focusedRowIndex', -1);
      this.raGrid?.instance?.option('focusedRowIndex', -1);

      //  Keep your logic
      const uniqueKey = this.lastRASelection.UNIQUE_KEY;
      this.selectedRARow = this.selectedRARows?.[0];
    } catch (err) {
      console.error('distributeRA error:', err);
    } finally {
      this.isLoading = false;
    }
  };

  onDistributeRASelectionChanged(e: any) {
    const rows = e.selectedRowsData || [];

    this.selectedDistributedRARows = rows;

    this.totalRASelected = rows.length;

    this.selectedRAIds = rows.map((r: any) => r.ID);

    //  "1,2,3,4,5" format
    this.selectedRAIdsString = this.selectedRAIds.join(',');

    console.log('Selected RA IDs array:', this.selectedRAIds);
    console.log('Selected RA IDs string:', this.selectedRAIdsString);
  }

  // ========== distribute RA his grid selection change event =====
  onDistributeSelectionChanged(e: any) {
    // console.log(e, '---------------------event data-------------------');

    console.log(e, '---------------------event data-------------------');

    const selectedRows = e.selectedRowsData || [];
    this.selectedDistributeRows = e.selectedRowsData || [];
    if (!selectedRows.length) {
      this.selectedDistributeRows = [];
      this.totalSelected = 0;
      this.RAGridData = [];
      return;
    }

    const latestRow = selectedRows[selectedRows.length - 1];
    const latestKey = latestRow.UNIQUE_KEY;

    //  Keep only rows with same UNIQUE_KEY
    const sameKeyRows = selectedRows.filter(
      (row: any) => row.UNIQUE_KEY === latestKey,
    );

    // ❗ If mixed UNIQUE_KEY detected → reset to only latest group
    if (sameKeyRows.length !== selectedRows.length) {
      e.component.clearSelection();
      e.component.selectRows(
        sameKeyRows.map((r: any) => r.ID),
        false,
      );
    }

    //  Update selected rows state
    this.selectedDistributeRows = sameKeyRows;
    this.totalSelected = sameKeyRows.length;

    //  Update NetPayable only for selected rows
    this.DistributeHISGridData.forEach((row) => {
      row.NetPayable = this.selectedDistributeRows.some((r) => r.ID === row.ID)
        ? Number(row.NET_AMOUNT1) || 0
        : null;
    });

    //  Continue your existing logic
    const selectedRow = latestRow;
    this.lastRASelection = selectedRow;

    const payload = {
      UniqueKey: selectedRow.UNIQUE_KEY,
      InsuranceID: this.selectedInsuranceId,
    };

    this.dataservice.fetch_RA_Process_Data_list(payload).subscribe({
      next: (response: any) => {
        if (response.flag === '1') {
          // this.isRASelected = true;
          this.RAGridData = response.data;
          this.RAProcessPopUpColumns = response.columns.map((col: any) => ({
            dataField: col.ColumnName,
            caption: col.ColumnTitle,
            minWidth: 100,
            maxWidth: 150,
            dataType: 'DECIMAL',
            format: {
              type: 'fixedPoint',
              precision: 3,
            },
          }));

          setTimeout(() => {
            const raGrid = this.raGrid?.instance;
            if (raGrid && this.RAGridData?.length) {
              const match = this.RAGridData.find(
                (row: any) =>
                  row.UNIQUE_KEY === selectedRow.UNIQUE_KEY &&
                  row.GROSS_CLAIMED === selectedRow.GROSS_CLAIMED,
              );

              const focusKey = match ? match.ID : this.RAGridData[0].ID;

              if (focusKey) {
                raGrid.option('focusedRowKey', null); // reset
                setTimeout(() => {
                  raGrid.option('focusedRowEnabled', true);
                  raGrid.option('focusedRowKey', focusKey);
                  raGrid.navigateToRow(focusKey);
                }, 50);
              }
            }
          }, 200);
        }
      },
      error: () => {
        // handle error
      },
    });

    e.component.refresh(true);
  }

  //====================Find the column location from the datagrid================
  findColumnLocation = (e: any) => {
    const columnName = e.itemData;
    if (columnName != '' && columnName != null) {
      this.reportengine.makeColumnVisible(this.dataGrid, columnName);
    }
  };
  // ====== Calculate totals using only selected rows ======
  getSelectedTotal(field: string): string {
    if (!this.selectedDistributeRows?.length) return '0.000';
    const total = this.selectedDistributeRows.reduce((sum, row) => {
      return sum + (Number(row[field]) || 0);
    }, 0);
    return total.toFixed(3);
  }

  getSelectedRATotal(field: string): string {
    if (!this.selectedDistributedRARows?.length) return '0.000';
    const total = this.selectedDistributedRARows.reduce((sum, row) => {
      return sum + (Number(row[field]) || 0);
    }, 0);
    return total.toFixed(3);
  }
  // ========== get summary Amount ==========
  getSummaryAmount(column: string): string {
    if (!this.distributeGrid?.instance) return '0.000';
    const summaryValue =
      this.distributeGrid.instance.getTotalSummaryValue(column);
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(summaryValue || 0);
  }

  // ====== Block editing for unselected rows ======
  ondistributionHISgridEditingStart(e: any) {
    const row = e.data;
    console.log(e);
    if (!this.isRowSelected(row)) {
      e.cancel = true;
    }
  }

  updateNetPayableSummary() {
    if (!this.distributeGrid?.instance) return;
    this.checkAllowSelectAllFromGrid();

    const summary =
      this.distributeGrid.instance.getTotalSummaryValue('NetPayable');

    this.totalNetPayable = Number(summary || 0);

    console.log('NetPayable Summary:', this.totalNetPayable);
  }
  // ==== Recalculate NetPayable after edits ========
  updateFooterTotals() {
    this.DistributeHISGridData = this.DistributeHISGridData.map((row) => {
      if (this.isRowSelected(row)) {
        const gross = Number(row.GROSS_CLAIMED) || 0;
        const rejected = Number(row.AuditingRejectedAmount) || 0;
        const copay = Number(row['Co-PayandDeductible']) || 0;
        const limit = Number(row.ExceedingLimit) || 0;
        const discount = Number(row.DiscountAmount) || 0;

        return {
          ...row,
          NetPayable: gross - rejected - copay - limit - discount,
        };
      }
      return { ...row, NetPayable: null }; // empty if not selected
    });
  }

  clearDistributePopup() {
    this.selectedRARow = null;
    this.DistributeHISGridData = [];
    this.DistributeHISColumns = [];
    this.totalSelected = 0;
    this.selectedDistributeRows = [];
    this.isDistributePopupVisible = false;
    this.autoProcessPopup = true;
    this.RAGridData = [];
    // this.viewDetails();
    this.get_EDI_Data_Status();
  }

  // ====== on click of RA distribute process button ====
  async onSubmitDistributeRA() {
    if (!this.selectedDistributeRows?.length) {
      notify(
        'Please select at least one row before distributing.',
        'warning',
        3000,
      );
      return;
    }

    if (!this.selectedDistributedRARows?.length) {
      notify(
        'Please select at least one row before distributing.',
        'warning',
        3000,
      );
      return;
    }

    const selectedClaimvalues = this.transformPayload(
      this.selectedDistributeRows,
    );
    const totalHISGrossClaimed = this.getSelectedTotal('GROSS_CLAIMED');
    const HisgrossAmount = Number(totalHISGrossClaimed).toFixed(3);
    // const RaGrossAmount = this.selectedRARow.GROSS_CLAIMED.toFixed(3);
    const totalRAGrossClaimed = this.getSelectedRATotal('GROSS_CLAIMED');
    const RaGrossAmount = Number(totalRAGrossClaimed).toFixed(3);

    this.HisgrossAmount = HisgrossAmount;
    this.RagrossAmount = RaGrossAmount;

    const hisRejected =
      Number(this.getSelectedTotal('AuditingRejectedAmount')) || 0;
    const raRejected = Number(this.getSelectedRATotal('REJECTED_AMOUNT')) || 0;

    const hisNetPayable = this.DistributeHISGridData.filter((row) =>
      this.isRowSelected(row),
    ).reduce((sum, row) => {
      const claimed = Number(row.NET_AMOUNT1) || 0;
      const rejected = Number(row.AuditingRejectedAmount) || 0;
      const copay = Number(row['Co-PayandDeductible']) || 0;

      return sum + (claimed - rejected - copay);
    }, 0);

    const raNetPayable = Number(this.getSelectedRATotal('NET_PAYABLE')) || 0;

    const rejectedMismatch = hisRejected.toFixed(3) !== raRejected.toFixed(3);

    const netPayableMismatch =
      hisNetPayable.toFixed(3) !== raNetPayable.toFixed(3);

    if ((rejectedMismatch || netPayableMismatch) && !this.confirmDistribute) {
      let message = '';

      if (rejectedMismatch) {
        message += `
      <b style="display:inline-block; min-width:200px;">Rejected Amount</b><br/>
      Claim: ${hisRejected.toFixed(3)}<br/>
      RA: ${raRejected.toFixed(3)}<br/><br/>
    `;
        //     message += `
        //   <b style="display:inline-block; min-width:200px;">Net Payable Amount</b><br/>
        //   Claim: ${hisNetPayable.toFixed(3)}<br/>
        //   RA: ${raNetPayable.toFixed(3)}<br/><br/>
        // `;
      }

      if (netPayableMismatch) {
        message += `
      <b style="display:inline-block; min-width:200px;">Net Payable Amount</b><br/>
      Claim: ${hisNetPayable.toFixed(3)}<br/>
      RA: ${raNetPayable.toFixed(3)}<br/><br/>
    `;
        //     message += `
        //   <b style="display:inline-block; min-width:200px;">Rejected Amount</b><br/>
        //   Claim: ${hisRejected.toFixed(3)}<br/>
        //   RA: ${raRejected.toFixed(3)}<br/><br/>
        // `;
      }

      message += `Do you want to continue?`;

      const result = await custom({
        title: '⚠ Amount Mismatch',
        messageHtml: message,
        buttons: [
          {
            text: 'Cancel',
            type: 'danger',
            stylingMode: 'contained',
            onClick: () => false,
          },
          {
            text: 'Continue',
            type: 'default',
            stylingMode: 'contained',
            onClick: () => true,
          },
        ],
      }).show();

      if (!result) {
        return; //  stop submit
      }

      this.confirmDistribute = true; //  allow next run
    }

    // this.isLoadingManualProcess = true;
    const payload = {
      RA_IDS: this.selectedRAIdsString,
      distributed_data: this.transformPayload(this.selectedDistributeRows),
    };
    this.selected_his_Data = this.transformPayload(this.selectedDistributeRows);
    console.log(
      this.selected_his_Data,
      '-----------------selected his data-------------------',
    );
    console.log(
      this.DistributeHISGridData,
      '====================DistributeHISGridData===================',
    );
    // if (HisgrossAmount !== RaGrossAmount && !this.confirmDistribute) {
    //   // this.showGrossMismatchPopup = true;
    //   this.isLoadingManualProcess = false;
    //   return;
    // }

    this.confirmDistribute = false;
    // this.showGrossMismatchPopup = false;
    this.isLoadingManualProcess = true;

    this.dataservice.submit_RA_Distribution_Data(payload).subscribe({
      next: (res: any) => {
        if (res.flag === '1') {
          this.isLoadingManualProcess = false;
          notify(
            res.message || 'RA distribution completed successfully',
            'success',
            3000,
          );

          // Reset UI state
          this.selectedDistributeRows = [];
          this.distributeGrid?.instance.refresh();
          this.RAGridData = [];
          // const selectedHisIDs = this.selected_his_Data.map(
          //   (x: any) => x.hisID,
          // );
          // this.DistributeHISGridData = this.DistributeHISGridData.filter(
          //   (h: any) => !selectedHisIDs.includes(h.hisID),
          // );

          // this.clearDistributePopup();
          this.distributeRA();
          // this.onProcessClick();
        } else {
          notify(
            res.message || 'Failed to process RA distribution',
            'error',
            3000,
          );
        }
      },
      error: (err) => {
        notify('Server error while distributing RA', 'error', 4000);
      },
    });
  }

  // ====== Transform rows into distribution payload ======
  private transformPayload(rows: any[]): any[] {
    return rows.map((item: any) => ({
      hisID: item.ID,
      GROSS_RA: item.GROSS_CLAIMED ?? 0,
      OB_RA: item.OverBillingAmount ?? 0,
      REJECTED_RA: item.AuditingRejectedAmount ?? 0,
      COPAY_RA: item['Co-PayandDeductible'] ?? 0,
      LIMIT_RA: item.EXCEEDING_LIMIT ?? 0,
      DISCOUNT_RA: item.DISCOUNT ?? 0,
      NET_RA: item.NetPayable ?? 0,
      REJECTION_NOTE: this.selectedRARow?.RejectionNote || '',
    }));
  }

  // =============== Submit Process ===========
  async onSubmitProcess(autoProcessNext: boolean = false) {
    const raSelected = this.raGrid?.instance.getSelectedRowsData() || [];
    const hisSelected = this.hisGrid?.instance.getSelectedRowsData() || [];

    const raRow = raSelected.length ? raSelected[0] : null;
    const hisRow = hisSelected.length ? hisSelected[0] : null;

    const payload = {
      RaID: raRow ? raRow.ID : null,
      HisID: hisRow ? hisRow.ID : null,
    };

    if (!payload.RaID || !payload.HisID) {
      notify(
        {
          message: 'Please select a row in both grids before submitting.',
          type: 'warning',
          displayTime: 3000,
        },
        { position: 'top right' },
      );
      return;
    }

    // Ask confirmation only if GrossAmount differs AND not auto-processing
    if (
      !autoProcessNext &&
      raRow &&
      hisRow &&
      raRow.GROSS_CLAIMED !== hisRow.GROSS_CLAIMED
    ) {
      const dialog = custom({
        title: 'Confirmation',
        messageHtml: `
        <div style="width:400px; height:150px; font-size:14px; text-align:center; padding:15px; box-sizing:border-box;">
          <b>Gross Amounts are different</b><br><br>
          <div style="margin-bottom:8px;">RA: ${raRow.GROSS_CLAIMED}</div>
          <div style="margin-bottom:8px;">HIS: ${hisRow.GROSS_CLAIMED}</div>
          <div>Do you still want to process?</div>
        </div>
      `,
        buttons: [
          {
            text: 'No',
            type: 'normal',
            stylingMode: 'outlined',
            onClick: () => false,
          },
          {
            text: 'Yes',
            type: 'default',
            stylingMode: 'contained',
            onClick: () => true,
          },
        ],
      });

      const result = await dialog.show();
      if (!result) return;
    }

    this.isLoadingManualProcess = true;
    this.dataservice.manual_Process_Data(payload).subscribe({
      next: async (response: any) => {
        this.isLoadingManualProcess = false;

        if (response.flag === '1') {
          // Remove processed rows from grids
          // DistributeHISGridData;
          this.RAGridData = this.RAGridData.filter(
            (r: any) => r.ID !== raRow.ID,
          );
          this.DistributeHISGridData = this.DistributeHISGridData.filter(
            (h: any) => h.ID !== hisRow.ID,
          );

          // Only auto-process when total rows for this UNIQUE_KEY = 2
          if (!autoProcessNext && raRow) {
            const raRemaining = this.RAGridData.filter(
              (r: any) => r.UNIQUE_KEY === raRow.UNIQUE_KEY,
            );

            const hisRemaining = this.DistributeHISGridData.filter(
              (r: any) => r.UNIQUE_KEY === hisRow.UNIQUE_KEY,
            );

            console.log(raRemaining.length, 'raRemaining');
            console.log(hisRemaining.length, 'hisgriddatalength');

            if (raRemaining.length === 1 && hisRemaining.length === 1) {
              const lastRaRow = raRemaining[0];
              const lastHisRow = hisRemaining[0];

              // prevent HIS API trigger during auto-select
              this.skipHisLoad = true;

              this.raGrid?.instance.selectRows([lastRaRow.ID], true);
              this.hisGrid?.instance.selectRows([lastHisRow.ID], true);

              // Auto trigger submit for the last pair (no confirmation dialog)
              this.onSubmitProcess(true);
              console.log('onSubmistProcess');
            } else {
              this.skipHisLoad = false;
            }
          }
        } else {
          notify({
            message: response.message || 'Process failed',
            type: 'error',
            displayTime: 3000,
          });
        }
      },
      error: (err) => {
        this.isLoading = false;

        notify({
          message: 'Something went wrong. Please try again.',
          type: 'error',
          displayTime: 3000,
        });
      },
    });
  }

  // =========== clear process popup data ======
  onProcessPopupClosed() {
    // Clear popup-related data
    this.RAGridData = [];
    this.RAProcessPopUpColumns = [];
    this.HISGridData = [];
    this.HISProcessPopUpColumns = [];
    this.autoProcessPopup = true;
    this.isLoading = false;
    // this.viewDetails();

    this.get_EDI_Data_Status();
  }

  //==================RA dropdown onchange function===============
  RADropdownOnchangeValue(e: any) {
    this.uniqueKeyChanged = true;

    const SelectedRaKey = e.component._dataSource._items.filter((item: any) =>
      e.value.includes(item.ColumnID),
    );
  }

  //================get RA columns data==================
  get_RA_Columns_Data() {
    const payload = {
      NAME: 'RA_COLUMNS',
      INSURANCE_ID: this.selected_Insurance_id,
    };

    this.dataservice.RA_Columns_For_UniqueKey(payload).subscribe((res: any) => {
      // Convert to TagBox expected structure
      this.RA_columns = (res || []).map((item: any) => ({
        ColumnID: item.ID,
        ColumnTitle: item.DESCRIPTION,
      }));

      // 2) Get IDs where HisMatched == true from editColumns
      const hisMatchedIds = this.editColumns
        .filter((c: any) => c.HisMatched === true)
        .map((c: any) => c.ColumnID);

      // 3) Preselect those IDs in TagBox
      this.selecteRAuniqueKeys = hisMatchedIds;
    });
  }

  HISDropdownOnchangeValue(e: any) {
    this.uniqueKeyChanged = true;

    const selectedHISObjects = e.component._dataSource._items.filter(
      (item: any) => e.value.includes(item.ID),
    );

    this.finalHISObjects = selectedHISObjects.map((item: any) => ({
      ID: 0,
      InsuranceID: 0,
      ColumnID: item.ID,
      ColumnName: '',
      ColumnTitle: item.DESCRIPTION,
      IsHisColumn: true,
    }));
  }

  displayColumn(item: any) {
    if (!item) return '';
    return item.ColumnID + ' - ' + item.ColumnTitle;
  }

  //==================get his columns for unique key=================
  getHisColumnsForUniqueKey() {
    this.dataservice.His_Columns_For_UniqueKey(name).subscribe((res: any) => {
      this.hisColumns = res || [];
    });
  }

  //======================= confirmation for mismatched gross amount processing====================
  onConfirmGrossMismatch() {
    this.confirmDistribute = true;
    this.onSubmitDistributeRA();
  }

  //======================= cancel for mismatched gross amount processing====================

  onCancelGrossMismatch() {
    this.confirmDistribute = false;
    // this.showGrossMismatchPopup = false;
  }

  //=========================validate data time==============
  validateAndFocusFirstInvalidRow() {
    const invalidRows: number[] = [];

    this.dataSource.forEach((row: any, index: number) => {
      const excelRowNo = row.__excelRowNo ?? index + 2;

      this.columnData.forEach((col: any) => {
        const value = row[col.dataField];
        if (value === null || value === '') return;

        if (col.type === 'DATETIME' && !this.isValidDDMMYYYY(value)) {
          invalidRows.push(index); // 👉 GRID INDEX
        }

        if (
          col.type === 'DECIMAL' &&
          isNaN(Number(value.toString().replace(/,/g, '')))
        ) {
          invalidRows.push(index);
        }
      });
    });

    const uniqueInvalidIndexes = [...new Set(invalidRows)].sort(
      (a, b) => a - b,
    );

    if (uniqueInvalidIndexes.length > 0) {
      const firstInvalidIndex = uniqueInvalidIndexes[0];

      // 👇 THIS is what grid needs
      this.focusedRowKey =
        this.dataSource[firstInvalidIndex]?.ID ?? firstInvalidIndex;

      this.rowInvalidNumbers = uniqueInvalidIndexes.map(
        (i) => this.dataSource[i].__excelRowNo ?? i + 2,
      );

      notify({
        message: `Invalid data found at row(s): ${this.rowInvalidNumbers.join(', ')}`,
        type: 'error',
        displayTime: 6000,
        position: { at: 'top right', my: 'top right', of: window },
      });
    }
  }

  prepareDisplayLevels(data: any[]) {
    this.displayTableData = data.map((levelArray, index) => {
      const hisNames: string[] = [];
      const raNames: string[] = [];

      levelArray.forEach((item: any) => {
        if (item.ColumnName) {
          hisNames.push(item.ColumnName);
        }

        if (item.RA_COLUMN_TITLE) {
          raNames.push(item.RA_COLUMN_TITLE);
        }
      });

      return {
        sl: index + 1,
        his: hisNames.join(', '),
        ra: raNames.join(', '),
      };
    });

    console.log(
      this.displayTableData,
      '=================displayTableData===================',
    );
  }

  // async Process_screen() {
  //   this.handleclose.emit(); // Close popup first
  //   // await this.navigateToProcess();
  // }

  checkAllowSelectAllFromGrid() {
    const visibleRows = this.distributeGrid?.instance?.getVisibleRows();

    if (!visibleRows || visibleRows.length === 0) {
      this.allowSelectAllFlag = false;
    } else {
      const data = visibleRows.map((r: any) => r.data);
      const firstKey = data[0].UNIQUE_KEY;

      this.allowSelectAllFlag = data.every(
        (item: any) => item.UNIQUE_KEY === firstKey,
      );
    }

    // 🔥 Update grid option
    this.distributeGrid?.instance?.option(
      'selection.allowSelectAll',
      this.allowSelectAllFlag,
    );

    console.log('Filtered Allow Select All:', this.allowSelectAllFlag);
  }

  //===========================status of insruace data=======================
  get_EDI_Data_Status() {
    console.log('==================get_status_Edi===================');
    const payload = {
      INSURANCE_ID: this.selectedInsuranceId,
    };

    this.dataservice.get_status_Edi(payload).subscribe((res: any) => {
      console.log(res, '=================get_status_Edi===================');
      this.TotalEDI = res.HisCount;
      this.identifiedHis = res.Identified;
      this.MatchedTotalHis = res.Processed;
      this.ManualProcessing = res.RequiredManual;
      this.PendignHis = res.Pending;

      // ===== Percentage Calculations =====
      this.identifiedPercent = this.TotalEDI
        ? ((this.identifiedHis / this.TotalEDI) * 100).toFixed(2)
        : 0;

      this.processedPercent = this.identifiedHis
        ? ((this.MatchedTotalHis / this.identifiedHis) * 100).toFixed(2)
        : 0;

      this.manualPercent = this.identifiedHis
        ? ((this.ManualProcessing / this.identifiedHis) * 100).toFixed(2)
        : 0;

      this.notFoundPercent = this.TotalEDI
        ? ((this.PendignHis / this.TotalEDI) * 100).toFixed(2)
        : 0;
    });
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
    DxCheckBoxModule,
    DxPopupModule,
    DxTagBoxModule,
    DxDateBoxModule,
    DxSelectBoxModule,
    ProcessScreenModule,
  ],
  providers: [],
  declarations: [ImportRADataPopupComponent],
  exports: [ImportRADataPopupComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ImportRADataPopupModule {}
