import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  NgModule,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
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
  DxTreeViewComponent,
  DxLookupComponent,
  DxDataGridComponent,
  DxLoadPanelModule,
} from 'devextreme-angular';
import { FormPopupModule } from 'src/app/components';
import { formatNumber } from 'devextreme/localization';
import { ReportService } from 'src/app/services/Report-data.service';
import { ReportEngineService } from '../report-engine.service';
import DataSource from 'devextreme/data/data_source';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import notify from 'devextreme/ui/notify';
import { ClaimDetailActivityDrillDownComponent } from '../../REPORT DRILL PAGES/claim-detail-activity-drill-down/claim-detail-activity-drill-down.component';
import { ClaimDetailActivityDrillDownModule } from '../../REPORT DRILL PAGES/claim-detail-activity-drill-down/claim-detail-activity-drill-down.component';
import { AdvanceFilterPopupModule } from '../../POP-UP_PAGES/advance-filter-popup/advance-filter-popup.component';
import { DataService } from 'src/app/services';
import CustomStore from 'devextreme/data/custom_store';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import { PopupStateService } from 'src/app/popupStateService.service';
@Component({
  selector: 'app-claim-details-activity',
  templateUrl: './claim-details-activity.component.html',
  styleUrls: ['./claim-details-activity.component.scss'],
  providers: [ReportService, ReportEngineService, DatePipe, DataService],
})
export class ClaimDetailsActivityComponent {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;

  @ViewChild(DxTreeViewComponent, { static: false })
  treeView: DxTreeViewComponent;

  @ViewChild(ClaimDetailActivityDrillDownComponent, { static: false })
  claimDrill: ClaimDetailActivityDrillDownComponent;

  @ViewChild('lookup', { static: false }) lookup: DxLookupComponent;

  //=================DataSource for data Grid Table========
  dataGrid_DataSource: DataSource<any>;

  columnsConfig: any; //==============Column data storing variable

  //================Variables for Storing DataSource========
  SearchOn_DataSource: any;
  Facility_DataSource: any;
  EncounterType_DataSource: any;
  RecieverID_DataSource: any;
  PayerID_DataSource: any;
  Payer_DataSource: any;
  Clinician_DataSource: any;
  OrderingClinician_DataSource: any;
  ResubmissionType_DataSource: any;
  DenialCodes_DataSource: any;
  CptTypes_DataSource: any;
  CliamStatus_DataSource: any;
  paymentStatus_DataSource: any;
  monthDataSource: { name: string; value: any }[];
  years: number[] = [];

  //================Variables for Storing selected Parameters========
  SearchOn_Value: any = null;
  Facility_Value: any = [];
  EncounterType_Value: any = null;
  From_Date_Value: any = new Date();
  To_Date_Value: any = new Date();
  ReceiverID_Value: any[] = [];
  PayerID_Value: any[] = [];
  Payer_Value: any;
  Clinician_Value: any[] = [];
  OrderingClinician_Value: any[] = [];
  selectedmonth: any = '';
  selectedYear: number | null = null;
  ClaimNumber_Value: any = null;
  PatientID_Value: any = null;
  Resubmission_Value: any = null;
  DenialCodes_Value: any;
  CliamStatus_Value: any;
  memberID_Value: any = null;
  paymentStatus_Value: any = null;

  //========Variables for Pagination ====================
  readonly allowedPageSizes: any = [10, 20, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;
  show_Pagination = true;

  //=====================other variables==================
  isContentVisible: boolean = true;
  hint_for_Parametr_div: any = 'Hide Parameters';
  currentPathName: any;
  userId: string;
  minDate: Date;
  maxDate: Date;
  ColumnNames: any;
  memorise_Dropdown_DataList: any;
  isFilterOpened = false; //filter row enable-desable variable
  GridSource: any;
  isEmptyDatagrid: boolean = true;
  summaryColumnsData: any;
  columndata: any;
  isAdvancefilterOpened: boolean = false;
  filterpopupWidth: any = '70%';
  advanceFilterGridColumns: any;
  MemoriseReportName: any;
  isSaveMemorisedOpened: boolean = false;
  personalReportData: any;
  isDrillDownPopupOpened: boolean = false;
  clickedRowData: any;
  loadingVisible: boolean = false;
  columnFixed: boolean = true;
  initialized: boolean;

  popupWidth: any = '90%';
  popupHeight: any = '90vh';
  popupPosition: any = { my: 'center', at: 'center' };
  isPopupMinimised: boolean = false;

  RecieverIDjsonData: any;
  PayerIDjsonData: any;
  ClinicianJsonData: any;
  orderingClinicianJsonData: any;
  drilldownPopups: any[];
  closedPopupsSet: Set<string> = new Set();
  //============Custom close button for drilldown popup============
  toolbarItems: any;

  constructor(
    private service: ReportService,
    private reportengine: ReportEngineService,
    private datePipe: DatePipe,
    private router: Router,
    private masterService: MasterReportService,
    private popupStateService: PopupStateService,
    private cdr: ChangeDetectorRef
  ) {
    this.loadingVisible = true;
    this.minDate = new Date(2000, 1, 1); // Set the minimum date
    this.maxDate = new Date(); // Set the maximum date
    //============Year field dataSource===============
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 1950; year--) {
      this.years.push(year);
    }
    //=============month field datasource============
    this.monthDataSource = this.service.getMonths();
    this.get_searchParameters_Dropdown_Values();
    if (this.drilldownPopups && this.drilldownPopups.length > 0) {
      this.drilldownPopups.forEach((popup) => {
        this.updateToolbarItems(popup.id); // Pass the popupId when calling this method
      });
    }
    // this.router.events.subscribe((event) => {
    //   if (event instanceof NavigationEnd) {
    //     this.isDrillDownPopupOpened = this.popupStateService.getPopupState(
    //       'claimDetaisActivityDrillDownPopup'
    //     );
    //   }
    // });
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.hidePopupsOnNavigation();
      }

      // Listen for NavigationEnd event to restore visibility
      if (event instanceof NavigationEnd) {
        this.restorePopupsOnNavigation();
      }
    });
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

  //=============Resize the popup drill down============
  onResizeEnd(event: any) {
    this.popupWidth = event.width;
    this.popupHeight = event.height;
  }

  hidePopupsOnNavigation() {
    if (this.drilldownPopups && this.drilldownPopups.length > 0) {
      // Hide all drilldown popups instead of closing them
      this.drilldownPopups.forEach((popup) => {
        popup.isOpened = false; // Hide the popup but keep its state
      });

      // Ensure UI reflects changes immediately
      this.cdr.detectChanges();
    }
  }

  restorePopupsOnNavigation(): void {
    if (this.drilldownPopups && this.drilldownPopups.length > 0) {
      this.drilldownPopups.forEach((popup) => {
        // If the popup was manually closed, make sure it's not reopened
        if (this.closedPopupsSet.has(popup.id)) {
          popup.isOpened = false; // Keep it closed
        } else {
          popup.isOpened = true; // Restore visibility for popups that should be shown
        }
      });

      // Ensure UI reflects changes immediately
      this.cdr.detectChanges();
    }
  }

  //========Remove closing popup from the popup array=====

  updateToolbarItems(popupId: string) {
    const popup = this.drilldownPopups.find((p) => p.id === popupId); // Get the full popup object by its ID

    if (popup) {
      this.toolbarItems = [
        {
          widget: 'dxButton',
          options: {
            text: '',
            icon: popup.isPopupMinimised ? 'expandform' : 'minus', // Toggle icon based on minimize state
            type: 'normal',
            stylingMode: 'contained',
            onClick: () => this.minimisePopup(popupId), // Pass the popupId to minimize the popup
          },
          toolbar: 'top',
          location: 'after',
        },
        {
          widget: 'dxButton',
          options: {
            text: '',
            icon: 'close', // Close icon for the button
            type: 'normal',
            stylingMode: 'contained',
            onClick: () => this.closePopup1(popupId), // Pass only the popupId to close it
          },
          toolbar: 'top',
          location: 'after',
        },
      ];
    }
  }

  closePopup1(popup: any): void {
    popup.isOpened = false; // Hide the popup
    // console.log('Popup manually closed:', popup);
    this.closedPopupsSet.add(popup.id);
    // Additional logic for closing the popup can go here
  }

  //========Remove closing popup from the popup array=====

  minimisePopup(popupId: string): void {
    const popup = this.drilldownPopups.find((p) => p.id === popupId);
    if (popup) {
      popup.isPopupMinimised = !popup.isPopupMinimised;

      // Adjust the size and position based on minimize state
      if (popup.isPopupMinimised) {
        popup.width = '20%';
        popup.height = '10%';
        // popup.icon = 'minus';
        popup.icon = 'expand-icon';
        // popup.position = { my: 'center', at: 'center', of: '.view-wrapper' }; // Example position
        popup.position = {
          my: 'bottom right', // Align the popup's top-right corner
          at: 'bottom right', // Align the popup's top-right corner to the right side
          offset: '20 10px', // Add a 20px gap from the top and right edges
          of: window, // Reference the entire window as the parent
        };
      } else {
        popup.width = '90%';
        popup.height = '90vh';
        popup.position = { my: 'center', at: 'center' }; // Example position
        popup.icon = 'minimize-icon';
      }

      // Re-render the popup
      this.cdr.detectChanges(); // Trigger change detection
      this.updateToolbarItems(popupId); // Update toolbar items after minimizing
    }
  }

  closePopup() {
    this.popupStateService.setPopupState(
      'claimDetaisActivityDrillDownPopup',
      false
    );
    this.isDrillDownPopupOpened = false;
  }

  //================Show and Hide Search parameters==========
  toggleContent() {
    this.isContentVisible = !this.isContentVisible;
  }

  //=================Row click drill Down====================

  handleRowDrillDownClick = (e: any) => {
    const popupId = `drilldown-${new Date().getTime()}`; // Unique ID for each popup
    const rowData = e.row.data;
    if (!this.drilldownPopups) {
      this.drilldownPopups = []; // Initialize if not already
    }
    // Add the new popup configuration
    this.drilldownPopups.push({
      id: popupId,
      width: '90%',
      height: '90vh',
      position: { my: 'center', at: 'center' },
      rowData: rowData,
      isOpened: true, // Ensure this popup is opened
      isPopupMinimised: false,
    });
    this.popupStateService.setPopupState(popupId, true);
    // this.updateToolbarItems(popupId);
  };

  //===================Function to handle selection change and sort the data==========
  onSelectionChanged(event: any, jsonData: any[], dataSourceKey: string): void {
    console.log('Original JSON Data:', jsonData);
    const selectedRows = event.selectedRowsData;
    const selectedRowIds = selectedRows.map((row) => row.ID);
    const unselectedRows = jsonData.filter(
      (row) => !selectedRowIds.includes(row.ID)
    );
    const reorderedData = [...selectedRows, ...unselectedRows];
    this[dataSourceKey] = this.makeAsyncDataSourceFromJson(reorderedData);
    console.log('Updated DataSource:', this[dataSourceKey]);
    this.dataGrid.instance.refresh();
  }
  //============Get search parameters dropdown values=======
  get_searchParameters_Dropdown_Values() {
    this.masterService.Get_Facility_List_Data().subscribe((response: any) => {
      if (response.flag == '1') {
        this.Facility_DataSource = this.makeAsyncDataSourceFromJson(
          response.data
        );
      }
    });

    this.service.get_SearchParametrs_Data().subscribe(
      (response: any) => {
        if (response.flag == '1') {
          this.loadingVisible = false;
          this.SearchOn_DataSource = response.SearchOn;
          this.SearchOn_Value = this.SearchOn_DataSource.find(
            (item) => item.ID === 'EncounterStartDate'
          )?.ID;
          this.EncounterType_DataSource = response.EncounterType;
          this.RecieverID_DataSource = this.makeAsyncDataSourceFromJson(
            response.ReceiverID
          );
          this.RecieverIDjsonData = response.ReceiverID;
          this.PayerID_DataSource = this.makeAsyncDataSourceFromJson(
            response.PayerID
          );
          this.PayerIDjsonData = response.PayerID;
          this.Payer_DataSource = response.Payer;
          this.Clinician_DataSource = this.makeAsyncDataSourceFromJson(
            response.Clinician
          );
          this.ClinicianJsonData = response.Clinician;
          this.OrderingClinician_DataSource = this.makeAsyncDataSourceFromJson(
            response.OrderingClinician
          );
          this.orderingClinicianJsonData = response.OrderingClinician;
          this.ResubmissionType_DataSource = response.ResubmissionType;
          this.CliamStatus_DataSource = response.ClaimStatus;
          this.paymentStatus_DataSource = response.PaymentStatus;
          this.advanceFilterGridColumns = response.AdvanceFilter;
        }
      },
      (error) => {
        console.error('Error fetching data:', error);
      }
    );
  }

  //===========Fetch DataSource For The Datagrid Table=============
  async get_Datagrid_DataSource() {
    const formData = {
      SearchOn: this.SearchOn_Value,
      Facility: this.Facility_Value.join(', '),
      EncounterType: this.EncounterType_Value,
      From_Date: this.reportengine.formatDate(this.From_Date_Value),
      To_Date: this.reportengine.formatDate(this.To_Date_Value),
      ReceiverID: this.ReceiverID_Value.join(', '),
      PayerID: this.PayerID_Value.join(', '),
      Payer: this.Payer_Value,
      Clinician: this.Clinician_Value.join(', '),
      OrderingClinician: this.OrderingClinician_Value.join(', '),
      ClaimNumber: this.ClaimNumber_Value,
      PatientID: this.PatientID_Value,
      Resubmission: this.Resubmission_Value,
      DenialCodes: this.DenialCodes_Value,
      CliamStatus: this.CliamStatus_Value,
      memberID: this.memberID_Value,
      paymentStatus: this.paymentStatus_Value,
    };
    this.isContentVisible = false;
    this.dataGrid.instance.beginCustomLoading('Loading...');

    try {
      const response: any = await this.service
        .fetch_Claim_Details_With_Activity(formData)
        .toPromise();
      if (response.flag === '1') {
        this.isEmptyDatagrid = false;
        this.columndata = response.ReportColumns;

        const userLocale = navigator.language || 'en-US';
        console.log('user locale settings:', userLocale);

        this.summaryColumnsData = this.generateSummaryColumns(
          response.ReportColumns
        );
        // console.log('Summary columns are:', this.summaryColumnsData);

        this.columnsConfig = this.generateColumnsConfig(
          response.ReportColumns,
          userLocale
        );
        this.ColumnNames = this.columnsConfig
          .filter((column) => column.visible)
          .map((column) => column.caption);

        this.personalReportData = response.PersonalReports;
        this.memorise_Dropdown_DataList = response.PersonalReports.map(
          (personalReport) => ({
            name: personalReport.name,
          })
        );

        // Format dates in ReportData
        const formattedReportData = response.ReportData.map((data) => ({
          ...data,
          TransactionDate: this.datePipe.transform(
            data.TransactionDate,
            'dd-MMM-yyyy'
          ),
          ActivityStartDate: this.datePipe.transform(
            data.ActivityStartDate,
            'dd-MMM-yyyy'
          ),
          EncounterStartDate: this.datePipe.transform(
            data.EncounterStartDate,
            'dd-MMM-yyyy'
          ),
          EncounterEndDate: this.datePipe.transform(
            data.EncounterEndDate,
            'dd-MMM-yyyy'
          ),
          LastResubmissionDate: this.datePipe.transform(
            data.LastResubmissionDate,
            'dd-MMM-yyyy'
          ),
          InitialDateSettlement: this.datePipe.transform(
            data.InitialDateSettlement,
            'dd-MMM-yyyy'
          ),
          FirstRemittanceDate: this.datePipe.transform(
            data.FirstRemittanceDate,
            'dd-MMM-yyyy'
          ),
          LastRemittanceDate: this.datePipe.transform(
            data.LastRemittanceDate,
            'dd-MMM-yyyy'
          ),
        }));

        // Initialize dataGrid_DataSource with the pre-loaded data
        this.dataGrid_DataSource = new DataSource<any>({
          load: () => Promise.resolve(formattedReportData),
        });
        this.dataGrid.instance.endCustomLoading();
        this.isContentVisible = false;
      } else {
        this.dataGrid.instance.endCustomLoading();
        this.isContentVisible = false;
        notify(
          {
            message: `${response.message}`,
            position: { at: 'top right', my: 'top right' },
          },
          'error'
        );
      }
    } catch (error) {
      this.dataGrid.instance.endCustomLoading();
      this.isContentVisible = true;
      notify(
        {
          message: `An error occurred while fetching the data. Please try again later.`,
          position: { at: 'top right', my: 'top right' },
          displayTime: 3000,
        },
        'error'
      );
    }
  }

  generateSummaryColumns(reportColumns) {
    const decimalColumns = reportColumns.filter(
      (col) => col.Type === 'Decimal' && col.Summary
    );
    const intColumns = reportColumns.filter(
      (col) => col.Type === 'Int32' && col.Summary
    );
    return {
      totalItems: [
        ...decimalColumns.map((col) =>
          this.createSummaryItem(col, false, 'sum', 'decimal')
        ),
        ...intColumns.map((col) =>
          this.createSummaryItem(col, false, 'sum', 'count')
        ),
      ],
      groupItems: [
        ...decimalColumns.map((col) =>
          this.createSummaryItem(col, true, 'sum', 'decimal')
        ),
        ...intColumns.map((col) =>
          this.createSummaryItem(col, true, 'sum', 'count')
        ),
      ],
    };
  }

  createSummaryItem(col, isGroupItem = false, summaryType = 'sum', formatType) {
    return {
      column: col.Name,
      summaryType: summaryType,
      displayFormat: formatType === 'count' ? 'Count: {0} ' : 'Total: {0}',
      valueFormat:
        formatType === 'decimal'
          ? {
              style: 'decimal',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          : null,
      alignByColumn: isGroupItem, // Align by column if it's a group item
      showInGroupFooter: isGroupItem, // Show in group footer for group items
    };
  }

  generateColumnsConfig(reportColumns: any, userLocale: any) {
    return reportColumns.map((column) => {
      let columnFormat;
      if (column.Type === 'DateTime') {
        columnFormat = {
          type: 'date',
          formatter: (date) =>
            new Intl.DateTimeFormat(userLocale, {
              year: 'numeric',
              month: 'short',
              day: '2-digit',
            }).format(new Date(date)),
        };
      }
      if (column.Type === 'Decimal') {
        columnFormat = {
          type: 'fixedPoint',
          precision: 2,
          formatter: (value) =>
            new Intl.NumberFormat(userLocale, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(value),
        };
      }
      if (column.Type === 'percentage') {
        columnFormat = {
          type: 'percent',
          precision: 2,
          formatter: (value) =>
            new Intl.NumberFormat(userLocale, {
              style: 'percent',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(value / 100),
        };
      }
      return {
        dataField: column.Name,
        caption: column.Title,
        visible: column.Visibility,
        type: column.Type,
        format: columnFormat,
      };
    });
  }

  import_Advance_Filter() {
    const filterData = this.reportengine.getData();
    // console.log('advance filter imported data', filterData);
    this.ClaimNumber_Value = filterData.ClaimNumber;

    // this.Facility_Value = this.Facility_DataSource.filter((item) =>
    //   filterData.ReceiverID.split(',').includes(item.Name)
    // ).map((item) => item.ID);

    this.ReceiverID_Value = this.RecieverID_DataSource.filter((item) =>
      filterData.ReceiverID.split(',').includes(item.Name)
    ).map((item) => item.ID);

    this.PayerID_Value = this.PayerID_DataSource.filter((item) =>
      filterData.PayerID.split(',').includes(item.Name)
    ).map((item) => item.ID);

    // this.Payer_Value = this.Payer_DataSource.filter((item) =>
    //   filterData.ReceiverID.split(',').includes(item.Name)
    // ).map((item) => item.ID);

    this.Clinician_Value = this.Clinician_DataSource.filter((item) =>
      filterData.Clinician.split(',').includes(item.Name)
    ).map((item) => item.ID);

    this.OrderingClinician_Value = this.OrderingClinician_DataSource.filter(
      (item) => filterData.OrderingClinician.split(',').includes(item.Name)
    ).map((item) => item.ID);
  }

  //============Show Parametrs Div=======================
  show_Parameter_Div = () => {
    this.isContentVisible = !this.isContentVisible;
    this.hint_for_Parametr_div = this.isContentVisible
      ? 'Hide Parameters'
      : 'Show Parameters';
  };

  //============Show Filter Row==========================
  filterClick = () => {
    if (this.dataGrid_DataSource) {
      this.isFilterOpened = !this.isFilterOpened;
    }
  };

  //============Show Filter Row==========================
  SummaryClick = () => {
    const reportGridElement = document.querySelector('.reportGrid');
    if (reportGridElement) {
      reportGridElement.classList.toggle('reportGridFooter');
    }
  };

  //================Year value change ===================
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
    console.log('selected month', this.selectedmonth);
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
  //============Hide drop down after Value Selected======
  onDropdownValueChanged() {
    const lookupInstance = this.lookup.instance;
    if (lookupInstance) {
      lookupInstance.close();
    }
  }

  //=================Show advance filter popup==========
  get_advance_Filter() {
    this.isAdvancefilterOpened = true;
  }

  //=====================Search on Each Column===========
  applyFilter() {
    this.GridSource.filter();
  }

  //==============Show Memorise Report===================
  ShowMemoriseTable = (e: any) => {
    const SelectedValue = e.itemData.name;
    if (SelectedValue === null || SelectedValue === '') {
      this.get_Datagrid_DataSource();
    } else {
      this.refresh();
      this.columnsConfig = this.personalReportData
        .filter((report: any) => report.name === SelectedValue)
        .map((report: any) => {
          return report.Columns.map((column: any) => ({
            dataField: column.Name,
            caption: column.Title,
            visible: column.Visibility,
            type: column.Type,
            format:
              column.Type === 'Decimal'
                ? {
                    type: 'fixedPoint',
                    precision: 2,
                  }
                : undefined,
          }));
        })
        .flat(); // Flatten the array in case each report has multiple columns

      this.ColumnNames = this.columnsConfig
        .filter((column) => column.visible)
        .map((column) => column.dataField);
    }
  };

  //==========show memorise save pop up==================
  show_Memorise_popup = () => {
    this.MemoriseReportName = '';
    this.isSaveMemorisedOpened = !this.isSaveMemorisedOpened;
  };
  //==========fetch custome memorise report name==========
  onMemoriseReportNameChanged(e) {
    this.MemoriseReportName = e.value;
  }
  //================Save Memorize Reports=================
  save_Memorise_Report() {
    const memoriseName = this.MemoriseReportName;
    const filterParameters = JSON.parse(sessionStorage.getItem('reportData'));
    const reportColumns = this.columndata;
    const allColumns = this.ColumnNames;
    const columns = this.dataGrid.instance.getVisibleColumns();
    const VisiblecolumnNames = columns
      .map((col) => col.caption || col.dataField)
      .filter((name) => name !== undefined);
    const hiddenColumns = allColumns.filter(
      (colName) => !VisiblecolumnNames.includes(colName)
    );
    const memoriseReportColumns = reportColumns.map((column) => {
      return {
        ...column,
        Visibility: hiddenColumns.includes(column.Name) ? false : true,
      };
    });
    this.reportengine
      .save_Memorise_report(
        memoriseName,
        memoriseReportColumns,
        filterParameters
      )
      .subscribe((response: any) => {
        if (response) {
          notify(
            {
              message: `${response.message}`,
              position: { at: 'top right', my: 'top right' },
            },
            'success'
          );
          this.show_Memorise_popup();
          // this.isSaveMemorisedOpened = false;
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
      });
  }
  //====================Find the column location from the datagrid================
  findColumnLocation = (e: any) => {
    const columnName = e.itemData;
    if (columnName != '' && columnName != null) {
      this.refresh();
      this.reportengine.makeColumnVisible(this.dataGrid, columnName);
    }
  };

  //=============DataGrid Refreshing=====================
  refresh = () => {
    this.dataGrid.instance.refresh();
  };

  //================Exporting Function===================
  onExporting(event: any) {
    const fileName = 'Cliam-Details-Activity';
    this.service.exportDataGrid(event, fileName);
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
    AdvanceFilterPopupModule,
    ClaimDetailActivityDrillDownModule,
  ],
  providers: [],
  exports: [],
  declarations: [ClaimDetailsActivityComponent],
})
export class ClaimDetailsActivityModule {}
