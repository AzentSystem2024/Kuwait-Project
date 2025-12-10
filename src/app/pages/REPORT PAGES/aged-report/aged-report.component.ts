import { MasterReportService } from 'src/app/pages/MASTER PAGES/master-report.service';
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
import { DataService } from 'src/app/services';

@Component({
  selector: 'app-aged-report',
  templateUrl: './aged-report.component.html',
  styleUrl: './aged-report.component.scss'
})
export class AgedReportComponent {

  @ViewChild(DxDataGridComponent, { static: true })
    dataGrid: DxDataGridComponent;
  
    @ViewChild(DxTreeViewComponent, { static: false })
    treeView: DxTreeViewComponent;
  
  
    @ViewChild('lookup', { static: false }) lookup: DxLookupComponent;
  
    //=================DataSource for data Grid Table========
    dataGrid_DataSource: DataSource<any>;
  
    columnsConfig: any; //==============Column data storing variable
  
    //================Variables for Storing DataSource========
  
    monthDataSource: { name: string; value: any }[];
    years: number[] = [];
    Insurance_DataSource: any;
  
    //================Variables for Storing selected Parameters========
    From_Date_Value: any = new Date();
    As_on_date:any = new Date();
    To_Date_Value: any = new Date();
    selectedmonth: any = '';
    selectedYear: number | null = null;
    Insurance_Value;
  
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
    initialized: boolean;
  
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
    drilldownPopups: any[];
    isCloseButtonClicked: boolean = false;
    closedPopupsSet: Set<string> = new Set();
  FilteredDetailData:any=[]
  DetailsummaryColumns
  DetailsColumns
    constructor(private dataservice:DataService, private reportengine: ReportEngineService ){
      this.get_searchParameters_Dropdown_Values()
          this.minDate = new Date(2000, 1, 1); // Set the minimum date
    this.maxDate = new Date(); // Set the maximum date
    //============Year field dataSource===============
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 1950; year--) {
      this.years.push(year);
    }
       //=============month field datasource============
    this.monthDataSource = this.dataservice.getMonths();
    this.get_searchParameters_Dropdown_Values();

    }

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

    //================Show and Hide Search parameters========
  toggleContent() {
    this.isContentVisible = !this.isContentVisible;
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

    
  //====================Find the column location from the datagrid================
  findColumnLocation = (e: any) => {
    const columnName = e.itemData;
    if (columnName != '' && columnName != null) {
      // this.reportengine.makeColumnVisible(this.dataGrid, columnName);
    }
  };

  //=============DataGrid Refreshing=====================
  refresh = () => {
    // this.dataGrid.instance.refresh();
  };

  //================Exporting Function===================
  onExporting(event: any) {
    const fileName = 'Cliam-Details-Activity';
    // this.service.exportDataGrid(event, fileName);
  }
  async get_Datagrid_DataSource() {
    const formData = {
      InsuranceID: '',
      DateFrom: this.formatDate(this.From_Date_Value),
      DateTo: this.formatDate(this.To_Date_Value),
      AsOnDate: this.formatDate(this.As_on_date),
      Summary:0

    };
    console.log(formData)
    this.isContentVisible = false;
    // this.dataGrid.instance.beginCustomLoading('Loading...');
    this.dataservice.get_Aged_Summary(formData).subscribe((res:any)=>{
      console.log(res)
      this.dataGrid_DataSource=res.header.SummaryData
    })

  }

 

  formatDate(date) {
  const d = new Date(date);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
onCellClick(e:any){

  console.log(e,'==========detailed=============')
     const formData = {
      InsuranceID: e.data.InsuranceID,
      DateFrom: this.formatDate(this.From_Date_Value),
      DateTo: this.formatDate(this.To_Date_Value),
      AsOnDate: this.formatDate(this.As_on_date),
      Summary:0

    };

    this.dataservice.get_aged_details(formData).subscribe((res:any)=>{
      console.log(res)
      this.DetailsColumns=res.header.DetailData

      console.log(this.DetailsColumns)
    })

}

  // =========== Datagrid column formating =============
  generateColumnsConfig(reportColumns, userLocale) {
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
          formatter: (value: number) => {
            if (value == null) return '';

            return new Intl.NumberFormat('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(value);
          },
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
    
  ],
  providers: [],
  declarations: [AgedReportComponent],
  exports: [AgedReportComponent],
})
export class AgedReportModule {}
