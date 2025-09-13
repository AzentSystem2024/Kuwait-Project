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
    this.isRASelected = true; // ✅ Enable Distribute RA button

    const payload = {
      UniqueKey: selectedRow.UNIQUE_KEY,
    };
    this.HISGridData = [];

    this.dataservice.fetch_HIS_Process_Data_list(payload).subscribe({
      next: (response: any) => {
        if (response.flag === '1') {
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
                  row.GROSS_AMOUNT === selectedRow.GROSS_CLAIMED
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

  // ============== only allow to edit selected rows ==========
  isRowSelected(row: any): boolean {
    return this.selectedDistributeRows?.some((r) => r.ID === row.ID) || false;
  }

  // ========= Distribute RA button click =========
  distributeRA = () => {
    if (!this.lastRASelection) return;

    this.selectedRARow = this.lastRASelection;
    this.DistributeHISGridData = this.HISGridData.map((row) => ({
      ...row,
      NetPayable: null, // keep NetPayable empty initially
    }));

    // Reset selected rows
    this.selectedDistributeRows = [];

    // Add extra 5 editable columns
    this.DistributeHISColumns = [
      ...this.HISProcessPopUpColumns.map((col) => {
        if (col.dataField === 'UNIQUE_KEY') {
          return {
            ...col,
            allowEditing: false,
            fixed: true, // freeze column
            fixedPosition: 'left', // lock to left side
          };
        }
        return {
          ...col,
          allowEditing: false,
        };
      }),
      {
        dataField: 'OverBillingAmount',
        caption: 'Over Billing Amount',
        dataType: 'number',
        format: '#,##0.00',
        allowEditing: (rowData: any) => this.isRowSelected(rowData),
      },
      {
        dataField: 'AuditingRejectedAmount',
        caption: 'Auditing Rejected Amount',
        dataType: 'number',
        format: '#,##0.00',
        allowEditing: (rowData: any) => this.isRowSelected(rowData),
      },
      {
        dataField: 'DiscountAmount',
        caption: 'Discount Amount',
        dataType: 'number',
        format: '#,##0.00',
        allowEditing: (rowData: any) => this.isRowSelected(rowData),
      },
      {
        dataField: 'Co-PayandDeductible',
        caption: 'Co-Pay & Deductible',
        dataType: 'number',
        format: '#,##0.00',
        allowEditing: (rowData: any) => this.isRowSelected(rowData),
      },
      {
        dataField: 'NetPayable',
        caption: 'Net Payable',
        dataType: 'number',
        format: '#,##0.00',
        allowEditing: false, // never editable
      },
    ];

    // Show distribute popup
    this.isDistributePopupVisible = true;
  };

  // ========== distribute RA his grid selection change event =====
  onDistributeSelectionChanged(e: any) {
    this.selectedDistributeRows = e.selectedRowsData || [];
    this.totalSelected = this.selectedDistributeRows.length;

    // Clear NetPayable for unselected rows
    this.DistributeHISGridData.forEach((row) => {
      if (!this.selectedDistributeRows.some((r) => r.ID === row.ID)) {
        row.NetPayable = null; // empty when not selected
      }
    });

    // Assign GROSS_AMOUNT to NetPayable for selected rows
    this.selectedDistributeRows.forEach((row) => {
      const gross = Number(row.GROSS_AMOUNT) || 0;
      row.NetPayable = gross;
    });

    // Refresh grid
    e.component.refresh(true);
  }

  // ====== Calculate totals using only selected rows ======
  getSelectedTotal(field: any): string {
    if (!this.selectedDistributeRows?.length) return '0.00';
    const total = this.selectedDistributeRows.reduce((sum, row) => {
      const val = Number(row[field]) || 0;
      return sum + val;
    }, 0);
    return total.toFixed(2); // format with 2 decimals
  }

  // ====== Block editing for unselected rows ======
  ondistributionHISgridEditingStart(e: any) {
    const row = e.data;
    if (!this.isRowSelected(row)) {
      e.cancel = true;
    }
  }

  // ===== RA Distribute HIS cell value changes event =====
  onCellValueChanged(e: any) {
    const allowedFields = [
      'AuditingRejectedAmount',
      'DiscountAmount',
      'Co-PayandDeductible',
      'ExceedingLimit',
    ];

    if (!allowedFields.includes(e.column.dataField)) return;

    const row = e.data;

    // only recalc if row is selected
    if (this.isRowSelected(row)) {
      row.NetPayable =
        (Number(row.GROSS_AMOUNT) || 0) -
        (Number(row.AuditingRejectedAmount) || 0) -
        (Number(row['Co-PayandDeductible']) || 0) -
        (Number(row.ExceedingLimit) || 0) -
        (Number(row.DiscountAmount) || 0);
    }

    e.component.refresh(true);
  }

  // ==== Recalculate NetPayable after edits ========
  updateFooterTotals() {
    this.DistributeHISGridData = this.DistributeHISGridData.map((row) => {
      if (this.isRowSelected(row)) {
        const gross = Number(row.GROSS_AMOUNT) || 0;
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

  // ====== on click of ra distribute process button ====
  onSubmitDistributeRA() {
    // Your submit logic
  }

  // ========HIS data row selection event =======
  onHISRowSelected(e: any) {
    if (!e.selectedRowsData?.length) return;

    if (e.selectedRowKeys.length > 1) {
      const lastKey = e.selectedRowKeys[e.selectedRowKeys.length - 1];
      e.component.selectRows([lastKey], false);
    }
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
      raRow.GROSS_CLAIMED !== hisRow.GROSS_AMOUNT
    ) {
      const dialog = custom({
        title: 'Confirmation',
        messageHtml: `
        <div style="width:400px; height:150px; font-size:14px; text-align:center; padding:15px; box-sizing:border-box;">
          <b>Gross Amounts are different</b><br><br>
          <div style="margin-bottom:8px;">RA: ${raRow.GROSS_CLAIMED}</div>
          <div style="margin-bottom:8px;">HIS: ${hisRow.GROSS_AMOUNT}</div>
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
