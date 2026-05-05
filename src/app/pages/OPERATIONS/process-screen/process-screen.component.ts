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
  DxValidationGroupComponent,
  DxDataGridModule,
  DxButtonModule,
  DxPopupModule,
  DxSelectBoxModule,
  DxValidatorModule,
  DxLoadPanelModule,
  DxTagBoxModule,
  DxTextBoxModule,
  DxNumberBoxModule,
} from 'devextreme-angular';
import { FormPopupModule } from 'src/app/components';
import { ImportRADataPopupModule } from '../../POP-UP_PAGES/import-ra-data-popup/import-ra-data-popup.component';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import { DataService } from 'src/app/services';
import notify from 'devextreme/ui/notify';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { confirm, custom } from 'devextreme/ui/dialog';
import { ReportEngineService } from '../../REPORT PAGES/report-engine.service';
@Component({
  selector: 'app-process-screen',
  templateUrl: './process-screen.component.html',
  styleUrl: './process-screen.component.scss',
})
export class ProcessScreenComponent {
  UniquekeyGernarationPayload: any = {
    InsuranceID: 0,
    UKeys: [],
  };
  selectedDistributedRARows: any[] = [];
  confirmDistribute: boolean = false;
  hisrows: any;
  uniqueKeyObj: any[] = [];
  displayUniqueKeys: any[] = [];
  displayTableData: any;
  hisColumns: any[] = [];
  selecteHISuniqueKeys: any[] = [];
  raFileColumns: any[] = [];
  otherHISObjects: any[] = [];
  HisgrossAmount: any;
  RagrossAmount: any;
  selectedInsuranceId: any;
  isHisSelected = false;
  totalNetPayable: any;
  TotalEDI: any = 0;
  TotalRA: any = 0;
  MatchedTotalHis: any = 0;
  MatchedTotalRA: any = 0;
  ManualProcessing: any = 0;
  selected_his_Data: any[] = [];
  combinationMatchingPopup: boolean = false;
  selecteRAuniqueKeys: any[] = [];
  RA_columns: any[] = [];
  InsuranceColumns: any[] = [];
  insuranceList: any[] = [];
  selectedRARows: any;
  isLoadingManualProcess: boolean = false;
  finalHISObjects: any;
  uniqueKeyChanged: boolean = false;
  editColumns: any;
  autoProcessPopup: boolean = false;
  identifiedHis: any;
  PendignHis: any;
  identifiedPercent: any = 0;
  processedPercent: any = 0;
  manualPercent: any = 0;
  notFoundPercent: any = 0;
  totalSelected: any = 0;
  totalRASelected: any = 0;
  isFilterRowVisible: boolean = false;
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid!: DxDataGridComponent;

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
  // @Input() selectedInsuranceId: any = null;
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

  readonly allowedPageSizes: any = [50, 100, 1000];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;

  isSaving: boolean = false;
  gridLoading: boolean = false;

  isLoading: boolean = false;

  autoProcess: boolean = true;
  fullcolumnsData: any;
  selectedKeys: any[] = [];
  selectedColumns: any[] = [];
  selectedFieldNames: string[] = [];

  finalRAObjects: any;
  insurance_id: any;
  selectedRAIds: any[] = [];

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
  selectedRAIdsString: string = '';
  totalPendingprocessed: number = 0;
  totalProcessed: number = 0;
  manualProcess: number = 0;
  notFound: number = 0;
  totalRaItems: number = 0;
  allowSelectAllFlag: boolean = false;
  User_Id: any;

  constructor(
    private dataservice: DataService,
    private masterservice: MasterReportService,
    private cdRef: ChangeDetectorRef,
    private router: Router,
    private reportengine: ReportEngineService,
    private route: ActivatedRoute,
  ) {
    this.fetch_insurance_dropdown_data();
    this.autoProcessPopup = true;
    this.get_RA_Columns_Data();
    this.getHisColumnsForUniqueKey();
    this.sessionDetails();
  }

  ngOnInit() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const currentUrl = this.router.url;

        if (currentUrl.includes('process')) {
          this.autoProcessPopup = false;
          this.selectedInsuranceId = null;
          this.selecteRAuniqueKeys = [];
          this.selecteHISuniqueKeys = [];
          this.TotalEDI = 0;
          this.TotalRA = 0;
          this.MatchedTotalHis = 0;
          this.MatchedTotalRA = 0;
          this.ManualProcessing = 0;
          this.displayTableData = [];
          setTimeout(() => {
            this.autoProcessPopup = true;
          });
        }
      });

    this.route.queryParams.subscribe((params) => {
      if (params['insuranceId']) {
        this.selectedInsuranceId = params['insuranceId'];
        this.autoProcessPopup = true; // Open popup here
      }
    });
  }
  //--------------------login response--------------------
  sessionDetails() {
    const LoginResponse = JSON.parse(localStorage.getItem('logData') || '{}');
    this.User_Id = LoginResponse.UserID;
  }
  //=============select insurance details===========
  fetch_all_column_and_uniqueKey_data() {
    const insuranceId = this.selectedInsuranceId;
    if (insuranceId) {
      this.masterservice.selected_Insurance_Row_Data(insuranceId).subscribe({
        next: (res: any) => {
          if (res && res.flag === '1') {
            this.InsuranceColumns = res.data[0].columns.filter(
              (col: any) => col.HisMatched === true,
            );

            const uniqueKeyhis = res.data[0].uniqueKeys;

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

  //=== get status of edi data========

  get_EDI_Data_Status() {
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

  //========on change of insurance dropdown========
  onInsuranceChange(e: any) {
    this.selectedInsuranceId = e.value;
    this.fetch_all_column_and_uniqueKey_data();
    this.get_EDI_Data_Status();
  }
  onChangeAndProcess(): Promise<void> {
    return new Promise((resolve) => {
      const insurance = this.selectedInsuranceId;
      const payload = {
        UserID: this.User_Id,
        InsuranceID: insurance,
        RA_UNIQUE_KEY: this.selecteRAuniqueKeys.join(','),
        HIS_UNIQUE_KEY: this.selecteHISuniqueKeys.join(','),
      };

      this.isLoadingManualProcess = true;
      this.dataservice
        .manual_ReProcess_RA_Data(payload)
        .subscribe((res: any) => {
          this.isLoadingManualProcess = false;

          if (res && res.flag === '1') {
            this.get_EDI_Data_Status();
          } else {
            this.get_EDI_Data_Status();
          }

          // this.uniqueKeyChanged = false;
          resolve();
        });
    });
  }
  Process(): Promise<void> {
    return new Promise((resolve) => {
      const insurance = this.selectedInsuranceId;
      const payload = {
        InsuranceID: insurance,
        RA_UNIQUE_KEY: '',
        HIS_UNIQUE_KEY: '',
        UserID: this.User_Id,
      };

      this.isLoadingManualProcess = true;
      this.dataservice
        .manual_ReProcess_RA_Data(payload)
        .subscribe((res: any) => {
          this.isLoadingManualProcess = false;

          if (res && res.flag === '1') {
            this.get_EDI_Data_Status();
          } else {
            this.get_EDI_Data_Status();
          }

          // this.uniqueKeyChanged = false;
          resolve();
        });
    });
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

  //----------------ra dropdown--------
  //================get RA columns data==================
  get_RA_Columns_Data() {
    const payload = {
      NAME: 'RA_COLUMNS',
      INSURANCE_ID: this.selectedInsuranceId,
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

  //==================RA dropdown onchange function===============
  RADropdownOnchangeValue(e: any) {
    this.uniqueKeyChanged = true;

    const SelectedRaKey = e.component._dataSource._items.filter((item: any) =>
      e.value.includes(item.ColumnID),
    );
    this.get_RA_Columns_Data();
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

  //==================get his columns for unique key=================
  getHisColumnsForUniqueKey() {
    this.dataservice.His_Columns_For_UniqueKey(name).subscribe((res: any) => {
      this.hisColumns = res || [];
    });
  }
  //=============close popup on click of close button===========
  onPopupClose() {
    this.autoProcessPopup = false;
    this.router.navigate(['/analytics-dashboard']);
  }
  distributeRA = async () => {
    if (!this.selectedInsuranceId) {
      notify(
        'Please select an insurance before Manaual process.',
        'error',
        3000,
      );
      return;
    }
    this.isLoading = true;
    try {
      this.isLoading = true;

      const payload = {
        InsuranceID: this.selectedInsuranceId,
        LogID: this.fetchedData?.ID || this.LogID,
      };

      //  Await API to prevent UI blocking
      const response: any = await this.dataservice
        .fetch_HIS_Process_Data_list(payload)
        .toPromise();

      if (response.flag !== '1') return;
      this.isLoading = false;
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
      USER_ID: this.User_Id,
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
  // ============== only allow to edit selected rows ==========
  isRowSelected(row: any): boolean {
    return this.selectedDistributeRows?.some((r) => r.ID === row.ID) || false;
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
    this.ProcessedCount();
    this.get_EDI_Data_Status();
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
  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

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

    this.ProcessedCount();
  }

  //--------------enable select all check box when all unique are same ------------------
  checkAllowSelectAllFromGrid() {
    const visibleRows = this.distributeGrid?.instance?.getVisibleRows();

    if (!visibleRows || visibleRows.length === 0) {
      this.allowSelectAllFlag = false;
    } else {
      const data = visibleRows.map((r) => r.data);
      const firstKey = data[0].UNIQUE_KEY;

      this.allowSelectAllFlag = data.every(
        (item) => item.UNIQUE_KEY === firstKey,
      );
    }

    // 🔥 Update grid option
    this.distributeGrid?.instance?.option(
      'selection.allowSelectAll',
      this.allowSelectAllFlag,
    );

    console.log('Filtered Allow Select All:', this.allowSelectAllFlag);
  }
  //-------------------Amount Formatting function-------------------
  formatAmount(value: number): string {
    if (value == null) return '';

    if (value >= 1_000_000_000_000) {
      return (value / 1_000_000_000_000).toFixed(2) + 'T';
    } else if (value >= 1_000_000_000) {
      return (value / 1_000_000_000).toFixed(2) + 'B';
    } else if (value >= 1_000_000) {
      return (value / 1_000_000).toFixed(2) + 'M';
    } else if (value >= 1_000) {
      return (value / 1_000).toFixed(2) + 'K';
    } else {
      return value.toString();
    }
  }
}

@NgModule({
  imports: [
    CommonModule,
    DxDataGridModule,
    DxButtonModule,
    FormPopupModule,
    DxPopupModule,
    DxSelectBoxModule,
    DxValidatorModule,
    DxLoadPanelModule,
    DxTagBoxModule,
    DxTextBoxModule,
    DxNumberBoxModule,
  ],
  providers: [],
  exports: [ProcessScreenComponent],
  declarations: [ProcessScreenComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProcessScreenModule { }
