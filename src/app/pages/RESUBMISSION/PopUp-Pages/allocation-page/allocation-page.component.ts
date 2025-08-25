import { AllocationLookUpComponent } from './../../allocation-look-up/allocation-look-up.component';
import { CommonModule, formatDate } from '@angular/common';
import { Component, NgModule, ViewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  DxButtonModule,
  DxDataGridModule,
  DxDropDownButtonModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxLookupModule,
  DxResizableModule,
  DxDropDownBoxModule,
  DxFormModule,
  DxDateBoxModule,
  DxToolbarModule,
  DxAccordionModule,
  DxCheckBoxModule,
  DxSliderModule,
  DxTagBoxModule,
  DxTemplateModule,
  DxPopupModule,
  DxTreeViewModule,
  DxSortableModule,
  DxTabPanelModule,
  DxListModule,
  DxValidatorModule,
  DxValidationSummaryModule,
  DxLoadPanelModule,
  DxLookupComponent,
  DxDataGridComponent,
  DxNumberBoxModule,
  DxTreeListModule,
  DxTreeListComponent,
  DxTabsModule,
} from 'devextreme-angular';
import { FormPopupModule } from 'src/app/components';
import { AdvanceFilterPopupModule } from '../../../POP-UP_PAGES/advance-filter-popup/advance-filter-popup.component';
import { ClaimDetailActivityDrillDownModule } from '../../../REPORT DRILL PAGES/claim-detail-activity-drill-down/claim-detail-activity-drill-down.component';
import CustomStore from 'devextreme/data/custom_store';
import { ReportService } from 'src/app/services/Report-data.service';
import { MasterReportService } from '../../../MASTER PAGES/master-report.service';
import { ResubmissionServiceService } from '../../resubmission-service.service';
import notify from 'devextreme/ui/notify';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { saveAs } from 'file-saver';
import { Workbook } from 'exceljs';
import * as XLSX from 'xlsx';
import { Input, OnInit } from '@angular/core';
@Component({
  selector: 'app-allocation-page',
  templateUrl: './allocation-page.component.html',
  styleUrls: ['./allocation-page.component.scss'],
  providers: [ReportService, ResubmissionServiceService],
})
export class AllocationPageComponent implements OnInit {
  @Input() editRowData: any = null;

  @ViewChild('lookup', { static: false }) lookup: DxLookupComponent;

  @ViewChild(DxTreeListComponent, { static: false })
  treeList!: DxTreeListComponent;

  @ViewChild('dataGrid1', { static: false }) dataGrid1!: DxDataGridComponent;
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;

  readonly allowedPageSizes: any = [5, 10, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;

  isContentVisible: boolean = true;
  Facility_Value: any;
  Facility_DataSource: any;
  SearchOn_DataSource: any[];
  SearchOn_Value: any;
  selectedYear: any;
  years: any[] = [];
  monthDataSource: any;
  selectedmonth: any;
  From_Date_Value: any;
  minDate: any;
  maxDate: any;
  To_Date_Value: any;
  EncounterType_DataSource: any[];
  EncounterType_Value: any;
  Payer_DataSource: any[];
  Payer_Value: any;
  PayerID_Value: any[];
  PayerID_DataSource: any;
  PayerIDjsonData: any;
  Clinician_Value: any;
  Clinician_DataSource: any[];
  ClinicianJsonData: any;
  OrderingClinician_Value: any;
  OrderingClinician_DataSource: any[];
  orderingClinicianJsonData: any;
  ReceiverID_Value: any;
  RecieverID_DataSource: any;
  RecieverIDjsonData: any;

  Denial_Amount: any = '';
  Denial_Amount_Symbol: any = '';
  Ageing_Symbol: any;
  Ageing_Days: any;

  LastRemittanceOnly_Value: boolean = false;

  PatientID_Value: string;
  memberID_Value: string;
  ResubmissionType_DataSource: any[];
  Resubmission_Value: any = '';
  DenialCodes_Value: any;
  DenialCodes_DataSource: any;
  FullyRejected_DataSource: any = [
    { ID: '', value: 'All' },
    { ID: 1, value: 'Claim Level' },
    { ID: 2, value: 'Activity Level' },
  ];
  FullyRejected_Value: any = '';

  Header_dataSource: any;
  Detail_DataSource: any;
  loadingVisible: boolean = false;

  childDataMap: Map<number, any[]> = new Map();
  MainTreeDataSource: any[];
  gridDataSource: any[];
  datagrid_allocated_User: any;
  TreeViewRemarks: any;
  TreeViewselectedChildRowsCount: any;
  dataGridselectedChildRowsCount: any;
  treeview_Allocate_User: any;
  userDataSorce: any;
  datagridRemarks: any;

  width: any = '100%';
  rtlEnabled: boolean = false;
  scrollByContent: boolean = true;
  showNavButtons: boolean = true;
  orientations: any = 'horizontal';
  stylingMode: any = 'primary';
  iconPosition: any = 'left';
  selectedRows: { [key: number]: any[] } = {};
  selectedTabId: number = 1;
  selectedIndex = 0;
  tabsWithText: any = [
    { id: 1, text: 'tree view' },
    { id: 2, text: 'grid view' },
  ];

  columns: any = [
    { dataField: 'FacilityGroup', caption: 'Facility Group', width: 'auto' },
    { dataField: 'FacilityID', caption: 'Facility ID' },
    { dataField: 'FacilityName', caption: 'Facility Name' },
    { dataField: 'ReceiverID', caption: 'Receiver ID' },
    { dataField: 'PayerID', caption: 'Payer ID' },
    { dataField: 'ClaimCount', caption: 'Claim Count' },
    { dataField: 'ClaimSelected', caption: 'Claim Selected' },
    { dataField: 'TranscationDate', caption: 'Transcation Date' },
    { dataField: 'RemittanceDays', caption: 'Remittance Days' },
    { dataField: 'ClaimAmt', caption: 'Claim Amt' },
    { dataField: 'DenialAmount', caption: 'Denial Amount' },
    { dataField: 'PaymentReference', caption: 'Payment Reference' },
    { dataField: 'XMLFileName', caption: 'XML File Name' },
    { dataField: 'RemittanceAmt', caption: 'Remittance Amt' },
    {
      dataField: 'ResubmissionAllocationBillUID',
      caption: 'Resubmission Allocation Bill UID',
    },
    { dataField: 'FacilityGroupID', caption: 'Facility Group ID' },
    { dataField: 'ReceiverName', caption: 'Receiver Name' },
    { dataField: 'ClaimNumber', caption: 'Claim Number' },
    { dataField: 'EncounterStartDate', caption: 'Encounter Start Date' },
    { dataField: 'MemberID', caption: 'Member ID' },
    { dataField: 'IDPayer', caption: 'ID Payer' },
    { dataField: 'PayerName', caption: 'Payer Name' },
    { dataField: 'ResubmissionCount', caption: 'Resubmission Count' },
    { dataField: 'EncounterTypeID', caption: 'Encounter Type ID' },
    { dataField: 'ResubmissionStage', caption: 'Resubmission Stage' },
  ];

  // excel_popupVisible: boolean = false;
  excel_import_Columns: any;
  Import_Excel_gridData: any;
  Import_Validation_gridData: any;
  Error_data_list: boolean = false;
  excelfileName: any;

  constructor(
    private reportServce: ReportService,
    private masterService: MasterReportService,
    private resubservce: ResubmissionServiceService,
    private lookupPage: AllocationLookUpComponent
  ) {
    this.get_InitData();
    this.resubservce.get_import_excel_columns().subscribe((response: any) => {
      if (response.Flag == '1') {
        this.excel_import_Columns = response.ImportedColumns;
      }
    });
  }

  ngOnInit(): void {
    if (this.editRowData) {
      console.log('edit row data fetched', this.editRowData);
      this.setFormValues();
    }
  }

  setFormValues() {
    this.Facility_Value = this.editRowData.FacilityID
      ? this.editRowData.FacilityID.split(',').map((id) => Number(id))
      : [];
    this.EncounterType_Value = this.editRowData.EncounterTypeID || '';
    this.SearchOn_Value = this.editRowData.SearchOn || '';
    this.From_Date_Value = this.editRowData.DateFrom
      ? new Date(this.editRowData.DateFrom)
      : null;
    this.To_Date_Value = this.editRowData.DateTo
      ? new Date(this.editRowData.DateTo)
      : null;
    this.LastRemittanceOnly_Value = this.editRowData.IsLatestRemittance === '1';
    this.PayerID_Value = this.editRowData.PayerID
      ? this.editRowData.PayerID.split(',')
      : [];
    this.ReceiverID_Value = this.editRowData.ReceiverID
      ? this.editRowData.ReceiverID.split(',')
      : [];
    this.DenialCodes_Value = this.editRowData.DenialCode
      ? this.editRowData.DenialCode.split(',')
      : [];
    this.FullyRejected_Value = this.editRowData.IsFullyRejected || '';
    this.Resubmission_Value = this.editRowData.RejectionLevel || '';
    this.Denial_Amount_Symbol = this.editRowData.DenialAmtSign || '';
    this.Denial_Amount = this.editRowData.DenialAmt
      ? Number(this.editRowData.DenialAmt)
      : 0;
    this.Ageing_Symbol = this.editRowData.ResubmissionAgeSign || '';
    this.Ageing_Days = this.editRowData.ResubmissionAge
      ? Number(this.editRowData.ResubmissionAge)
      : 0;

    this.treeview_Allocate_User = this.editRowData.AllocatedToLoginID
      ? parseInt(this.editRowData.AllocatedToLoginID, 10)
      : null;
    this.datagrid_allocated_User = this.editRowData.AllocatedToLoginID
      ? parseInt(this.editRowData.AllocatedToLoginID, 10)
      : null;

    this.TreeViewRemarks = this.editRowData.Remarks;
    this.datagridRemarks = this.editRowData.Remarks;

    this.gridDataSource = this.editRowData.ResubmissionAllocationBill;

    this.MainTreeDataSource = this.transformToTreeView(
      this.editRowData.ResubmissionAllocationXml,
      this.editRowData.ResubmissionAllocationBill
    );
  }

  onTabChange(selectedTabId: number) {
    this.selectedTabId = selectedTabId;
  }
  //=====================fetch init data==========================
  get_InitData() {
    this.loadingVisible = true;
    //====================== Year field dataSource ======================
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 1950; year--) {
      this.years.push(year);
    }
    //====================== month field datasource =====================
    this.monthDataSource = this.reportServce.getMonths();
    //================== fetch facility master data =====================
    this.masterService.Get_Facility_List_Data().subscribe(
      (response: any) => {
        if (response.flag == '1') {
          this.Facility_DataSource = this.makeAsyncDataSourceFromJson(
            response.data
          );
        }
      },
      (error) => {
        this.loadingVisible = false;
      }
    );
    //========================= user drop down data ======================
    this.resubservce.Get_GropDown('user').subscribe(
      (response: any) => {
        this.userDataSorce = response;
      },
      (error) => {
        this.loadingVisible = false;
      }
    );
    //========== other all data fetch from resubmission srevice api ======
    this.resubservce.get_SearchParametrs_resubmission_Data().subscribe(
      (res: any) => {
        this.SearchOn_DataSource = res.SearchOn;
        this.EncounterType_DataSource = res.EncounterType;
        this.PayerID_DataSource = this.makeAsyncDataSourceFromJson(res.Payer);
        this.RecieverID_DataSource = this.makeAsyncDataSourceFromJson(
          res.Receiver
        );
        this.DenialCodes_DataSource = this.makeAsyncDataSourceFromJson(
          res.denial
        );
        this.ResubmissionType_DataSource = res.ResubmissionLevel;

        this.loadingVisible = false;
      },
      (error) => {
        this.loadingVisible = false;
      }
    );
  }
  // ======================facility display expression ============
  facilityDisplayExpr = (item: any) => {
    return item ? `${item.FacilityLicense} - ${item.FacilityName}` : '';
  };
  DenialDisplayExpr = (item: any) => {
    return item ? `${item.Code} - ${item.Name}` : '';
  };
  //================Show and Hide Search parameters========
  toggleContent() {
    this.isContentVisible = !this.isContentVisible;
  }

  //============ clear data of popup when the pop is closing =========
  clearPopupData() {
    this.Import_Excel_gridData = [];
    this.selectedRows = [];
    setTimeout(() => {
      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
        fileInput.dispatchEvent(new Event('change'));
      }
    });
  }

  //================ import template data from excel =================
  import_template_data(event: any) {
    const target: DataTransfer = <DataTransfer>event.target;
    if (target.files.length !== 1) {
      return;
    }

    const file = target.files[0];
    this.excelfileName = file.name;

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const binaryStr: string = e.target.result;
      const workbook: XLSX.WorkBook = XLSX.read(binaryStr, { type: 'binary' });

      // Assuming data is in the first sheet
      const sheetName: string = workbook.SheetNames[0];
      const worksheet: XLSX.WorkSheet = workbook.Sheets[sheetName];

      // Convert sheet data to JSON
      const excelData: any[] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
      });

      // Convert array to object format
      const columnNames: string[] = excelData[0]; // First row as column names
      const dataObjects = excelData.slice(1).map((row) => {
        let obj: any = {};
        columnNames.forEach((col, index) => {
          obj[col] = row[index] || '';
        });
        return obj;
      });

      this.dataLoading_Uisng_ExcelData(dataObjects);
    };

    reader.readAsBinaryString(target.files[0]);
  }

  //================ load data by using excel import data ============
  dataLoading_Uisng_ExcelData(data: any) {
    this.loadingVisible = true;
    this.Header_dataSource = []; // Parent data
    this.Detail_DataSource = []; // Child data
    this.MainTreeDataSource = [];
    this.gridDataSource = [];
    const userid = sessionStorage.getItem('UserID');
    const formattedData = {
      userID: userid,
      ExcelFileName: this.excelfileName,
      ImportedColumns: data.map((item) => ({
        FacilityID: item['Facility ID'],
        ClaimNumber: item['Claim Number'],
      })),
    };
    this.resubservce.get_Datasource_Using_Excel_Data(formattedData).subscribe(
      (response: any) => {
        if (response.Flag == '1') {
          this.isContentVisible = true;
          const headerData = response.Header;
          const detailsData = response.Detail;
          this.gridDataSource = response.Detail;
          this.Import_Validation_gridData = response.ImportResponse;
          const hasFailure = this.Import_Validation_gridData.some(
            (item) => item.ImportStatus === 0
          );
          if (hasFailure) {
            this.Error_data_list = true;
          }

          this.MainTreeDataSource = this.transformToTreeView(
            headerData,
            detailsData
          );
        }
        this.loadingVisible = false;
      },
      (error) => {
        this.loadingVisible = false;
      }
    );
  }

  //================error showing table row data styling ============
  setRowColor(e: any) {
    if (e.rowType === 'data') {
      if (e.data.ImportStatus === 0) {
        e.rowElement.style.backgroundColor = '#ffcccc'; // Light Red for failed import
      }
    }
  }
  //================download datagrid template columns ===========
  async download_template_columns() {
    const columnNames = this.excel_import_Columns; // Replace with your actual column names array
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('DataGrid');
    try {
      // Add column names to the first row
      worksheet.addRow(columnNames);
      // Save the file
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], { type: 'application/octet-stream' }),
        'Template_Columns.xlsx'
      );
    } catch (error) {
      console.error('Export Error:', error);
    }
  }
  //==================MAking cutom datasource for facility datagrid and dropdown loADING=======
  makeAsyncDataSourceFromJson(jsonData: any) {
    return new CustomStore({
      loadMode: 'raw',
      key: 'ID',
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
  //============Hide drop down after Value Selected ==============
  onDropdownValueChanged() {
    const lookupInstance = this.lookup.instance;
    if (lookupInstance) {
      lookupInstance.close();
      lookupInstance.option('searchValue', '');
    }
  }
  //=============count of selected rows of datagrid===============
  gridData_onSelectionChanged(event: any) {
    this.dataGridselectedChildRowsCount = event.selectedRowsData.length;
  }
  //========= Count total selected child row count ==============
  onSelectionChanged(e: any) {
    if (!this.treeList) return;

    const selectedKeys = this.treeList.instance.getSelectedRowKeys();
    let totalChildCount = 0;
    let updatedData = [...this.MainTreeDataSource];

    let parentChildCountMap: { [key: string]: number } = {};

    // Track selected nodes
    selectedKeys.forEach((key) => {
      const node = this.treeList.instance.getNodeByKey(key);
      if (node) {
        const childCount = this.getAllChildCount(node);

        // Count only child nodes, exclude parent itself
        if (node.children && node.children.length > 0) {
          totalChildCount += childCount; // Only count child rows
          node.children.forEach((childNode) => {
            if (childNode.data && childNode.data.ResubmissionAllocationXMLUID) {
              const parentKey = childNode.data.ResubmissionAllocationXMLUID;
              if (!parentChildCountMap[parentKey]) {
                parentChildCountMap[parentKey] = 0;
              }
              parentChildCountMap[parentKey] += 1; // Add only child count
            }
          });
        } else {
          // If it's a child node, update its parent's count
          totalChildCount += 1; // Each child row should be counted
          if (node.data && node.data.ResubmissionAllocationXMLUID) {
            const parentKey = node.data.ResubmissionAllocationXMLUID;
            if (!parentChildCountMap[parentKey]) {
              parentChildCountMap[parentKey] = 0;
            }
            parentChildCountMap[parentKey] += 1;
          }
        }
      }
    });

    // Update only the parent rows with selected child count
    updatedData = updatedData.map((parent) => {
      if (
        parentChildCountMap[parent.ResubmissionAllocationXMLUID] !== undefined
      ) {
        return {
          ...parent,
          ClaimSelected:
            parentChildCountMap[parent.ResubmissionAllocationXMLUID], // Only child count
        };
      } else {
        return {
          ...parent,
          ClaimSelected: 0, // Reset to 0 if no children are selected
        };
      }
    });

    // Update state and refresh UI
    this.TreeViewselectedChildRowsCount = totalChildCount;
    this.MainTreeDataSource = [...updatedData]; // Trigger change detection
    this.dataGrid.instance.refresh(); // Ensure UI updates
  }

  //============= Recursive function to count all child rows of a node ============
  getAllChildCount(node: any): number {
    if (!node.children || node.children.length === 0) {
      return 1; // It's a leaf node, count as 1
    }
    let count = 0;
    node.children.forEach((child: any) => {
      count += this.getAllChildCount(child);
    });
    return count;
  }

  //================ Year value change ===================
  onYearChanged(e: any): void {
    this.selectedYear = e.value;
    this.selectedmonth = '';
    const currentYear = new Date().getFullYear();
    const today = new Date();
    if (this.selectedYear === currentYear) {
      // Set from date to the start of the year and to date to today
      this.From_Date_Value = new Date(this.selectedYear, 0, 1); // January 1 of the current year
      this.To_Date_Value = today; // Today's date
    } else {
      this.From_Date_Value = new Date(this.selectedYear, 0, 1); // January 1
      this.To_Date_Value = new Date(this.selectedYear, 11, 31); // December 31
    }
  }

  //================Month value change ===================
  onMonthValueChanged(e: any) {
    this.selectedmonth = e.value ?? '';
    if (this.selectedmonth === '') {
      this.From_Date_Value = new Date(this.selectedYear, 0, 1); // January 1 of the selected year
      this.To_Date_Value = new Date(this.selectedYear, 11, 31); // December 31 of the selected year
    } else {
      this.From_Date_Value = new Date(this.selectedYear, this.selectedmonth, 1);
      this.To_Date_Value = new Date(
        this.selectedYear,
        this.selectedmonth + 1,
        0
      );
    }
  }

  get_Datagrid_DataSource() {
    this.Header_dataSource = []; // Parent data
    this.Detail_DataSource = []; // Child data
    this.MainTreeDataSource = [];
    this.gridDataSource = [];
    this.TreeViewselectedChildRowsCount = 0;
    this.dataGridselectedChildRowsCount = 0;
    this.treeview_Allocate_User = '';
    this.datagrid_allocated_User = '';
    this.TreeViewRemarks = '';
    this.datagridRemarks = '';
    this.isContentVisible = false;
    this.loadingVisible = true;
    const formattedFromDate = this.From_Date_Value
      ? formatDate(this.From_Date_Value, 'yyyy/MM/dd', 'en')
      : null;

    const formattedToDate = this.To_Date_Value
      ? formatDate(this.To_Date_Value, 'yyyy/MM/dd', 'en')
      : null;

    const requestData = {
      facilityValue: this.Facility_Value?.length
        ? this.Facility_Value.join(',')
        : '',
      payerID: this.PayerID_Value?.length ? this.PayerID_Value.join(',') : '',
      receiverID: this.ReceiverID_Value?.length
        ? this.ReceiverID_Value.join(',')
        : '',
      denialCodes: this.DenialCodes_Value?.length
        ? this.DenialCodes_Value.join(',')
        : '',
      encounterType: this.EncounterType_Value,
      searchOn: this.SearchOn_Value,
      selectedYear: this.selectedYear,
      selectedMonth: this.selectedmonth,
      fromDate: formattedFromDate,
      toDate: formattedToDate,
      lastRemittanceOnly: this.LastRemittanceOnly_Value ? 1 : 0,
      resubmission: this.Resubmission_Value,
      isFullyRejected: this.FullyRejected_Value,
      denialAmount:
        this.Denial_Amount && this.Denial_Amount_Symbol
          ? `${this.Denial_Amount_Symbol}${this.Denial_Amount}`
          : '',

      Ageing:
        this.Ageing_Days && this.Ageing_Symbol
          ? `${this.Ageing_Symbol}${this.Ageing_Days}`
          : '',
    };

    this.resubservce.get_Resub_Allocation_List(requestData).subscribe(
      (response: any) => {
        if (response) {
          this.Header_dataSource = response.Header;
          this.Detail_DataSource = response.Detail;
          this.gridDataSource = response.Detail;
        }
        this.MainTreeDataSource = this.transformToTreeView(
          this.Header_dataSource,
          this.Detail_DataSource
        );

        this.loadingVisible = false;
      },
      (error) => {
        console.error('Error fetching data:', error);
        this.loadingVisible = false;
      }
    );
  }
  //=======CONVERT THE OBJECTS TO TREEVIEW DATA =================
  transformToTreeView(header: any[], detail: any[]) {
    return header.map((h) => ({
      ...h,
      items: detail.filter(
        (d) =>
          d.ResubmissionAllocationXMLUID === h.ResubmissionAllocationXMLUID &&
          d.FacilityID === h.FacilityID
      ),
    }));
  }

  //==============================save function for both tab ==========================
  save_data_From_TreeView() {
    if (!this.treeList?.instance) {
      console.warn('TreeList instance not found!');
      return;
    }

    const formattedFromDate = this.From_Date_Value
      ? formatDate(this.From_Date_Value, 'yyyy/MM/dd', 'en')
      : null;
    const formattedToDate = this.To_Date_Value
      ? formatDate(this.To_Date_Value, 'yyyy/MM/dd', 'en')
      : null;

    // Fetch selected rows
    const selectedRows = this.treeList.instance.getSelectedRowsData('all');
    if (selectedRows.length === 0) {
      console.warn('No rows selected!');
      return;
    }

    let loginName = sessionStorage.getItem('loginName');
    let userId = sessionStorage.getItem('UserID');

    // Separate Parent and Child Rows
    const parentRows = selectedRows
      .filter((row) => row.parentId === 0)
      .map(({ id, parentId, ...rest }) => rest);

    const childRows = selectedRows
      .filter((row) => row.parentId > 0)
      .map(({ id, parentId, ...rest }) => rest);

    const dataObject = {
      UserID: userId,
      FacilityID: this.Facility_Value?.length
        ? this.Facility_Value.join(',')
        : '',
      payerID: this.PayerID_Value?.length ? this.PayerID_Value.join(',') : '',
      ReceiverID: this.ReceiverID_Value?.length
        ? this.ReceiverID_Value.join(',')
        : '',
      encounterType: this.EncounterType_Value || '',
      SearchOn: this.SearchOn_Value || '',
      selectedYear: this.selectedYear || '',
      selectedMonth: this.selectedmonth || '',
      DateFrom: formattedFromDate || '',
      DateTo: formattedToDate || '',
      Remarks: this.TreeViewRemarks || '',
      AllocatedToLoginID: JSON.stringify(this.treeview_Allocate_User) || '',
      SelectedClaimCount:
        JSON.stringify(this.TreeViewselectedChildRowsCount) || '',
      DenialCode: this.DenialCodes_Value?.length
        ? this.DenialCodes_Value.join(',')
        : '',
      DenialAmtSign: this.Denial_Amount_Symbol || '',
      DenialAmt: this.Denial_Amount || '',
      lastRemittanceOnly: this.LastRemittanceOnly_Value ? 1 : 0,
      resubmission: this.Resubmission_Value || '',
      isFullyRejected: this.FullyRejected_Value || '',
      resubmissionagesign: this.Ageing_Symbol || '',
      resubmissionage: this.Ageing_Days || '',

      ResubmissionAllocationXml: parentRows,
      ResubmissionAllocationBill: childRows,
    };

    let finalObject = this.transformData(dataObject);

    console.log('Final Data:', finalObject);

    if (this.editRowData) {
      // **Call Update API**
      this.resubservce
        .update_resubmission_allocation_Data(finalObject)
        .subscribe((response: any) => {
          this.handleApiResponse(response, 'updated');
        });
    } else {
      // **Call Insert API**
      this.resubservce
        .insert_resubmission_allocation_Data(finalObject)
        .subscribe((response: any) => {
          this.handleApiResponse(response, 'saved');
        });
    }
  }
  //============== save list from grid view ==================
  save_data_From_GridView() {
    if (!this.dataGrid?.instance) return;

    const formattedFromDate = this.From_Date_Value
      ? new Date(this.From_Date_Value).toISOString().split('T')[0]
      : null;
    const formattedToDate = this.To_Date_Value
      ? new Date(this.To_Date_Value).toISOString().split('T')[0]
      : null;

    const userId = sessionStorage.getItem('UserID');
    const selectedRowsData = this.dataGrid.instance.getSelectedRowsData();

    if (selectedRowsData.length === 0) {
      console.warn('No rows selected!');
      return;
    }

    const dataObject = {
      UserID: userId,
      FacilityID: this.Facility_Value?.length
        ? this.Facility_Value.join(',')
        : '',
      payerID: this.PayerID_Value?.length ? this.PayerID_Value.join(',') : '',
      ReceiverID: this.ReceiverID_Value?.length
        ? this.ReceiverID_Value.join(',')
        : '',
      encounterType: this.EncounterType_Value || '',
      SearchOn: this.SearchOn_Value || '',
      selectedYear: this.selectedYear || '',
      selectedMonth: this.selectedmonth || '',
      DateFrom: formattedFromDate || '',
      DateTo: formattedToDate || '',
      Remarks: this.datagridRemarks || '',
      AllocatedToLoginID: JSON.stringify(this.datagrid_allocated_User) || '',
      SelectedClaimCount:
        JSON.stringify(this.dataGridselectedChildRowsCount) || '',
      DenialCode: this.DenialCodes_Value?.length
        ? this.DenialCodes_Value.join(',')
        : '',
      DenialAmtSign: this.Denial_Amount_Symbol || '',
      DenialAmt: this.Denial_Amount || '',
      lastRemittanceOnly: this.LastRemittanceOnly_Value ? 1 : 0,
      resubmission: this.Resubmission_Value || '',
      isFullyRejected: this.FullyRejected_Value || '',
      resubmissionagesign: this.Ageing_Symbol || '',
      resubmissionage: this.Ageing_Days || '',
      ResubmissionAllocationXml: [],
      ResubmissionAllocationBill: selectedRowsData,
    };

    const finalObject = this.transformData(dataObject);
    console.log('Final Object:', finalObject);

    if (this.editRowData) {
      // **Call Update API**
      this.resubservce
        .update_resubmission_allocation_Data(finalObject)
        .subscribe((response: any) => {
          this.handleApiResponse(response, 'updated');
        });
    } else {
      // **Call Insert API**
      this.resubservce
        .insert_resubmission_allocation_Data(finalObject)
        .subscribe((response: any) => {
          this.handleApiResponse(response, 'saved');
        });
    }
  }

  // **Reusable API Response Handler**
  handleApiResponse(response: any, action: string) {
    if (response.flag == '1') {
      console.log(response);
      notify(
        {
          message: `Data successfully ${action}!`,
          position: { at: 'top right', my: 'top right' },
        },
        'success'
      );
      this.lookupPage.On_PopUp_Hiding();
      this.get_Datagrid_DataSource();
    } else {
      notify(
        {
          message: `${response.message}`,
          position: { at: 'top right', my: 'top right' },
        },
        'error'
      );
    }
  }

  transformData(inputData: any): any {
    return {
      ResubmissionAllocationUID:
        this.editRowData?.ResubmissionAllocationUID || '',
      UserID: inputData.UserID || '',
      FacilityID: inputData.FacilityID || '', // Convert to array if needed
      PayerID: inputData.payerID || '',
      ReceiverID: inputData.ReceiverID || '',
      SearchOn: inputData.SearchOn || '',
      DateFrom: inputData.DateFrom || '',
      DateTo: inputData.DateTo || '',
      Remarks: inputData.Remarks || '',
      AllocatedToLoginID: inputData.AllocatedToLoginID || '',
      IsActive: '1',
      CancelledDate: '',
      CancelledByLoginID: '',
      CancelledRemarks: '',
      SelectedClaimCount: inputData.SelectedClaimCount || '',
      LocationCode: inputData.LocationCode || '',
      DenialCode: inputData.DenialCode || '',
      IsFullyRejected: inputData.isFullyRejected || '',
      RemittanceCountSign: '',
      RemittanceCount: '',
      DenialAmtSign: inputData.DenialAmtSign || '',
      DenialAmt: inputData.DenialAmt || '',
      DenialAmtLevel: '',
      ResubmissionAgeSign: inputData.resubmissionagesign,
      ResubmissionAge: inputData.resubmissionage,
      RejectionLevel: '',
      EncounterTypeID: inputData.encounterType || '',
      IsLatestRemittance: inputData.lastRemittanceOnly
        ? inputData.lastRemittanceOnly.toString()
        : '',
      ExcelFileName: '',
      ExcelContent: '',

      // If ResubmissionAllocationXml is empty, return an empty array
      ResubmissionAllocationXml:
        inputData.ResubmissionAllocationXml &&
        inputData.ResubmissionAllocationXml.length > 0
          ? inputData.ResubmissionAllocationXml.map((xml: any) => ({
              FacilityGroupID: xml.FacilityGroupID
                ? xml.FacilityGroupID.toString()
                : '',
              FacilityID: xml.FacilityID || '',
              ReceiverID: xml.ReceiverID || '',
              TransactionDate: xml.TranscationDate || '',
              ClaimCount: xml.ClaimCount ? xml.ClaimCount.toString() : '',
              ClaimAmt: xml.ClaimAmt ? xml.ClaimAmt.toString() : '',
              RemittanceAmt: xml.RemittanceAmt
                ? xml.RemittanceAmt.toString()
                : '',
              PaymentReference: xml.PaymentReference || '',
              RemittanceXMLFileName: xml.XMLFileName || '',
              Comment: xml.Comment || '',
              LocationCode: xml.LocationCode || '',
              RemittanceDays: xml.RemittanceDays
                ? xml.RemittanceDays.toString()
                : '',
              PayerID: xml.PayerID || '',
              ResubmissionAllocationBillUID:
                xml.ResubmissionAllocationBillUID || '',
              ResubmissionAllocationXMLUID:
                xml.ResubmissionAllocationXMLUID || '',
            }))
          : [
              {
                FacilityGroupID: '',
                FacilityID: '',
                ReceiverID: '',
                TransactionDate: '',
                ClaimCount: '',
                ClaimAmt: '',
                RemittanceAmt: '',
                PaymentReference: '',
                RemittanceXMLFileName: '',
                Comment: '',
                LocationCode: '',
                RemittanceDays: '',
                PayerID: '',
              },
            ],

      // If ResubmissionAllocationBill is empty, return an empty array
      ResubmissionAllocationBill:
        inputData.ResubmissionAllocationBill &&
        inputData.ResubmissionAllocationBill.length > 0
          ? inputData.ResubmissionAllocationBill.map((bill: any) => ({
              FacilityGroupID: bill.FacilityGroupID
                ? bill.FacilityGroupID.toString()
                : '',
              FacilityID: bill.FacilityID || '',
              ReceiverID: bill.ReceiverID || '',
              ClaimNumber: bill.ClaimNumber || '',
              EncounterStartDate: bill.EncounterStartDate || '',
              MemberID: bill.MemberID || '',
              PayerID: bill.PayerID || '',
              IDPayer: bill.IDPayer || '',
              ClaimAmt: bill.ClaimAmt ? bill.ClaimAmt.toString() : '',
              RemittanceAmt: bill.RemittanceAmt
                ? bill.RemittanceAmt.toString()
                : '',
              Comment: bill.Comment || '',
              LocationCode: bill.LocationCode || '',
              ResubmissionCount: bill.ResubmissionCount
                ? bill.ResubmissionCount.toString()
                : '',
              EncounterTypeID: bill.EncounterTypeID || '',
              PaymentReference: bill.PaymentReference || '',
              RemittanceXMLFileName: bill.XMLFileName || '',
              TransactionDate: bill.TranscationDate || '',
              RemittanceDays: bill.RemittanceDays
                ? bill.RemittanceDays.toString()
                : '',
              ResubmissionStage: bill.ResubmissionStage
                ? bill.ResubmissionStage.toString()
                : '',
              ResubmissionAllocationBillUID:
                bill.ResubmissionAllocationBillUID || '',
              ResubmissionAllocationXMLUID:
                bill.ResubmissionAllocationXMLUID || '',
            }))
          : [],

      // Keeping ResubmissionAllocationBillCpt with default empty values
      ResubmissionAllocationBillCpt: [
        {
          FacilityID: '',
          ClaimNumber: '',
          CPTCode: '',
          LocationCode: '',
          ClaimActivityNumber: '',
        },
      ],
    };
  }

  clear_all_data() {
    this.Facility_Value = [];
    this.EncounterType_Value = null;
    this.SearchOn_Value = null;
    this.selectedYear = null;
    this.selectedmonth = null;
    this.From_Date_Value = null;
    this.To_Date_Value = null;
    this.LastRemittanceOnly_Value = false;
    this.PayerID_Value = [];
    this.ReceiverID_Value = [];
    this.DenialCodes_Value = [];
    this.FullyRejected_Value = null;
    this.Resubmission_Value = null;
    this.Denial_Amount_Symbol = null;
    this.Denial_Amount = null;
    this.Ageing_Symbol = null;
    this.Ageing_Days = null;

    this.Header_dataSource = []; // Parent data
    this.Detail_DataSource = []; // Child data
    this.MainTreeDataSource = [];
    this.gridDataSource = [];
    this.dataGrid.instance.refresh();
  }
}

@NgModule({
  imports: [
    DxButtonModule,
    DxDataGridModule,
    DxDropDownButtonModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxLookupModule,
    DxResizableModule,
    DxDropDownBoxModule,
    FormPopupModule,
    CommonModule,
    DxFormModule,
    DxDateBoxModule,
    DxToolbarModule,
    DxAccordionModule,
    DxCheckBoxModule,
    DxSliderModule,
    DxTagBoxModule,
    DxTemplateModule,
    DxPopupModule,
    ReactiveFormsModule,
    DxTreeViewModule,
    DxSortableModule,
    DxTabPanelModule,
    DxListModule,
    DxValidatorModule,
    DxValidationSummaryModule,
    DxLoadPanelModule,
    DxNumberBoxModule,
    DxTreeListModule,
    DxTabsModule,
    AdvanceFilterPopupModule,
    ClaimDetailActivityDrillDownModule,
  ],
  providers: [],
  exports: [AllocationPageComponent],
  declarations: [AllocationPageComponent],
})
export class AllocationPageModule {}
