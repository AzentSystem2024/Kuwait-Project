import { FormItemDateModule } from './../../../components/utils/form-datebox/form-datebox.component';
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
  DxDataGridComponent,
  DxDataGridModule,
  DxButtonModule,
  DxSelectBoxModule,
  DxValidatorModule,
  DxTextBoxModule,
  DxLoadPanelModule,
  DxCheckBoxModule,
  DxPopupModule,
} from 'devextreme-angular';
import notify from 'devextreme/ui/notify';
import { confirm, custom } from 'devextreme/ui/dialog';
import { DataService } from 'src/app/services';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-import-ra-data-popup',
  templateUrl: './import-ra-data-popup.component.html',
  styleUrl: './import-ra-data-popup.component.scss',
})
export class ImportRADataPopupComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;

  @ViewChild('raGrid', { static: false }) raGrid!: DxDataGridComponent;
  @ViewChild('hisGrid', { static: false }) hisGrid!: DxDataGridComponent;

  @ViewChild('fileInput', { static: false }) fileInput: ElementRef;

  @ViewChild('distributeGrid', { static: false }) distributeGrid: any;

  @Output() closeForm = new EventEmitter();

  @Input() viewData: any = null;

  @Input() dataSource: any = null;
  @Input() columnData: any = null;
  @Input() selectedInsuranceId: any = null;

  readonly allowedPageSizes: any = [50, 100, 1000];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;

  isSaving: boolean = false;
  gridLoading: boolean = false;

  isLoading: boolean = false;
  insuranceList: any;

  autoProcess: boolean = true;

  statusOptions = [
    { DESCRIPTION: 'Processed', ID: 'Processed' },
    { DESCRIPTION: 'Not Processed', ID: 'Not Processed' },
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

  // ===== Footer total variables =====
  totalSelected: any = 0;

  constructor(private dataservice: DataService) {}

  async ngOnInit(): Promise<void> {
    await this.fetch_insurance_dropdown_data();

    if (this.viewData && this.insuranceList) {
      this.selectedInsuranceId = this.viewData.InsuranceID;
      this.columnData = this.viewData.columns.map((col: any) => ({
        dataField: col.ColumnName,
        caption: col.ColumnTitle,
      }));
      this.dataSource = this.viewData.data;
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

    this.isLoading = true;
    this.isSaving = true;

    const payload = {
      USerID: userId,
      InsuranceID: insuranceId,
      IsAutoProcessed: this.autoProcess,
      import_ra_data: this.dataSource || [],
    };

    this.dataservice
      .Import_RA_Data(payload)
      .pipe(
        finalize(() => {
          // Always executed whether success or error
          this.isLoading = false;
          this.isSaving = false;
        })
      )
      .subscribe({
        next: (res: any) => {
          if (res.flag === '1') {
            notify({
              message: 'Data imported successfully!',
              type: 'success',
              displayTime: 3000,
              position: { at: 'top right', my: 'top right', of: window },
            });
            this.close();
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

  // =============================== process popup codes =========

  onStatusChange(e: any) {
    const statusValue = e.value;
    if (this.dataGrid && statusValue) {
      this.dataGrid.instance.filter(['Status', '=', statusValue]);
    } else {
      this.dataGrid.instance.clearFilter();
    }
  }
  // =========== process popup open and data fetching =============
  onProcessClick() {
    const insurance = this.selectedInsuranceId;
    const logId = this.viewData.ID;

    const payload = {
      InsuranceID: insurance,
      LogID: logId,
    };

    this.isLoading = true;

    this.dataservice.fetch_RA_Process_Data_list(payload).subscribe({
      next: (response: any) => {
        if (response.flag === '1') {
          this.RAProcessPopUpColumns = response.columns.map((col: any) => ({
            dataField: col.ColumnName,
            caption: col.ColumnTitle,
            width: 150,
          }));
          this.RAGridData = response.data;

          if (this.raGrid?.instance) {
            this.raGrid.instance.clearSelection();
            this.raGrid.instance.option('focusedRowIndex', -1);
          }

          if (this.hisGrid?.instance) {
            this.hisGrid.instance.clearSelection();
            this.hisGrid.instance.option('focusedRowIndex', -1);
          }

          this.isProcessPopupVisible = true;
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  // =============== Ra data row selection change event =========
  onRADataRowSelected(e: any) {
    if (!e.selectedRowsData?.length) {
      this.isRASelected = false;
      this.lastRASelection = null;
      return;
    }

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
    };
    this.HISGridData = [];

    this.dataservice.fetch_HIS_Process_Data_list(payload).subscribe({
      next: (response: any) => {
        if (response.flag === '1') {
          this.isRASelected = true;
          this.HISGridData = response.data;
          this.HISProcessPopUpColumns = response.columns.map((col: any) => ({
            dataField: col.ColumnName,
            caption: col.ColumnTitle,
            width: 150,
          }));

          setTimeout(() => {
            const hisGrid = this.hisGrid?.instance;
            if (hisGrid && this.HISGridData?.length) {
              const match = this.HISGridData.find(
                (row: any) =>
                  row.UNIQUE_KEY === selectedRow.UNIQUE_KEY &&
                  row.GROSS_CLAIMED === selectedRow.GROSS_CLAIMED
              );

              const focusKey = match ? match.ID : this.HISGridData[0].ID;

              if (focusKey) {
                hisGrid.option('focusedRowKey', null); // reset
                setTimeout(() => {
                  hisGrid.option('focusedRowEnabled', true);
                  hisGrid.option('focusedRowKey', focusKey);
                  hisGrid.navigateToRow(focusKey);
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
  onHISRowSelected(e: any) {
    if (!e.selectedRowsData?.length) return;

    if (e.selectedRowKeys.length > 1) {
      const lastKey = e.selectedRowKeys[e.selectedRowKeys.length - 1];
      e.component.selectRows([lastKey], false);
    }
  }

  // ============== only allow to edit selected rows ==========
  isRowSelected(row: any): boolean {
    return this.selectedDistributeRows?.some((r) => r.ID === row.ID) || false;
  }

  // ========= Distribute RA button click =========
  distributeRA = () => {
    if (!this.lastRASelection) return;

    this.selectedRARow = this.lastRASelection;

    // Load HIS claims matching RA's unique key
    this.DistributeHISGridData = this.HISGridData.filter(
      (row) => row.UNIQUE_KEY === this.selectedRARow.UNIQUE_KEY
    ).map((row) => ({
      ...row,
      NetPayable: null,
    }));

    this.selectedDistributeRows = [];

    this.DistributeHISColumns = [
      { type: 'selection', fixed: true, fixedPosition: 'left' },
      ...this.HISProcessPopUpColumns.map((col) => ({
        ...col,
        allowEditing: false,
      })),
      {
        dataField: 'OverBillingAmount',
        caption: 'Over Billing',
        dataType: 'number',
        allowEditing: (r: any) => this.isRowSelected(r),
        format: '#,##0.00',
      },
      {
        dataField: 'AuditingRejectedAmount',
        caption: 'Audit Rejected',
        dataType: 'number',
        allowEditing: (r: any) => this.isRowSelected(r),
        format: '#,##0.00',
      },

      {
        dataField: 'Co-PayandDeductible',
        caption: 'Co-pay & Deduction',
        dataType: 'number',
        allowEditing: (r: any) => this.isRowSelected(r),
        format: '#,##0.00',
      },

      {
        dataField: 'NetPayable',
        caption: 'Net Payable',
        dataType: 'number',
        format: '#,##0.00',
        allowEditing: false,
        calculateCellValue: (rowData: any) => {
          if (!this.selectedDistributeRows?.some((r) => r.ID === rowData.ID)) {
            return null;
          }

          const claimed = Number(rowData.NET_AMOUNT1) || 0;
          const rejected = Number(rowData.AuditingRejectedAmount) || 0;
          const copay = Number(rowData['Co-PayandDeductible']) || 0;

          return claimed - rejected - copay;
        },
      },
    ];

    this.isDistributePopupVisible = true;
  };

  // ========== distribute RA his grid selection change event =====
  onDistributeSelectionChanged(e: any) {
    this.selectedDistributeRows = e.selectedRowsData || [];
    this.totalSelected = this.selectedDistributeRows.length;

    this.DistributeHISGridData.forEach((row) => {
      if (this.isRowSelected(row)) {
        row.NetPayable = Number(row.NET_AMOUNT1) || 0;
      } else {
        row.NetPayable = null;
      }
    });

    e.component.refresh(true);
  }

  // ====== Calculate totals using only selected rows ======
  getSelectedTotal(field: string): string {
    if (!this.selectedDistributeRows?.length) return '0.00';
    const total = this.selectedDistributeRows.reduce((sum, row) => {
      return sum + (Number(row[field]) || 0);
    }, 0);
    return total.toFixed(2);
  }
  // ========== get summary Amount ==========
  getSummaryAmount(column: string): string {
    if (!this.distributeGrid?.instance) return '0.00';
    const summaryValue =
      this.distributeGrid.instance.getTotalSummaryValue(column);
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(summaryValue || 0);
  }

  // ====== Block editing for unselected rows ======
  ondistributionHISgridEditingStart(e: any) {
    const row = e.data;
    if (!this.isRowSelected(row)) {
      e.cancel = true;
    }
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
  }

  // ====== on click of RA distribute process button ====
  onSubmitDistributeRA() {
    if (!this.selectedRARow) {
      notify('Please select an RA before distributing.', 'warning', 3000);
      return;
    }
    if (!this.selectedDistributeRows?.length) {
      notify(
        'Please select at least one row before distributing.',
        'warning',
        3000
      );
      return;
    }
    console.log("selected ra data :>>",this.selectedRARow)

    const payload = {
      RaID: this.selectedRARow.ID,
      distributed_data: this.transformPayload(this.selectedDistributeRows),
    };

    this.dataservice.submit_RA_Distribution_Data(payload).subscribe({
      next: (res: any) => {
        if (res.flag === '1') {
          notify(
            res.message || 'RA distribution completed successfully',
            'success',
            3000
          );

          // Reset UI state
          this.selectedDistributeRows = [];
          this.distributeGrid?.instance.refresh();
          this.RAGridData = [];
          this.HISGridData = [];
          this.clearDistributePopup();
          this.onProcessClick();
        } else {
          notify(
            res.message || 'Failed to process RA distribution',
            'error',
            3000
          );
        }
      },
      error: (err) => {
        console.error('RA Distribution Error:', err);
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
        { position: 'top right' }
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

    this.isLoading = true;
    this.dataservice.manual_Process_Data(payload).subscribe({
      next: async (response: any) => {
        this.isLoading = false;

        if (response.flag === '1') {
          // Remove processed rows from grids
          this.RAGridData = this.RAGridData.filter(
            (r: any) => r.ID !== raRow.ID
          );
          this.HISGridData = this.HISGridData.filter(
            (h: any) => h.ID !== hisRow.ID
          );

          // Only auto-process when total rows for this UNIQUE_KEY = 2
          if (!autoProcessNext && raRow) {
            const raRemaining = this.RAGridData.filter(
              (r: any) => r.UNIQUE_KEY === raRow.UNIQUE_KEY
            );

            if (raRemaining.length === 1 && this.HISGridData.length === 1) {
              const lastRaRow = raRemaining[0];
              const lastHisRow = this.HISGridData[0];

              // prevent HIS API trigger during auto-select
              this.skipHisLoad = true;

              this.raGrid?.instance.selectRows([lastRaRow.ID], true);
              this.hisGrid?.instance.selectRows([lastHisRow.ID], true);

              // Auto trigger submit for the last pair (no confirmation dialog)
              this.onSubmitProcess(true);
            } else {
              this.HISGridData = [];
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
        console.error('Error processing:', err);
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
    // this.selectedRAData = null;
    // this.selectedHISData = null;
    this.isLoading = false;
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
  ],
  providers: [],
  declarations: [ImportRADataPopupComponent],
  exports: [ImportRADataPopupComponent],
})
export class ImportRADataPopupModule {}
