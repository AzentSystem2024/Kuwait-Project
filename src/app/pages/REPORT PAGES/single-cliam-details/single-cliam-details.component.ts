import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  NgModule,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  DxDataGridModule,
  DxButtonModule,
  DxDropDownButtonModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxLookupModule,
  DxNumberBoxModule,
  DxTabsModule,
  DxLoadPanelModule,
  DxPopupModule,
  DxDropDownBoxModule,
  DxValidatorModule,
  DxValidatorComponent,
} from 'devextreme-angular';
import { FormPopupModule } from 'src/app/components';
import { ReportService } from 'src/app/services/Report-data.service';
import { ReportEngineService } from '../report-engine.service';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import CustomStore from 'devextreme/data/custom_store';
import { DxDropDownBoxTypes } from 'devextreme-angular/ui/drop-down-box';

@Component({
  selector: 'app-single-cliam-details',
  templateUrl: './single-cliam-details.component.html',
  styleUrls: ['./single-cliam-details.component.scss'],
  providers: [ReportService, ReportEngineService],
})
export class SingleCliamDetailsComponent implements OnInit {
  @ViewChild('facilityValidator', { static: false })
  facilityValidator!: DxValidatorComponent;
  @ViewChild('ClaimNumberValidator', { static: false })
  ClaimNumberValidator!: DxValidatorComponent;

  width: any = '100%';
  rtlEnabled: boolean = false;
  scrollByContent: boolean = true;
  showNavButtons: boolean = true;
  orientations: any = 'horizontal';
  stylingMode: any = 'primary';
  iconPosition: any = 'left';
  selectedRows: { [key: number]: any[] } = {};

  //====================DataSource Variables and Value Fields============
  TransactionDataSource: any;
  ActivityDataSource: any;
  DiagnosisDataSource: any;

  filteredActivityDataSource: any;
  filteredDiagnosisDataSource: any;
  // ================== Field Values ===================
  ClaimNumberValue: any;
  EmiratesIDvalue: any;
  ReceiverIDValue: any;
  PayerIDValue: any;
  IDPayerValue: any;
  MemberIDValue: any;
  ClaimCountValue: any;
  ClaimAmountValue: any;
  RemittanceAmountValue: any;
  RemittanceCountValue: any;
  //===============Column storing variables================
  transactionColumns: any;
  SubmisstionActivityColumns: any;
  DiagnosisColumns: any;

  isActivityGridVisible: boolean = false;
  isDiagnosisGridVisible: boolean = false;

  ClaimNumber: any;
  FacilityID: any;
  focusedRow: any = null;
  activityFocusRow: any;

  loadingVisible: boolean;
  isContentVisible: boolean = true;

  isEmptyDatagrid: boolean = true;
  RowData: any;

  detailColumns: any;
  claimDetailsDataSource: any;
  encounterDataSource: any;
  othersDataSource: any;
  ResubmissionDatasource: any[];
  ObservationDatasource: any;
  ObservationColumns: any;
  filteredObservationdataSource: any;
  remittanceDataSource: any[];
  AttechmentDataSource: any[];

  expandedRowKey: any = null;
  Facility_DataSource: any;

  isGridBoxOpened = false;

  selectedTabId: number = 1;

  //============tab dataSource
  SubmissiontabsWithText: any[];

  RemittancetabsWithText: any[];

  ResubmissiontabsWithText: any[];

  basicDataAvailable: boolean = false;
  isSubmissionClickVisible: boolean = false;
  isResubmissionClickVisible: boolean = false;
  isRemittanceClickVisible: boolean = false;
  attachmentButton = [
    {
      icon: 'attach',
      hint: 'View Attachments',
      visible: (e: any) => e.row.data.hasAttachment,
      onClick: (e: any) => {
        e.event.stopPropagation();
        console.log('Attachment clicked', e.row.data);
      },
    },
  ];

  constructor(
    private service: ReportService,
    private masterService: MasterReportService,
    private ref: ChangeDetectorRef
  ) {
    this.get_facility_datasource();
  }

  ngOnInit(): void {
    this.activityFocusRow = null;
    this.isActivityGridVisible = false;
    this.isDiagnosisGridVisible = false;
  }

  onTabChange(selectedTabId: number) {
    this.selectedTabId = selectedTabId;
  }

  facilityDisplayExpr = (item: any) => {
    return item ? `${item.FacilityLicense} - ${item.FacilityName}` : '';
  };

  get_facility_datasource() {
    this.masterService.Get_Facility_List_Data().subscribe((response: any) => {
      if (response.flag == '1') {
        this.Facility_DataSource = this.makeAsyncDataSourceFromJson(
          response.data
        );
      }
    });
  }

  //==================MAking cutom datasource for facility datagrid and dropdown loADING=======
  makeAsyncDataSourceFromJson(jsonData: any) {
    return new CustomStore({
      loadMode: 'raw',
      key: 'FacilityLicense',
      load: () => {
        return new Promise((resolve, reject) => {
          try {
            resolve(jsonData);
          } catch (error) {
            reject(error);
          }
        });
      },
    });
  }

  //==============instance facility selection==================
  onGridBoxOptionChanged(e: DxDropDownBoxTypes.OptionChangedEvent) {
    if (e.name === 'value') {
      this.isGridBoxOpened = false;
      this.ref.detectChanges();
    }
  }

  //=====================================================
  toggleContent() {
    this.isContentVisible = !this.isContentVisible;
  }
  //==========================Clear Button Clicked========================
  clearButtonAction() {
    this.basicDataAvailable = false;
    this.isSubmissionClickVisible = false;
    this.isResubmissionClickVisible = false;
    this.isRemittanceClickVisible = false;
    this.isEmptyDatagrid = true;
    this.TransactionDataSource = [];
    this.transactionColumns = [];
    this.ClaimNumberValue = '';
    this.EmiratesIDvalue = '';
    this.ReceiverIDValue = '';
    this.PayerIDValue = '';
    this.IDPayerValue = '';
    this.MemberIDValue = '';
    this.ClaimCountValue = '';
    this.ClaimAmountValue = '';
    this.RemittanceAmountValue = '';
    this.RemittanceCountValue = '';
    this.ClaimNumber = '';
    this.FacilityID = '';
  }
  //=========================Datagrid Show Attachment Click===============
  onAttachmentClick(event: any) {
    event.event.stopPropagation(); //  Prevents row click event
  }

  //===============Get all Data source Of the drill dowm ==================
  get_All_DataSource() {
    const FacilityvalidationResult = this.facilityValidator.instance.validate();
    const ClaimvalidationResult = this.ClaimNumberValidator.instance.validate();

    if (FacilityvalidationResult.isValid && ClaimvalidationResult.isValid) {
      this.TransactionDataSource = '';
      this.isSubmissionClickVisible = false;
      this.isResubmissionClickVisible = false;
      this.isRemittanceClickVisible = false;
      this.loadingVisible = true;
      this.isContentVisible = true;
      this.service
        .get_CliamDetails_DrillDown_Data(
          this.ClaimNumber,
          this.FacilityID.join(',')
        )
        .subscribe((response: any) => {
          this.ClaimNumberValue = response.Summary[0].ClaimNumber;
          this.EmiratesIDvalue = response.Summary[0].EmiratesIDNumber;
          this.ReceiverIDValue = response.Summary[0].ReceiverID;
          this.PayerIDValue = response.Summary[0].PayerID;
          this.IDPayerValue = response.Summary[0].IDPayer;
          this.MemberIDValue = response.Summary[0].MemberID;
          this.ClaimCountValue = response.Summary[0].ClaimCount;
          this.ClaimAmountValue = response.Summary[0].ClaimAmount;
          this.RemittanceAmountValue = response.Summary[0].RemittanceAmount;
          this.RemittanceCountValue = response.Summary[0].RemittanceCount;
          this.DiagnosisDataSource = response.Diagnosis;
          this.ActivityDataSource = response.Activity.map((item) => {
            return {
              ...item,
              StartDate: this.service.formatDate(item.StartDate),
            };
          });
          this.TransactionDataSource = response.Transaction.map((item) => {
            return {
              ...item,
              TransactionDate: this.service.formatDate(item.TransactionDate),
            };
          });
          this.transactionColumns = response.TransactionColumns;
          this.SubmisstionActivityColumns = response.ActivityColumns;
          this.DiagnosisColumns = response.DiagnosisColumns;
          this.ObservationDatasource = response.ActivityObservation;
          this.ObservationColumns = response.ObservationColumns;
          this.basicDataAvailable = true;
          this.focusedRow = this.TransactionDataSource[0].TransactionDate;
          this.onTransactionGridFocusedRowChanged({
            row: { data: this.TransactionDataSource[0] },
          });
          this.loadingVisible = false;
          this.isEmptyDatagrid = false;
        });
    }
  }

  //=================row selection event of transaction table=============
  onTransactionGridFocusedRowChanged(e: any) {
    if (e.row && e.row.key) {
      this.focusedRow = e.row.key;
    }
    this.loadingVisible = true;
    this.activityFocusRow = null;
    this.selectedTabId = 1;
    this.isSubmissionClickVisible = false;
    this.isResubmissionClickVisible = false;
    this.isRemittanceClickVisible = false;

    // Reset Data Sources
    this.filteredActivityDataSource = [];
    this.filteredDiagnosisDataSource = [];
    this.claimDetailsDataSource = [];
    this.encounterDataSource = [];
    this.othersDataSource = [];
    this.ResubmissionDatasource = [];
    this.remittanceDataSource = [];

    let TransactionType = e.row.data.TransactionType;
    let facilityID = this.FacilityID.join(',');
    let selectedRowClaimRemittanceHeaderUID =
      e.row.data.ClaimRemittanceHeaderUID;
    let selectedRowClaimRemittanceUID = e.row.data.ClaimRemittanceUID;
    let selectedRowSerialNumber = e.row.data.SerialNumber;
    let hasAttachment = e.row.data.hasAttachment;

    if (TransactionType.includes('Submission')) {
      this.service
        .get_CliamDetails_InnerDrillDown_Submission_Data(
          facilityID,
          selectedRowClaimRemittanceHeaderUID,
          selectedRowClaimRemittanceUID
        )
        .subscribe((response: any) => {
          if (response.flag === '1') {
            this.claimDetailsDataSource = [response.submission];
            this.encounterDataSource = [response.encounter];
            this.othersDataSource = [response.others];
          }
          this.SubmissiontabsWithText = [
            { id: 1, text: 'Submission Activities' },
            { id: 2, text: 'Diagnosis' },
            { id: 3, text: 'Encounter Details' },
            { id: 4, text: 'Others' },
          ];

          if (hasAttachment) {
            this.SubmissiontabsWithText.push({ id: 5, text: 'Attachments' });
          }
          this.loadingVisible = false;
          this.isSubmissionClickVisible = true;
        });
    } else if (TransactionType.includes('Resubmission')) {
      this.service
        .get_CliamDetails_InnerDrillDown_Resubmission_Data(
          facilityID,
          selectedRowClaimRemittanceHeaderUID,
          selectedRowClaimRemittanceUID
        )
        .subscribe((response: any) => {
          if (response.flag === '1') {
            this.claimDetailsDataSource = [response.resubmission]; // Corrected
            this.encounterDataSource = [response.encounter];
            this.othersDataSource = [response.others];
            this.ResubmissionDatasource = [response.resubmission];
          }
          this.ResubmissiontabsWithText = [
            { id: 1, text: 'Submission Activities' },
            { id: 2, text: 'Resubmission Details' },
            { id: 3, text: 'Encounter Details' },
            { id: 4, text: 'Others' },
          ];

          if (hasAttachment) {
            this.ResubmissiontabsWithText.push({ id: 5, text: 'Attachments' });
          }
          this.isResubmissionClickVisible = true;
          this.loadingVisible = false;
        });
    } else if (TransactionType.includes('Remittance')) {
      this.service
        .get_CliamDetails_InnerDrillDown_Remittance_Data(
          facilityID,
          selectedRowClaimRemittanceHeaderUID,
          selectedRowClaimRemittanceUID
        )
        .subscribe((response: any) => {
          if (response.flag === '1') {
            this.remittanceDataSource = [response.remittance];
            this.othersDataSource = [response.others];
          }
          this.RemittancetabsWithText = [
            { id: 1, text: 'Remittance Activity' },
            { id: 2, text: 'Others' },
          ];

          if (hasAttachment) {
            this.RemittancetabsWithText.push({ id: 3, text: 'Attachments' });
          }
          this.isRemittanceClickVisible = true;
          this.loadingVisible = false;
        });
    }

    // Filter Activity and Diagnosis Data
    this.filteredActivityDataSource = this.ActivityDataSource.filter(
      (item) =>
        item.ClaimRemittanceHeaderUID === selectedRowClaimRemittanceHeaderUID
    );

    this.filteredDiagnosisDataSource = this.DiagnosisDataSource.filter(
      (item) =>
        item.ClaimRemittanceHeaderUID === selectedRowClaimRemittanceHeaderUID &&
        item.ClaimRemittanceUID === selectedRowClaimRemittanceUID &&
        item.SerialNumber === selectedRowSerialNumber
    );
    // Show Activity Grid
    this.isActivityGridVisible = true;
  }

  // //================Row data drill down click event===================
  ActivityRowDrillDownClick(e: any) {
    if (this.expandedRowKey !== null && this.expandedRowKey !== e.key) {
      e.component.collapseRow(this.expandedRowKey);
    }
    this.expandedRowKey = e.key;

    const rowKey = e.key;
    const expandedRowData = e.component
      .getDataSource()
      .items()
      .find((item) => item.ClaimActivityNumber === rowKey);

    let claimActivityUID = expandedRowData.ClaimActivityUID;
    let claimremittanceUID = expandedRowData.ClaimRemittanceUID;

    this.filteredObservationdataSource = this.ObservationDatasource.filter(
      (item) =>
        item.ClaimActivityUID === claimActivityUID &&
        item.ClaimRemittanceUID === claimremittanceUID
    );
    // console.log('Activity row expanded:', expandedRowData);
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
    DxNumberBoxModule,
    FormPopupModule,
    DxTabsModule,
    DxLoadPanelModule,
    DxPopupModule,
    DxDropDownBoxModule,
    DxValidatorModule,
  ],
  providers: [],
  exports: [SingleCliamDetailsComponent],
  declarations: [SingleCliamDetailsComponent],
})
export class SingleCliamDetailsModule {}
