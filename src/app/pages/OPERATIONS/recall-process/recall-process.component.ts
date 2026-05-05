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
import { ReportEngineService } from '../../REPORT PAGES/report-engine.service';
import DataSource from 'devextreme/data/data_source';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import notify from 'devextreme/ui/notify';
import { ClaimDetailActivityDrillDownComponent } from '../../REPORT DRILL PAGES/claim-detail-activity-drill-down/claim-detail-activity-drill-down.component';
import { ClaimDetailActivityDrillDownModule } from '../../REPORT DRILL PAGES/claim-detail-activity-drill-down/claim-detail-activity-drill-down.component';
import { AdvanceFilterPopupModule } from '../../POP-UP_PAGES/advance-filter-popup/advance-filter-popup.component';
import { DataService } from 'src/app/services/data.service';
import CustomStore from 'devextreme/data/custom_store';
import { PopupStateService } from 'src/app/popupStateService.service';
import { confirm, custom } from 'devextreme/ui/dialog';

//=====================Excel Exporting Libraries=================
import { Workbook } from 'exceljs';
import { Injectable } from '@angular/core';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import { ReportService } from 'src/app/services/Report-data.service';

@Component({
  selector: 'app-recall-process',
  providers: [ReportService, ReportEngineService, DatePipe, DataService],

  templateUrl: './recall-process.component.html',
  styleUrl: './recall-process.component.scss',
})
export class RecallProcessComponent {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid!: DxDataGridComponent;

  @ViewChild(DxTreeViewComponent, { static: false })
  treeView!: DxTreeViewComponent;

  @ViewChild(ClaimDetailActivityDrillDownComponent, { static: false })
  claimDrill!: ClaimDetailActivityDrillDownComponent;

  @ViewChild('lookup', { static: false }) lookup!: DxLookupComponent;

  //=================DataSource for data Grid Table========
  dataGrid_DataSource!: DataSource<any>;

  columnsConfig: any; //==============Column data storing variable

  //================Variables for Storing DataSource========

  monthDataSource: { name: string; value: any }[];
  years: number[] = [];
  Insurance_DataSource: any;

  //================Variables for Storing selected Parameters========
  From_Date_Value: any = new Date();
  To_Date_Value: any = new Date();
  selectedmonth: any = '';
  selectedYear: number = 0;
  Insurance_Value: any;

  //========Variables for Pagination ====================
  readonly allowedPageSizes: any = [20, 50, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;
  show_Pagination = true;

  //=====================other variables==================
  isContentVisible: boolean = true;
  hint_for_Parametr_div: any = 'Hide Parameters';
  currentPathName: any;

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
  selectedRowKeys: any[] = [];

  popupWidth: any = '90%';
  popupHeight: any = '90vh';
  popupPosition: any = { my: 'center', at: 'center' };
  isPopupMinimised: boolean = false;

  jsonData: any;
  PayerIDjsonData: any;
  RecieverIDjsonData: any;
  ClinicianJsonData: any;
  orderingClinicianJsonData: any;
  //============Custom close button for drilldown popup============
  toolbarItems: any;
  drilldownPopups: any[] = [];
  isCloseButtonClicked: boolean = false;
  closedPopupsSet: Set<string> = new Set();
  precision: any;
  //=================Excel Exporting Variables===================
  EXCEL_TYPE =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
  EXCEL_EXTENSION = '.xlsx';
  isExporting = false;
  exportProgress = 0;
  exportStatus = '';
  private worker: Worker | null = null;
  private chunks: any[][] = [];
  totalRows: any = 0;
  private chunkSize = 10000;
  RevokeButtonOptions = {
    text: 'Revoke',
    type: 'default',
    stylingMode: 'contained',
    hint: 'Add new entry',
    onClick: () => this.revoke_process(),
    elementAttr: { class: 'add-button' },
  };
  His_id: any;
  IS_GROUP_MATCHED: boolean = false;
  User_Id: any
  constructor(
    private service: ReportService,
    private router: Router,
    private reportengine: ReportEngineService,
    private datePipe: DatePipe,
    private dataservice: DataService,
    private popupStateService: PopupStateService,
    private cdr: ChangeDetectorRef,
  ) {
    const systemInfo = JSON.parse(
      sessionStorage.getItem('SYSTEM_INFO') || '{}',
    );
    console.log(systemInfo);
    this.precision = systemInfo.Data.NUMBER_INFO.DECIMAL_DIGITS;
    console.log(this.precision);

    this.sessionDetails()

    // this.loadingVisible = true;

    this.minDate = new Date(2000, 1, 1); // Set the minimum date
    this.maxDate = new Date(); // Set the maximum date
    //============Year field dataSource===============
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 2024; year--) {
      this.years.push(year);
    }
    //=============month field datasource============
    this.monthDataSource = this.service.getMonths();
    this.get_searchParameters_Dropdown_Values();
    // this.updateToolbarItems();
    if (this.drilldownPopups && this.drilldownPopups.length > 0) {
      this.drilldownPopups.forEach((popup) => {
        this.updateToolbarItems(popup.id); // Pass the popupId when calling this method
      });
    }
    // Add the subscription to NavigationStart here
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
  sessionDetails() {
    const LoginResponse = JSON.parse(localStorage.getItem('logData') || '{}');
    this.User_Id = LoginResponse.UserID;

  }


  public exportAsExcelFile(json: any[], excelFileName: string): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);
    const workbook: XLSX.WorkBook = {
      Sheets: { data: worksheet },
      SheetNames: ['data'],
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'buffer',
    });
    this.saveAsExcelFile(excelBuffer, excelFileName);
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], {
      type: this.EXCEL_TYPE,
    });
    FileSaver.saveAs(
      data,
      fileName + '_export_' + new Date().getTime() + this.EXCEL_EXTENSION,
    );
  }
  exportLargeData() {
    console.log(this.dataGrid, '=========datagrid instance');
    // const data =  this.dataGrid.instance.getDataSource().items();
    const data = this.dataGrid_DataSource;
    console.log(this.dataGrid_DataSource, '=========datagrid datasource');

    console.log(data, '=========data to export');

    if (!data) {
      notify('No data to export', 'warning', 2000);
      return;
    }

    this.isExporting = true;
    this.exportProgress = 0;

    const chunkSize = 10000;
    // const total = data.length;
    let processed = 0;

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet([]);

    const processChunk = () => {
      // const chunk = data.slice(processed, processed + chunkSize);

      // XLSX.utils.sheet_add_json(worksheet, chunk, {
      //   skipHeader: processed !== 0,
      //   origin: -1,
      // });

      processed += chunkSize;
      // this.exportProgress = Math.round((processed / total) * 100);

      // if (processed < total) {
      //   setTimeout(processChunk, 0); // ✅ prevents UI freeze
      // } else {
      //   const workbook: XLSX.WorkBook = {
      //     Sheets: { data: worksheet },
      //     SheetNames: ['data'],
      //   };

      //   const excelBuffer = XLSX.write(workbook, {
      //     bookType: 'xlsx',
      //     type: 'array',
      //   });

      //   this.saveAsExcelFile(excelBuffer, 'Claim_Details');

      //   this.isExporting = false;
      //   notify('Export completed!', 'success', 2000);
      // }
    };

    processChunk();
  }

  ngOnInit(): void {
    this.popupStateService.getPopupState('claimDetaisDrillDownPopup');
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

  //============= minimise popup ==========
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
        popup.width = '100%';
        popup.height = '90vh';
        popup.position = { my: 'center', at: 'center' }; // Example position
        popup.icon = 'minimize-icon';
      }

      // Re-render the popup
      this.cdr.detectChanges(); // Trigger change detection
      this.updateToolbarItems(popupId); // Update toolbar items after minimizing
    }
  }

  //========Remove closing popup from the popup array=====
  closePopup() {
    this.popupStateService.setPopupState('claimDetaisDrillDownPopup', false);
    this.isDrillDownPopupOpened = false;
  }
  //================Show and Hide Search parameters========
  toggleContent() {
    this.isContentVisible = !this.isContentVisible;
  }

  //=================Row click drill Down===================
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
      height: '80vh',
      position: { my: 'center', at: 'center' },
      rowData: rowData,
      isOpened: true, // Ensure this popup is opened
      isPopupMinimised: false,
    });
    this.popupStateService.setPopupState(popupId, true);
    // this.updateToolbarItems(popupId);
  };

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

  closePopup1(popup: any): void {
    popup.isOpened = false; // Hide the popup

    this.closedPopupsSet.add(popup.id);
    // Additional logic for closing the popup can go here
  }

  // //===========Function to handle selection change and sort the data==========
  // onSelectionChanged(event: any, jsonData: any[], dataSourceKey: string): void {
  //   const selectedRows = event.selectedRowsData;
  //   const selectedRowIds = selectedRows.map((row) => row.ID);
  //   const unselectedRows = jsonData.filter(
  //     (row) => !selectedRowIds.includes(row.ID),
  //   );
  //   const reorderedData = [...selectedRows, ...unselectedRows];
  //   this[dataSourceKey] = this.makeAsyncDataSourceFromJson(reorderedData);

  //   this.dataGrid.instance.refresh();
  // }

  //============Get search parameters dropdown values=======
  get_searchParameters_Dropdown_Values() {
    this.loadingVisible = true;
    this.dataservice.Get_GropDown('INSURANCE').subscribe((res: any) => {
      if (res) {
        this.Insurance_DataSource = res;
        this.loadingVisible = false;
      }
    });
  }

  //=========Fetch DataSource For The Datagrid Table==========
  async get_Datagrid_DataSource() {
    const formData = {
      INSURANCE_ID: this.Insurance_Value,
      DATE_FROM: this.reportengine.formatDate(this.From_Date_Value),
      DATE_TO: this.reportengine.formatDate(this.To_Date_Value),
    };
    this.isContentVisible = false;
    this.dataGrid.instance.beginCustomLoading('Loading...');
    try {
      const response: any = await this.service
        .get_revoke_list(formData)
        .toPromise();
      if (response.flag === '1') {
        console.log(response, '=========response from api');
        this.isEmptyDatagrid = false;
        this.columndata = response.header.ReportColumns;
        const userLocale = navigator.language || 'en-US';
        this.summaryColumnsData = this.generateSummaryColumns(
          response.header.ReportColumns,
        );

        this.columnsConfig = this.generateColumnsConfig(
          response.header.ReportColumns,
          userLocale,
        );

        this.ColumnNames = this.columnsConfig
          .filter((column: any) => column.visible)
          .map((column: any) => column.caption);

        const formattedReportData = response.header.ReportData;

        // ✅ Filter only required status
        const filteredData = formattedReportData.filter(
          (item: any) =>
            item.STATUS_NAME === 'Rejected' || item.STATUS_NAME === 'Remitted',
        );

        // Bind filtered data
        this.dataGrid_DataSource = new DataSource<any>({
          load: () => Promise.resolve(filteredData),
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
          'error',
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
        'error',
      );
    }
  }
  // ================ generate summary columns ===============
  generateSummaryColumns(reportColumns: any) {
    const decimalColumns = reportColumns.filter(
      (col: any) => col.Type === 'Decimal' && col.Summary,
    );

    const intColumns = reportColumns.filter(
      (col: any) => col.Type === 'Int32' && col.Summary,
    );

    return {
      totalItems: [
        ...decimalColumns.map((col: any) =>
          this.createSummaryItem(col, false, 'sum', 'decimal'),
        ),
        ...intColumns.map((col: any) =>
          this.createSummaryItem(col, false, 'sum', 'count'),
        ),
      ],
      groupItems: [
        ...decimalColumns.map((col: any) =>
          this.createSummaryItem(col, true, 'sum', 'decimal'),
        ),
        ...intColumns.map((col: any) =>
          this.createSummaryItem(col, true, 'sum', 'count'),
        ),
      ],
    };
  }
  // ================ create summary columns format ===============
  createSummaryItem(
    col: any,
    isGroupItem = false,
    summaryType = 'sum',
    formatType: any,
  ) {
    return {
      column: col.Name,
      summaryType: summaryType,
      displayFormat: formatType === 'count' ? ' {0} ' : '{0}',
      valueFormat:
        formatType === 'decimal'
          ? {
            style: 'decimal',
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
          }
          : null,
      alignByColumn: isGroupItem, // Align by column if it's a group item
      showInGroupFooter: isGroupItem, // Show in group footer for group items
    };
  }
  // =========== generate full column data format =============
  generateColumnsConfig(reportColumns: any, userLocale: any) {
    return reportColumns.map((column: any) => {
      let columnFormat;

      if (column.Type === 'datetime') {
        columnFormat = {
          type: 'date',
          formatter: (date: any) =>
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
          precision: 3,
          formatter: (value: any) =>
            new Intl.NumberFormat(userLocale, {
              minimumFractionDigits: 3,
              maximumFractionDigits: 3,
            }).format(value),
        };
      }
      if (column.Type === 'percentage') {
        columnFormat = {
          type: 'percent',
          precision: 2,
          formatter: (value: any) =>
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
        0,
      );
    }
  }

  //============Hide drop down after Value Selected======
  onDropdownValueChanged() {
    const lookupInstance = this.lookup.instance;
    if (lookupInstance) {
      lookupInstance.close();
      lookupInstance.option('searchValue', '');
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

  findColumnLocation = (e: any) => {
    const columnName = e.itemData;
    if (columnName != '' && columnName != null) {
      this.reportengine.makeColumnVisible(this.dataGrid, columnName);
    }
  };

  //=============DataGrid Refreshing=====================
  refresh = () => {
    this.dataGrid.instance.refresh();
  };

  //================Exporting Function===================
  onExporting(event: any) {
    console.log(event, '===========event ====== data');
    const fileName = 'Cliam-Details-Activity';
    this.service.exportDataGrid(event, fileName);
    // this.exportLargeData();
  }
  async revoke_process() {
    if (this.IS_GROUP_MATCHED) {
      const dialog = custom({
        title: 'Confirmation',
        messageHtml: `
          <div style="width:300px; height:100px; font-size:14px; text-align:center; padding:15px; box-sizing:border-box;">
            <p>Manual processing contains multiple claim records. This action will revoke all. Do you want to continue?</p>

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

    const payload = {
      UserID: this.User_Id,
      HIS_ID: this.His_id,
    };
    this.service.Revoke_process(payload).subscribe((res: any) => {
      console.log(res, '=========response from revoke api');
      if (res.flag === '1') {
        notify(
          {
            message: `${res.message}`,
            position: { at: 'top right', my: 'top right' },
          },
          'success',
        );
        this.get_Datagrid_DataSource();
      } else {
        notify(
          {
            message: `${res.message}`,
            position: { at: 'top right', my: 'top right' },
          },
          'error',
        );
      }
    });
  }
  onSelectionChanged(event: any) {
    if (event.selectedRowKeys.length > 1) {
      const lastKey = event.selectedRowKeys[event.selectedRowKeys.length - 1];

      event.component.selectRows([lastKey], false);
    }

    const selectedData = event.selectedRowsData;

    if (selectedData.length > 0) {
      const lastRow = selectedData[selectedData.length - 1]; // ✅ last selected row
      this.His_id = lastRow.HIS_ID;
      this.IS_GROUP_MATCHED = lastRow.IS_GROUP_MATCHED;
    }

    console.log(this.His_id, 'Selected HIS_ID');
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
  declarations: [RecallProcessComponent],
})
export class RecallProcessModule { }
