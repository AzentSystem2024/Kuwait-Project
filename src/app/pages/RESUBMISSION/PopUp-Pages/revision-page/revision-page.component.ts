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
  DxDataGridComponent,
  DxCheckBoxModule,
} from 'devextreme-angular';
import { FormPopupModule } from 'src/app/components';

import { ReportService } from 'src/app/services/Report-data.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import notify from 'devextreme/ui/notify';
import { MasterReportService } from '../../../MASTER PAGES/master-report.service';
import { ResubmissionServiceService } from '../../resubmission-service.service';
import { AllocationPageModule } from '../allocation-page/allocation-page.component';
import { ExcelImportLookupModule } from '../excel-import-lookup-page/excel-import-lookup-page.component';
import { RevisionLookupPageComponent } from '../../revision-lookup-page/revision-lookup-page.component';

@Component({
  selector: 'app-revision-page',
  templateUrl: './revision-page.component.html',
  styleUrl: './revision-page.component.scss',
  providers: [ReportService, MasterReportService],
})
export class RevisionPageComponent implements OnInit {
  @ViewChild('mainDatagrid', { static: false }) mainGrid: DxDataGridComponent;

  @Input() IsEditing: boolean = false;
  @Input() EditRowData: any;

  readonly allowedPageSizes: any = [15, 25, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;

  //=========================
  width: any = '100%';
  rtlEnabled: boolean = false;
  scrollByContent: boolean = true;
  showNavButtons: boolean = true;
  orientations: any = 'horizontal';
  stylingMode: any = 'primary';
  iconPosition: any = 'left';
  selectedRows: { [key: number]: any[] } = {};
  selectedTab: number = 0;
  selectedIndex: number = 0;

  SubmissionActivityColumns: any;
  DiagnosisColumns: any;
  DiagnosisDataSource: any;
  ActivityDataSource: any;

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
  //============================
  AllocationUid: any;
  Allocation_DataSource: any;
  ReceiverID: any = [];
  PayerID: any = [];
  Remarks: any;

  allocationMasterDatacolumns: any = [
    {
      dataField: 'AllocationID',
      caption: 'Allocation ID',
      dataType: 'number',
      width: 'auto',
    },
    {
      dataField: 'AllocationDate',
      caption: 'Allocation Date',
      dataType: 'date',
      format: 'yyyy-MM-dd',
      width: 'auto',
    },
    {
      dataField: 'SelectedClaimCount',
      caption: 'Selected Claim Count',
      dataType: 'number',
      width: 'auto',
    },
    {
      dataField: 'Facility',
      caption: 'Facility',
      dataType: 'string',
    },
    {
      dataField: 'AllocatedTo',
      caption: 'Allocated To',
      dataType: 'string',
      width: 'auto',
    },
    {
      dataField: 'AllocatedUser',
      caption: 'Allocated User',
      dataType: 'string',
      width: 'auto',
    },
    {
      dataField: 'StatusName',
      caption: 'Status Name',
      dataType: 'string',
      width: 'auto',
    },
    {
      dataField: 'Remarks',
      caption: 'Remarks',
      dataType: 'string',
      width: 'auto',
    },
  ];

  FilteredRevisionDataSource: any;
  isContentVisible: boolean = true;
  resubmissionTypeOptions: any;
  observationTypeOptions: any;
  receiverList: any;
  AllotedByValue: any;
  payerValue: any;
  ObservationDataSource: any;
  userID: any;
  originalRevisionData: any;
  payerDataList: any;

  filteredObservationdataSource: any;
  ObservationColumns: any = [];
  ClaimTypeOptions: any;
  CPTTypeOptions: any;

  Activitycolumns: any = [];
  ClaimDataColumns: any = [];

  focusedRow: any = null;
  previousFocusedRowUID: any = null;
  selectedMainGridRows: any[] = [];

  popupVisible = false;
  pdfFileUrl: SafeResourceUrl | null = null;

  dialoguepopupVisible = false;
  selectedRowData: any = null;

  isLoading: boolean = false;

  lastUpdatedRowKey: any = null;
  lastResubmissionType: any = null;

  pdfPopupVisibleForObservation = false;
  pdfObservationFileUrl: any = null;
  selectedObservationRowData: any = null;
  ObservationpopupVisible: boolean = false;

  IsFinalized: boolean = false;
  savingInProgress: boolean = false;
  saveButtonOptions: any = {
    text: 'Save',
    icon: 'save',
    type: 'default',
    disabled: this.savingInProgress,
    onClick: () => {
      this.savingInProgress = true;
      if (this.IsEditing == true) {
        this.update_revision_data();
      } else {
        this.save_revision_data();
      }
    },
  };

  constructor(
    private resubsrvce: ResubmissionServiceService,
    private service: ReportService,
    private masterService: MasterReportService,
    private sanitizer: DomSanitizer,
    private lookupPage: RevisionLookupPageComponent
  ) {
    this.fetch_allocation_master_data();
    this.get_dropdown_dataList();
    this.update_claimData_Columns();
  }

  ngOnInit() {
    this.masterService
      .Get_GropDown('RESUBMISSION_TYPES')
      .subscribe((response: any) => {
        this.resubmissionTypeOptions = response;

        this.update_claimData_Columns();

        if (this.IsEditing && this.EditRowData) {
          if (this.ClaimDataColumns.length > 0) {
            this.isLoading = true;

            this.focusedRow = null;
            this.SubmissionActivityColumns = [];
            this.DiagnosisColumns = [];
            this.DiagnosisDataSource = [];
            this.ActivityDataSource = [];
            this.FilteredRevisionDataSource = [];
            this.originalRevisionData = [];
            const editData = this.EditRowData; // Assuming it's an array with one item
            this.AllocationUid =
              parseInt(editData.ResubmissionAllocationUID, 10) || 0;
            this.IsFinalized = editData.IsFinalized ?? false;
            this.ReceiverID = editData.ReceiverID || [];
            this.AllotedByValue = editData.AllocatedUserID || null;
            this.PayerID = editData.PayerID || null;
            this.Remarks = editData.Remarks || '';

            this.FilteredRevisionDataSource = editData.RevisionBillData;
            this.originalRevisionData = editData.RevisionBillData;
            // this.IsEditing = false;
            if (this.resubmissionTypeOptions && this.ClaimDataColumns) {
              this.isContentVisible = true;
            }
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
          dataSource: this.CPTTypeOptions,
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
          dataSource: this.ClaimTypeOptions,
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
          dataSource: this.observationTypeOptions,
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

  onEditAttachmentClick(rowData: any) {
    this.selectedRowData = rowData;
    if (rowData.Attachment) {
      this.pdfFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        'data:application/pdf;base64,' + rowData.Attachment
      );
      this.popupVisible = true;
    } else {
      alert('No file available to preview!');
    }
  }

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

  onObservationCellValueChanged(e: any): void {
    if (e.column?.dataField === 'ObservationType') {
      if (e.value === 'File') {
        this.selectedRowData.ObservationValue = null;
      }
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
    console.log('updated claim data::>>', this.FilteredRevisionDataSource);
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

  get_dropdown_dataList() {
    this.masterService
      .Get_GropDown('RESUBMISSION_TYPES')
      .subscribe((response: any) => {
        this.resubmissionTypeOptions = response;
      });

    this.masterService.Get_GropDown('RECEIVER').subscribe((response: any) => {
      this.receiverList = response;
    });

    this.masterService.Get_GropDown('PAYER').subscribe((response: any) => {
      this.payerDataList = response;
    });

    this.masterService.Get_GropDown('CPT_TYPES').subscribe((response: any) => {
      this.CPTTypeOptions = response;
    });

    this.masterService
      .Get_GropDown('OBSERVATION_TYPE')
      .subscribe((response: any) => {
        this.observationTypeOptions = response;
      });

    this.masterService
      .Get_GropDown('CLAIM_TYPES')
      .subscribe((response: any) => {
        this.ClaimTypeOptions = response;
      });
  }

  //================Show and Hide Search parameters========
  toggleContent() {
    this.isContentVisible = !this.isContentVisible;
  }

  //===========on tab click event==============
  onTabChange(index: number) {
    this.selectedIndex = index;
  }

  //====== close dropdown datagrid after selec a value =====
  onGridSelectionChanged(e: any, dropDownRef: any): void {
    if (e && e.selectedRowsData && e.selectedRowsData.length > 0) {
      const selectedRowData = e.selectedRowsData[0]; // Get full data of the selected row
      this.AllotedByValue = selectedRowData.AllocatedUser;
      this.userID = selectedRowData.userID;
      dropDownRef.instance.close();
    }
  }
  // ============ get allocation drop down master list =====
  fetch_allocation_master_data() {
    this.resubsrvce
      .get_resubmission_LogData_List()
      .subscribe((response: any) => {
        if (response) {
          this.Allocation_DataSource =
            this.resubsrvce.makeAsyncDataSourceFromJson(
              response.Data,
              'AllocationID'
            );
        }
      });
  }

  //================ filter list using receiver id ============
  filterByReceiver() {
    console.log('filtered value is :>>', this.ReceiverID);
    if (this.ReceiverID) {
      this.FilteredRevisionDataSource = this.originalRevisionData.filter(
        (item) => item.ReceiverID === this.ReceiverID
      );
    } else {
      this.FilteredRevisionDataSource = [...this.originalRevisionData];
    }
  }

  //================ filter list using payer id ============
  filterByPayerId() {
    if (this.PayerID) {
      this.FilteredRevisionDataSource = this.originalRevisionData.filter(
        (item) => item.PayerID === this.PayerID
      );
    } else {
      this.FilteredRevisionDataSource = [...this.originalRevisionData];
    }
  }
  // ==============================
  onAllocationChange(e: any): void {
    if (this.IsEditing === false) {
      this.get_revisionData_List();
    }
  }

  //============ fetch revision data list ==================
  get_revisionData_List() {
    this.focusedRow = null;
    this.SubmissionActivityColumns = [];
    this.DiagnosisColumns = [];
    this.DiagnosisDataSource = [];
    this.ActivityDataSource = [];
    this.FilteredRevisionDataSource = [];
    this.originalRevisionData = [];
    this.isLoading = true;
    let allocationId = Array.isArray(this.AllocationUid)
      ? this.AllocationUid[0]?.toString()
      : this.AllocationUid?.toString();
    this.resubsrvce
      .get_resubmission_revision_Data(allocationId)
      .subscribe((response: any) => {
        if (response.Flag == '1') {
          this.update_claimData_Columns();
          this.FilteredRevisionDataSource = response.Data.map((item) => ({
            ...item,
            Comment: '',
            Attachment: null,
            ResubmissionType: null,
          }));
          this.originalRevisionData = response.Data.map((item) => ({
            ...item,
            Comment: '',
            Attachment: null,
            ResubmissionType: null,
          }));
          this.isContentVisible = false;
          this.isLoading = false;
        }
        this.isLoading = false;
      });
  }

  //================ save revision data ===================
  save_revision_data() {
    const selectedRowsData = this.mainGrid.instance.getSelectedRowsData();
    const userid = sessionStorage.getItem('UserID');
    const finalObject = {
      UserID: userid,
      ResubmissionAllocationUID: this.AllocationUid.toString(),
      AllocatedUserID: this.userID,
      ReceiverID:
        Array.isArray(this.ReceiverID) && this.ReceiverID.length > 0
          ? this.ReceiverID.join(',')
          : '',
      IsFinalized: this.IsFinalized ? 1 : 0,
      LocationCode: '',
      Remarks: this.Remarks,
      PayerID:
        Array.isArray(this.PayerID) && this.PayerID.length > 0
          ? this.PayerID.join(',')
          : '',
      RevisionBillData: selectedRowsData.map(
        ({ Activity, Observation, Diagnosis, ...rest }) => rest
      ),
      RevisionActivityData: selectedRowsData
        .map((item) => item.Activity)
        .flat(),
      RevisionObservationData: selectedRowsData
        .map((item) => item.Observation)
        .flat(),
      RevisionDiagnosisData: selectedRowsData
        .map((item) => item.Diagnosis)
        .flat(),
    };

    this.resubsrvce
      .save_Resubmission_Revision_Data(finalObject)
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
          this.get_revisionData_List();
          this.savingInProgress = false;
        } else {
          notify(
            {
              message: `${response.message}`,
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'error'
          );
          this.savingInProgress = false;
        }
      });
  }

  //========== update revision data ======================
  update_revision_data() {
    const rowId = this.EditRowData.ResubmissionRevisionUID;
    const selectedRowsData = this.mainGrid.instance.getSelectedRowsData();
    const userid = sessionStorage.getItem('UserID');
    const finalObject = {
      ResubmissionRevisionUID: rowId,
      UserID: userid,
      IsFinalized: this.IsFinalized ? 1 : 0,
      ResubmissionAllocationUID: this.AllocationUid.toString(),
      AllocatedUserID: this.AllotedByValue,
      ReceiverID:
        Array.isArray(this.ReceiverID) && this.ReceiverID.length > 0
          ? this.ReceiverID.join(',')
          : '',
      LocationCode: '',
      Remarks: this.Remarks,
      PayerID:
        Array.isArray(this.PayerID) && this.PayerID.length > 0
          ? this.PayerID.join(',')
          : '',
      RevisionBillData: selectedRowsData.map(
        ({ Activity, Observation, Diagnosis, ...rest }) => rest
      ),
      RevisionActivityData: selectedRowsData
        .map((item) => item.Activity)
        .flat(),
      RevisionObservationData: selectedRowsData
        .map((item) => item.Observation)
        .flat(),
      RevisionDiagnosisData: selectedRowsData
        .map((item) => item.Diagnosis)
        .flat(),
    };

    this.resubsrvce
      .update_Resubmission_Revision_Data(finalObject)
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
          this.get_revisionData_List();
          this.savingInProgress = false;
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
          this.savingInProgress = false;
        }
      });
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
  //============ Get all Data source Of the drill dowm ===========
  get_activity_diagnosis_dataSource(e: any) {
    if (e.row && e.row.key) {
      this.isLoading = true;
      const resubmissionType = e.row.data?.ResubmissionType;

      if (!resubmissionType) {
        this.isLoading = false;
        return;
      }

      // Save previous focused row's data if still selected
      if (this.previousFocusedRowUID) {
        const isPreviouslySelected = this.selectedMainGridRows?.some(
          (row) =>
            row.ResubmissionAllocationBillUID === this.previousFocusedRowUID ||
            row.ResubmissionRevisionBillUID === this.previousFocusedRowUID
        );

        if (isPreviouslySelected) {
          const prevIndex = this.FilteredRevisionDataSource.findIndex(
            (row) =>
              row.ResubmissionAllocationBillUID ===
                this.previousFocusedRowUID ||
              row.ResubmissionRevisionBillUID === this.previousFocusedRowUID
          );

          if (prevIndex !== -1) {
            this.FilteredRevisionDataSource[prevIndex] = {
              ...this.FilteredRevisionDataSource[prevIndex],
              Activity: [...this.ActivityDataSource],
              Observation: [...this.ObservationDataSource],
              Diagnosis: [...this.DiagnosisDataSource],
            };
            console.log(
              'latest main datagrid data list - previous',
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
      const AllocationUID = this.IsEditing
        ? e.row.data.ResubmissionRevisionBillUID
        : e.row.data.ResubmissionAllocationBillUID;

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
              row.ResubmissionAllocationBillUID === this.focusedRow ||
              row.ResubmissionRevisionBillUID === this.focusedRow
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
              'latest main datagrid data list',
              this.FilteredRevisionDataSource
            );
          }

          this.SubmissionActivityColumns = response.ActivityColumns;
          this.DiagnosisColumns = response.DiagnosisColumns;
        });
    }
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
  exports: [RevisionPageComponent],
  declarations: [RevisionPageComponent],
})
export class RevisionPageModule {}
