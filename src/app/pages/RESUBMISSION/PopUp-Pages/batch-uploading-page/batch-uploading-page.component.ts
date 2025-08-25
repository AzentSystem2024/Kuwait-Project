import { BatchUploadingLookUpComponent } from './../../batch-uploading-look-up/batch-uploading-look-up.component';
import { CommonModule } from '@angular/common';
import { Component, Input, NgModule, OnInit, ViewChild } from '@angular/core';
import {
  DxDataGridModule,
  DxButtonModule,
  DxDropDownButtonModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxLookupModule,
  DxPopupModule,
  DxLoadPanelModule,
  DxTabsModule,
  DxTreeListModule,
  DxNumberBoxModule,
  DxDropDownBoxModule,
  DxValidatorModule,
  DxCheckBoxModule,
  DxDataGridComponent,
} from 'devextreme-angular';
import { FormPopupModule } from 'src/app/components';
import { AllocationPageModule } from '../allocation-page/allocation-page.component';
import { ExcelImportLookupModule } from '../excel-import-lookup-page/excel-import-lookup-page.component';
import { ResubmissionServiceService } from '../../resubmission-service.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ReportService } from 'src/app/services/Report-data.service';
import { MasterReportService } from '../../../MASTER PAGES/master-report.service';
import notify from 'devextreme/ui/notify';
import { saveAs } from 'file-saver';
@Component({
  selector: 'app-batch-uploading-page',
  templateUrl: './batch-uploading-page.component.html',
  styleUrl: './batch-uploading-page.component.scss',
  providers: [ReportService, MasterReportService],
})
export class BatchUploadingPageComponent implements OnInit {
  @ViewChild('mainDatagrid', { static: false }) mainGrid: DxDataGridComponent;
  @ViewChild('pendingGridList', { static: false })
  pendingGridList!: DxDataGridComponent;

  @Input() EditRowData: any;
  @Input() IsEditing: any = false;

  isContentVisible: boolean = true;
  FacilityValue: any[] = [];
  Facility_DataSource: any;
  ReceiverID: any;
  receiverListDataSource: any[] = [];
  PayerIDValue: any;
  payer_DataSource: any[] = [];

  RevisionDocNumber: any;
  isLoading: boolean = false;

  focusedRow: any = null;
  previousFocusedRowUID: any = null;
  selectedMainGridRows: any[] = [];
  FilteredRevisionDataSource: any;
  ActivityDataSource: any;
  Activitycolumns: any;
  ObservationDataSource: any;
  DiagnosisDataSource: any;
  ClaimTypeOptionsDataSource: any;
  CPTTypeOptionsDataSource: any;
  filteredObservationdataSource: any[];
  SubmissionActivityColumns: any;
  DiagnosisColumns: any;
  lastUpdatedRowKey: any = null;
  lastResubmissionType: any = null;

  selectedTab: number = 0;
  selectedIndex: number = 0;
  SubmissiontabsWithText: any[] = [
    {
      id: 0,
      text: 'Activities',
    },
    {
      id: 1,
      text: 'Diagnosis',
    },
  ];

  selectedRowData: any = null;
  ObservationColumns: any;
  observationTypeDataSource: any;
  pdfFileUrl: SafeResourceUrl | null = null;
  ObservationpopupVisible: boolean = false;
  popupVisible: boolean = false;

  PendingListpopupVisible: boolean = false;
  PendingList_dataSource: any;
  originalRevisionData: any;
  ClaimDataColumns: any;
  resubmissionTypeOptions: any;

  saveButtonOptions: any = {
    text: 'Save',
    icon: 'save',
    type: 'default',
    onClick: () => {
      if (this.IsEditing === true) {
        this.update_revision_Batch_data();
      } else {
        this.save_revision_Batch_data();
      }
    },
  };
  pendingListrowData: any;
  xmlPopupVisible: boolean = false;
  constructor(
    private resubsrvce: ResubmissionServiceService,
    private service: ReportService,
    private masterService: MasterReportService,
    private sanitizer: DomSanitizer,
    private lookupPage: BatchUploadingLookUpComponent
  ) {
    this.get_dropdown_dataList();
    this.update_claimData_Columns();
  }

  ngOnInit() {
    this.masterService
      .Get_GropDown('RESUBMISSION_TYPES')
      .subscribe((response: any) => {
        this.resubmissionTypeOptions = response;

        // Now call after it's loaded
        this.update_claimData_Columns();

        //  Then set data and show grid if editing
        if (this.EditRowData && this.IsEditing) {
          if (this.ClaimDataColumns.length > 0) {
            this.isLoading = true;

            this.focusedRow = null;
            this.SubmissionActivityColumns = [];
            this.DiagnosisColumns = [];
            this.DiagnosisDataSource = [];
            this.ActivityDataSource = [];
            this.FilteredRevisionDataSource = [];
            this.originalRevisionData = [];

            const editData = this.EditRowData;
            this.FacilityValue = editData.FacilityID || [];
            this.ReceiverID = editData.ReceiverID || [];
            this.PayerIDValue = editData.PayerID || null;
            this.RevisionDocNumber = editData.ResubmissionRevisionUID;

            this.FilteredRevisionDataSource = editData.BatchBillData;
            this.originalRevisionData = editData.BatchBillData;
            this.isContentVisible = true;
            this.isLoading = false;

            setTimeout(() => {
              if (this.mainGrid && this.FilteredRevisionDataSource?.length) {
                this.mainGrid.instance.selectAll();
              }
            }, 100);
          }
        }
      });
  }

  openPopup() {
    this.xmlPopupVisible = true;
  }

  downloadXML() {
    const content = this.EditRowData.XMLContent;
    const filename = this.EditRowData.XMLFileName || 'download.xml';
    // Determine file type based on extension
    const isJson = filename.toLowerCase().endsWith('.json');
    const mimeType = isJson ? 'application/json' : 'application/xml';
    const blob = new Blob([content], { type: mimeType });
    saveAs(blob, filename);
  }

  get_dropdown_dataList() {
    this.masterService
      .Get_GropDown('RESUBMISSION_TYPES')
      .subscribe((response: any) => {
        this.resubmissionTypeOptions = response;
      });

    this.masterService.Get_Facility_List_Data().subscribe((response: any) => {
      if (response.flag == '1') {
        this.Facility_DataSource = response.data;
      }
    });

    this.masterService.Get_GropDown('RECEIVER').subscribe((response: any) => {
      this.receiverListDataSource = response;
    });

    this.masterService.Get_GropDown('PAYER').subscribe((response: any) => {
      this.payer_DataSource = response;
    });

    this.masterService.Get_GropDown('CPT_TYPES').subscribe((response: any) => {
      this.CPTTypeOptionsDataSource = response;
    });

    this.masterService
      .Get_GropDown('OBSERVATION_TYPE')
      .subscribe((response: any) => {
        this.observationTypeDataSource = response;
      });

    this.masterService
      .Get_GropDown('CLAIM_TYPES')
      .subscribe((response: any) => {
        this.ClaimTypeOptionsDataSource = response;
      });
  }
  get_all_pending_DataList() {
    this.PendingListpopupVisible = true;
    if (this.pendingGridList?.instance) {
      this.pendingGridList.instance.beginCustomLoading('Loading...');
    }
    const facility =
      this.FacilityValue && this.FacilityValue.length > 0
        ? this.FacilityValue.filter((val) => val && val.trim() !== '').join(',')
        : '';
    this.resubsrvce
      .get_revision_Batch_Upload_Data(
        facility,
        this.ReceiverID,
        this.PayerIDValue
      )
      .subscribe({
        next: (response: any) => {
          if (response.flag == '1') {
            this.PendingList_dataSource = response.data;
          }
        },
        error: (err) => {
          console.error('API Error:', err);
          this.pendingGridList?.instance?.endCustomLoading();
        },
        complete: () => {
          this.pendingGridList?.instance?.endCustomLoading();
        },
      });
  }
  //================Show and Hide Search parameters========
  toggleContent() {
    this.isContentVisible = !this.isContentVisible;
  }
  update_claimData_Columns() {
    this.ClaimDataColumns = [
      { dataField: 'FacilityID', caption: 'FacilityID', allowEditing: false },
      { dataField: 'ReceiverID', caption: 'ReceiverID', allowEditing: false },
      { dataField: 'ClaimNumber', caption: 'ClaimNumber', allowEditing: false },
      {
        dataField: 'EncounterStartDate',
        caption: 'EncounterStartDate',
        allowEditing: false,
      },
      { dataField: 'MemberID', caption: 'MemberID', allowEditing: false },
      { dataField: 'PayerID', caption: 'PayerID', allowEditing: false },
      { dataField: 'IDPayer', caption: 'IDPayer', allowEditing: false },
      { dataField: 'ClaimAmt', caption: 'ClaimAmt', allowEditing: false },
      {
        dataField: 'RemittanceAmt',
        caption: 'RemittanceAmt',
        allowEditing: false,
      },

      {
        dataField: 'ResubmissionType',
        caption: 'Resubmission Type',
        fixed: true,
        fixedPosition: 'right',
        allowEditing: true,
        width: 200,
        lookup: {
          dataSource: this.resubmissionTypeOptions,
          displayExpr: 'DESCRIPTION',
          valueExpr: 'ID',
        },
        editorOptions: {
          dropDownOptions: {
            width: 'auto',
          },
        },
      },
      {
        dataField: 'Comment',
        caption: 'Comment',
        fixed: true,
        fixedPosition: 'right',
        allowEditing: true,
        width: 250,
      },
      {
        dataField: 'Attachment',
        caption: 'Attachment',
        fixed: true,
        fixedPosition: 'right',
        allowEditing: true,
        width: 100,
        allowFiltering: false,
        allowHeaderFiltering: false,

        cellTemplate: (container, options) => {
          container.innerHTML = '';

          if (options.value) {
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.width = '100%';
            wrapper.style.height = '100%';
            wrapper.style.justifyContent = 'center';
            wrapper.style.alignItems = 'center';

            const iconButton = document.createElement('button');
            iconButton.className =
              'btn btn-sm d-flex justify-content-center align-items-center';
            iconButton.title = 'View/Edit Attachment';
            iconButton.innerHTML =
              '<i class="fa fa-paperclip text-primary"></i>';
            iconButton.style.border = 'none';
            iconButton.style.background = 'transparent';
            iconButton.style.cursor = 'pointer';
            iconButton.style.padding = '0';

            iconButton.onclick = () => {
              this.selectedRowData = options.data;
              this.pdfFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
                'data:application/pdf;base64,' + options.data.Attachment
              );
              this.popupVisible = true;
            };

            wrapper.appendChild(iconButton);
            container.appendChild(wrapper);
          }
        },

        editCellTemplate: (cellElement, cellInfo) => {
          cellElement.innerHTML = '';

          const wrapper = document.createElement('div');
          wrapper.style.display = 'flex';
          wrapper.style.alignItems = 'center';
          wrapper.style.justifyContent = 'center';
          wrapper.style.width = '100%';
          wrapper.style.height = '100%';

          // File upload input
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.pdf';
          input.style.width = '100%';
          input.style.marginRight = '6px';

          input.addEventListener('change', (event: any) => {
            const file = event.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                cellInfo.setValue(base64);
              };
              reader.readAsDataURL(file);
            }
          });

          wrapper.appendChild(input);

          // If already value exists, show the icon even in edit mode
          if (cellInfo.value) {
            const iconButton = document.createElement('button');
            iconButton.className =
              'btn btn-sm d-flex justify-content-center align-items-center';
            iconButton.title = 'View/Edit Attachment';
            iconButton.innerHTML =
              '<i class="fa fa-paperclip text-primary"></i>';
            iconButton.style.border = 'none';
            iconButton.style.background = 'transparent';
            iconButton.style.cursor = 'pointer';
            iconButton.style.marginLeft = '6px';

            iconButton.onclick = () => {
              this.selectedRowData = cellInfo.data;
              this.pdfFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
                'data:application/pdf;base64,' + cellInfo.data.Attachment
              );
              this.popupVisible = true;
            };

            wrapper.appendChild(iconButton);
          }

          cellElement.appendChild(wrapper);
        },
      },
      {
        dataField: 'LocationCode',
        caption: 'LocationCode',
        allowEditing: false,
      },
      {
        dataField: 'ResubmissionCount',
        caption: 'ResubmissionCount',
        allowEditing: false,
      },
      {
        dataField: 'EncounterTypeID',
        caption: 'EncounterTypeID',
        allowEditing: false,
      },
      {
        dataField: 'PaymentReference',
        caption: 'PaymentReference',
        allowEditing: false,
      },
      {
        dataField: 'RemittanceXMLFileName',
        caption: 'RemittanceXMLFileName',
        allowEditing: false,
      },
      {
        dataField: 'TransactionDate',
        caption: 'TransactionDate',
        allowEditing: false,
      },
      {
        dataField: 'RemittanceDays',
        caption: 'RemittanceDays',
        allowEditing: false,
      },
      {
        dataField: 'ResubmissionStage',
        caption: 'ResubmissionStage',
        allowEditing: false,
      },
    ];
  }

  updateActivityColumns() {
    this.Activitycolumns = [
      {
        dataField: 'ClaimActivityNumber',
        caption: 'Activity No',
        allowEditing: false,
      },
      {
        dataField: 'CPTType',
        caption: 'CPT Type',
        allowEditing: true,
        lookup: {
          dataSource: this.CPTTypeOptionsDataSource,
          displayExpr: 'DESCRIPTION',
          valueExpr: 'ID',
        },
      },
      {
        dataField: 'CPTCode',
        caption: 'CPT Code',
        allowEditing: true,
      },
      {
        dataField: 'TransactionType',
        caption: 'Claim Type',
        allowEditing: true,
        lookup: {
          dataSource: this.ClaimTypeOptionsDataSource,
          displayExpr: 'DESCRIPTION',
          valueExpr: 'ID',
        },
      },
      {
        dataField: 'Quantity',
        caption: 'Qty',
        allowEditing: true,
      },
      {
        dataField: 'StartDate',
        caption: 'Start Date',
        dataType: 'date',
        allowEditing: true,
      },
      {
        dataField: 'GrossAmt',
        caption: 'Gross',
        allowEditing: true,
      },
      {
        dataField: 'VATAmt',
        caption: 'VAT',
        allowEditing: true,
      },
      {
        dataField: 'OrderingClinician',
        caption: 'Ordering Clinician',
        allowEditing: true,
      },
      {
        dataField: 'Clinician',
        caption: 'Clinician',
        allowEditing: true,
      },
      {
        dataField: 'NetAmt',
        caption: 'Net Amount',
        allowEditing: false,
      },
      {
        dataField: 'PriorAuthorizationID',
        caption: 'Prior Auth ID',
        allowEditing: false,
      },
      {
        dataField: 'RejectedAmt',
        caption: 'Rjection Amount',
        allowEditing: false,
      },
      {
        dataField: 'DenialCode',
        caption: 'Denial Code',
        allowEditing: false,
      },
      {
        dataField: 'ActivityComments',
        caption: 'Remarks',
        allowEditing: false,
      },
      {
        dataField: 'Location',
        caption: 'Location',
        allowEditing: false,
      },
      {
        dataField: 'DispensedActivityID',
        caption: 'DispensedID',
        allowEditing: false,
      },
      {
        dataField: 'DenialText',
        caption: 'Denial Type',
        allowEditing: false,
      },
    ];
  }
  //=======update observation columns ==================
  updateObservationColumns() {
    this.ObservationColumns = [
      {
        dataField: 'ObservationCode',
        caption: 'Observation Code',
      },
      {
        dataField: 'ObservationType',
        caption: 'Observation Type',
        lookup: {
          dataSource: this.observationTypeDataSource,
          displayExpr: 'DESCRIPTION',
          valueExpr: 'DESCRIPTION',
        },
      },
      {
        dataField: 'ObservationValue',
        caption: 'Observation Value',
        allowFiltering: false,
        allowHeaderFiltering: false,
        width: '150',
        // Show 📎 icon only when ObservationType === 'File'
        cellTemplate: (container, options) => {
          container.innerHTML = '';
          const { ObservationType, ObservationValue } = options.data;
          if (ObservationType === 'File' && ObservationValue) {
            // Wrapper to fill and center the icon
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.justifyContent = 'center';
            wrapper.style.alignItems = 'center';
            wrapper.style.width = '100%';
            wrapper.style.height = '100%';

            // Icon button
            const iconButton = document.createElement('button');
            iconButton.className = 'btn btn-sm';
            iconButton.title = 'View Attachment';
            iconButton.innerHTML =
              '<i class="fa fa-paperclip text-primary"></i>';
            iconButton.style.border = 'none';
            iconButton.style.background = 'transparent';
            iconButton.style.cursor = 'pointer';
            iconButton.style.width = '100%';
            iconButton.style.height = '100%';
            iconButton.style.display = 'flex';
            iconButton.style.justifyContent = 'center';
            iconButton.style.alignItems = 'center';

            // Click to preview
            iconButton.onclick = () => {
              this.selectedRowData = options.data;
              this.pdfFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
                'data:application/pdf;base64,' + ObservationValue
              );
              this.ObservationpopupVisible = true;
            };

            wrapper.appendChild(iconButton);
            container.appendChild(wrapper);
          } else {
            // Show text value if not a File type
            container.innerText = ObservationValue ?? '';
          }
        },

        // Show file input ONLY when ObservationType === 'File'
        editCellTemplate: (cellElement, cellInfo) => {
          const { ObservationType } = cellInfo.data;
          cellElement.innerHTML = '';

          if (ObservationType === 'File') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.pdf';
            input.style.width = '100%';

            input.addEventListener('change', (event: any) => {
              const file = event.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                  const base64 = (reader.result as string).split(',')[1];
                  cellInfo.setValue(base64);
                };
                reader.readAsDataURL(file);
              }
            });

            cellElement.appendChild(input);
          } else {
            // Default text editor for non-file rows
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'form-control';
            input.value = cellInfo.value ?? '';
            input.oninput = (e: any) => cellInfo.setValue(e.target.value);
            cellElement.appendChild(input);
          }
        },
      },
      {
        dataField: 'ValueType',
        caption: 'Value Type',
      },
      {
        dataField: 'FileID',
        caption: 'File ID',
      },
    ];
  }
  //////=======================================================================
  onPendingRowClicked(e: any) {
    this.pendingListrowData = e.data;
    this.FacilityValue = [this.pendingListrowData.FacilityID];
    this.ReceiverID = this.pendingListrowData.ReceiverID;
    this.PayerIDValue = this.pendingListrowData.PayerID;
    this.RevisionDocNumber = this.pendingListrowData.ResubmissionRevisionUID;

    this.resubsrvce
      .get_select_Resubmission_Revision_Data(this.RevisionDocNumber)
      .subscribe((res: any) => {
        if (res) {
          this.isLoading = true;
          this.update_claimData_Columns();
          this.focusedRow = null;
          this.SubmissionActivityColumns = [];
          this.DiagnosisColumns = [];
          this.DiagnosisDataSource = [];
          this.ActivityDataSource = [];
          this.FilteredRevisionDataSource = [];
          this.originalRevisionData = [];

          this.FilteredRevisionDataSource = res.RevisionBillData;
          this.originalRevisionData = res.RevisionBillData;
          this.isContentVisible = true;
          this.PendingListpopupVisible = false;
          this.isLoading = false;
        }
      });
  }
  //============ Get all Data source Of the drill dowm ===========
  get_activity_diagnosis_dataSource(e: any) {
    if (e.row && e.row.key) {
      this.isLoading = true;
      console.log('selected row data :', e.row);
      const resubmissionType = e.row.data?.ResubmissionType;

      if (!resubmissionType) {
        this.isLoading = false;
        return;
      }

      // Save previous focused row's data if still selected
      if (this.previousFocusedRowUID) {
        const isPreviouslySelected = this.selectedMainGridRows?.some(
          (row) =>
            row.ResubmissionRevisionBatchUID === this.previousFocusedRowUID ||
            row.ResubmissionRevisionBatchBillUID === this.previousFocusedRowUID
        );

        if (isPreviouslySelected) {
          const prevIndex = this.FilteredRevisionDataSource.findIndex(
            (row) =>
              row.ResubmissionRevisionBatchUID === this.previousFocusedRowUID ||
              row.ResubmissionRevisionBatchBillUID ===
                this.previousFocusedRowUID
          );

          if (prevIndex !== -1) {
            this.FilteredRevisionDataSource[prevIndex] = {
              ...this.FilteredRevisionDataSource[prevIndex],
              Activity: [...this.ActivityDataSource],
              Observation: [...this.ObservationDataSource],
              Diagnosis: [...this.DiagnosisDataSource],
            };
            console.log(
              'latest main datagrid data list- already selected',
              this.FilteredRevisionDataSource
            );
          }
        }
      }

      this.focusedRow = e.row.key;
      this.previousFocusedRowUID = e.row.key;

      const ClaimNumber = e.row.data.ClaimNumber;
      const FacilityID = e.row.data.FacilityID;
      const ResubmissionType = e.row.data.ResubmissionType;

      // Use ResubmissionRevisionBillUID if IsEditing is true, otherwise ResubmissionAllocationBillUID
      const AllocationUID = e.row.data.ResubmissionRevisionUID;
      this.resubsrvce
        .get_CliamDetails_Data(
          ClaimNumber,
          FacilityID,
          ResubmissionType,
          AllocationUID
        )
        .subscribe((response: any) => {
          this.isLoading = false;
          this.updateActivityColumns();
          this.filteredObservationdataSource = [];
          const matchedRowIndex = this.FilteredRevisionDataSource.findIndex(
            (row) =>
              row.ResubmissionRevisionBillUID === this.focusedRow ||
              row.ResubmissionRevisionBatchBillUID === this.focusedRow
          );
          const matchedRow = this.FilteredRevisionDataSource[matchedRowIndex];

          // Load Activity
          this.ActivityDataSource = matchedRow?.Activity?.length
            ? matchedRow.Activity
            : response.Activity.map((item: any) => ({
                ...item,
                StartDate: this.service.formatDate(item.StartDate),
                compositeKey: `${item.ClaimActivityUID}_${item.ClaimRemittanceHeaderUID}`,
              }));

          // Load Observation
          this.ObservationDataSource = matchedRow?.Observation?.length
            ? matchedRow.Observation
            : response.ActivityObservation;

          // Load Diagnosis
          this.DiagnosisDataSource = matchedRow?.Diagnosis?.length
            ? matchedRow.Diagnosis
            : response.Diagnosis;

          // Save current row's data
          if (matchedRowIndex !== -1) {
            this.FilteredRevisionDataSource[matchedRowIndex] = {
              ...this.FilteredRevisionDataSource[matchedRowIndex],
              Activity: [...this.ActivityDataSource],
              Observation: [...this.ObservationDataSource],
              Diagnosis: [...this.DiagnosisDataSource],
            };
            console.log(
              'latest main datagrid data list- newly selected',
              this.FilteredRevisionDataSource
            );
          }

          this.SubmissionActivityColumns = response.ActivityColumns;
          this.DiagnosisColumns = response.DiagnosisColumns;
        });
    }
  }
  //======== Keep selected rows data of revision datagrid ========
  onMainGridSelectionChanged(e: any) {
    const newlySelected = e.selectedRowsData;

    // Find rows that were unselected
    const unselectedRows = this.selectedMainGridRows.filter(
      (oldRow) =>
        !newlySelected.some(
          (newRow) =>
            newRow.ResubmissionAllocationBillUID ===
            oldRow.ResubmissionAllocationBillUID
        )
    );

    // Remove Activity, Observation, Diagnosis of unselected rows
    unselectedRows.forEach((row) => {
      const index = this.FilteredRevisionDataSource.findIndex(
        (item) =>
          item.ResubmissionAllocationBillUID ===
          row.ResubmissionAllocationBillUID
      );

      if (index !== -1) {
        delete this.FilteredRevisionDataSource[index].Activity;
        delete this.FilteredRevisionDataSource[index].Observation;
        delete this.FilteredRevisionDataSource[index].Diagnosis;
      }
    });

    // Update the selected row reference
    this.selectedMainGridRows = [...newlySelected];
  }
  //-------------- make background to editable columns ------------
  onCellPrepared(e: any) {
    if (e.rowType === 'header' && e.column?.allowEditing) {
      e.cellElement.style.backgroundColor = '#588c7e'; // Teal for editable header
      // e.cellElement.style.color = 'white';
    }
    if (e.rowType === 'data' && e.column?.allowEditing) {
      // e.cellElement.style.backgroundColor = 'var(--cell-bg-color)'; // Clear solid orange for editable cells
      e.cellElement.style.border = '1px solid var(--cell-bg-color)';
    }
  }
  //================= Claim datagrid on row update event =================
  onRowUpdated(e: any) {
    const updatedData = e.data;
    const rowKey = e.key;
    if (updatedData.ResubmissionType != null) {
      const isSameRow = this.lastUpdatedRowKey === rowKey;
      const isSameValue =
        this.lastResubmissionType === updatedData.ResubmissionType;
      if (!isSameRow || !isSameValue) {
        const mockEvent = {
          row: {
            key: rowKey,
            data: updatedData,
          },
        };
        // Update tracking values
        this.lastUpdatedRowKey = rowKey;
        this.lastResubmissionType = updatedData.ResubmissionType;
        setTimeout(() => {
          this.get_activity_diagnosis_dataSource(mockEvent);
          this.mainGrid.instance.selectRows([rowKey], true);
          this.mainGrid.instance.option('focusedRowKey', rowKey);
        });
      }
    }
  }
  //===========on tab click event==============
  onTabChange(index: number) {
    this.selectedIndex = index;
  }
  //================Row data drill down click event===================
  ActivityRowDrillDownClick(e: any) {
    const clickedData = e.data;
    const claimActivityUID = clickedData.ClaimActivityUID;
    const claimremittanceUID = clickedData.ClaimRemittanceUID;
    this.updateObservationColumns();
    this.filteredObservationdataSource = this.ObservationDataSource.filter(
      (item) =>
        item.ClaimActivityUID === claimActivityUID &&
        item.ClaimRemittanceUID === claimremittanceUID
    );
  }
  //=============== attachgment file popup operations ===============
  onClearAttachment() {
    const confirmClear = confirm(
      'Are you sure you want to clear the attachment?'
    );
    if (confirmClear && this.selectedRowData) {
      this.selectedRowData.Attachment = null;
      this.popupVisible = false;
      console.log('Attachment cleared');
    }
  }
  //=============== attachgment file popup operations ===============
  onBrowseNewAttachment() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.style.display = 'none';

    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (!file) return;

      const confirmUpdate = confirm(
        'Do you want to update the existing attachment?'
      );
      if (!confirmUpdate || !this.selectedRowData) return;

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        this.selectedRowData.Attachment = base64;
        this.pdfFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          'data:application/pdf;base64,' + base64
        );
        console.log('File updated in Base64');
      };
      reader.readAsDataURL(file);
    };
    document.body.appendChild(input);
    input.click();
  }
  //=============== attachgment file popup operations ===============
  onCancelAttachment() {
    this.popupVisible = false;
    this.ObservationpopupVisible = false;
  }

  //========================== Observation attachment adding ========================
  Observation_onClearAttachment() {
    const confirmClear = confirm(
      'Are you sure you want to clear the attachment?'
    );
    if (confirmClear && this.selectedRowData) {
      this.selectedRowData.ObservationValue = null;
      this.ObservationpopupVisible = false;
      console.log('Attachment cleared');
    }
  }
  //============= obdervation cell value updation event ==========
  Observation_onBrowseNewAttachment() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.style.display = 'none';

    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (!file) return;

      const confirmUpdate = confirm(
        'Do you want to update the existing attachment?'
      );
      if (!confirmUpdate || !this.selectedRowData) return;

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        this.selectedRowData.ObservationValue = base64;
        this.pdfFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          'data:application/pdf;base64,' + base64
        );
        console.log('File updated in Base64');
      };
      reader.readAsDataURL(file);
    };
    document.body.appendChild(input);
    input.click();
    this.ObservationpopupVisible = false;
  }

  //===============save data =====================
  save_revision_Batch_data() {
    const selectedRowsData = this.mainGrid.instance.getSelectedRowsData();
    const userid = sessionStorage.getItem('UserID');
    const finalObject = {
      UserID: userid,
      ResubmissionRevisionUID: this.RevisionDocNumber,
      FacilityID:
        Array.isArray(this.FacilityValue) && this.FacilityValue.length > 0
          ? this.FacilityValue.join(',')
          : '',

      ReceiverID:
        Array.isArray(this.ReceiverID) && this.ReceiverID.length > 0
          ? this.ReceiverID.join(',')
          : '',
      LocationCode: '',
      PayerID:
        Array.isArray(this.PayerIDValue) && this.PayerIDValue.length > 0
          ? this.PayerIDValue.join(',')
          : '',
      BatchBillData: selectedRowsData.map(
        ({ Activity, Observation, Diagnosis, ...rest }) => rest
      ),
      BatchActivityData: selectedRowsData.map((item) => item.Activity).flat(),
      BatchObservationData: selectedRowsData
        .map((item) => item.Observation)
        .flat(),
      BatchDiagnosisData: selectedRowsData.map((item) => item.Diagnosis).flat(),
    };

    this.resubsrvce
      .save_revision_Batch_Upload_Data(finalObject)
      .subscribe((response: any) => {
        if (response.flag == '1') {
          notify(
            {
              message: `${response.message}`,
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'success'
          );
          this.lookupPage.On_PopUp_Hiding();
        } else {
          notify(
            {
              message: `${response.message}`,
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'error'
          );
        }
      });
  }

  //========== update revision data ======================
  update_revision_Batch_data() {
    const rowId = this.EditRowData.ResubmissionRevisionBatchUID;
    const selectedRowsData = this.mainGrid.instance.getSelectedRowsData();
    console.log('selected rows data ::', selectedRowsData);
    const userid = sessionStorage.getItem('UserID');
    const finalObject = {
      ResubmissionRevisionBatchUID: rowId,
      UserID: userid,
      ResubmissionRevisionUID: this.RevisionDocNumber,
      FacilityID:
        Array.isArray(this.FacilityValue) && this.FacilityValue.length > 0
          ? this.FacilityValue.join(',')
          : '',
      ReceiverID:
        Array.isArray(this.ReceiverID) && this.ReceiverID.length > 0
          ? this.ReceiverID.join(',')
          : '',
      LocationCode: '',
      PayerID:
        Array.isArray(this.PayerIDValue) && this.PayerIDValue.length > 0
          ? this.PayerIDValue.join(',')
          : '',
      BatchBillData: selectedRowsData.map(
        ({ Activity, Observation, Diagnosis, ...rest }) => rest
      ),
      BatchActivityData: selectedRowsData.map((item) => item.Activity).flat(),
      BatchObservationData: selectedRowsData
        .map((item) => item.Observation)
        .flat(),
      BatchDiagnosisData: selectedRowsData.map((item) => item.Diagnosis).flat(),
    };

    this.resubsrvce
      .update_revision_Batch_Upload_Data(finalObject)
      .subscribe((response: any) => {
        if (response.flag == '1') {
          notify(
            {
              message: `${response.message}`,
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'success'
          );
          this.lookupPage.On_PopUp_Hiding();

          this.IsEditing = false;
        } else {
          notify(
            {
              message: `${response.message}`,
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'error'
          );
          this.lookupPage.On_PopUp_Hiding();
        }
      });
  }
}
@NgModule({
  imports: [
    CommonModule,
    DxDataGridModule,
    DxButtonModule,
    DxDataGridModule,
    DxDropDownButtonModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxLookupModule,
    DxPopupModule,
    FormPopupModule,
    AllocationPageModule,
    DxLoadPanelModule,
    DxTabsModule,
    DxTreeListModule,
    DxNumberBoxModule,
    ExcelImportLookupModule,
    DxDropDownBoxModule,
    DxValidatorModule,
    DxCheckBoxModule,
  ],
  providers: [],
  exports: [BatchUploadingPageComponent],
  declarations: [BatchUploadingPageComponent],
})
export class BatchUploadingModule {}
