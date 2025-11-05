import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit, ViewChild } from '@angular/core';
import DevExpress from 'devextreme';
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
  DxTagBoxModule,
  DxLoadPanelModule,
  DxRadioGroupModule,
  DxDataGridComponent,
  DxDropDownBoxComponent,
  DxPopupModule,
  DxTextAreaModule,
} from 'devextreme-angular';
import notify from 'devextreme/ui/notify';
import { FormPopupModule } from 'src/app/components';
import { DataService } from 'src/app/services';

@Component({
  selector: 'app-check-post-office',
  templateUrl: './check-post-office.component.html',
  styleUrl: './check-post-office.component.scss',
})
export class CheckPostOfficeComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;

  @ViewChild('facilityDropDown', { static: false })
  facilityDropDown!: DxDropDownBoxComponent;

  readonly allowedPageSizes: any = [15, 25, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;

  isFilterRowVisible: boolean = false;

  // ========= init data dropdown datasource and value variables =========
  FileModeDataSource: any[] = [];
  PostOffice_Value: any;
  Facility_DataSource: any[];
  Facility_Value: number[] = [];
  TransactionTypeDatasource: any[];
  TransactionTypeValue: any;
  FileStatusDataSorce: any[];
  FileStatusValue: any;
  TransactionID: any;
  ClaimNumberValue: any;
  modeValue: number = 0;
  From_Date_Value: Date = null;
  To_Date_Value: Date = null;
  ToDateMax: Date = null;
  minDate: Date = null;
  maxDate: Date = new Date();

  isContentVisible: boolean = true;
  gridDataSource: any;

  loadingVisible: boolean = false;
  isDropDownOpened: boolean = false;

  popupVisible = false;
  headerFields: { label: string; value: string }[] = [];
  formattedXml: string = '';

  constructor(private dataservice: DataService) {}
  //=== on init functions of the page ========
  ngOnInit() {
    this.fetch_initData_Values();
  }

  // ========== fetch initial dropdown fields datasource ===========
  fetch_initData_Values() {
    this.dataservice.download_facility_initData().subscribe((res: any) => {
      this.loadingVisible = true;
      if (res.flag === '1') {
        this.Facility_DataSource = res.Facility;
        this.TransactionTypeDatasource = res.TransactionType;
        this.FileModeDataSource = res.FileMode;
        this.FileStatusDataSorce = res.FileStatus;
        this.loadingVisible = false;
      }
    });
  }
  // ============ facility dropdown selection change event =============
  onFacilitySelected(e: any): void {
    if (e.selectedRowsData.length) {
      const selectedFacility = e.selectedRowsData[0];
      this.Facility_Value = [selectedFacility.ID];
      this.PostOffice_Value = selectedFacility.PostOfficeID;
      this.facilityDropDown.instance.close();
    }
  }

  // =========== from date change event =================
  onFromDateChanged(e: any): void {
    this.From_Date_Value = e.value;

    if (this.From_Date_Value) {
      const fromDate = new Date(this.From_Date_Value);
      const today = new Date();
      const maxDateBy90Days = new Date(fromDate);
      maxDateBy90Days.setDate(fromDate.getDate() + 90);

      // Set max date as the lesser of (today or 90 days from fromDate)
      this.ToDateMax = maxDateBy90Days > today ? today : maxDateBy90Days;

      // Reset To_Date_Value if it exceeds new max
      if (this.To_Date_Value && this.To_Date_Value > this.ToDateMax) {
        this.To_Date_Value = null;
      }
    } else {
      this.ToDateMax = null;
    }
  }

  // ====== to date value change event =======
  onToDateChanged(e: any): void {
    this.To_Date_Value = e.value;
  }

  //================Show and Hide Search parameters==========
  toggleContent() {
    this.isContentVisible = !this.isContentVisible;
  }

  // ==============show or hide filter row of the datagrid =============
  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  //============ refresh datagrid ==============
  refresh = () => {
    this.dataGrid.instance.refresh();
  };

  // ======== format date =============
  formatDate = (date: any): string => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = `0${d.getMonth() + 1}`.slice(-2);
    const day = `0${d.getDate()}`.slice(-2);
    return `${year}-${month}-${day}`;
  };

  // ================= fetch datagrid data ===============
  get_Datagrid_DataSource() {
    this.loadingVisible = true;

    const inputData = {
      PostofficeID: String(this.PostOffice_Value),
      FacilityID: this.Facility_Value.join(','),
      TransactionType: String(this.TransactionTypeValue),
      DateFrom: this.formatDate(this.From_Date_Value),
      DateTo: this.formatDate(this.To_Date_Value),
      FileStatus: String(this.FileStatusValue),
      FileName: this.TransactionID ? String(this.TransactionID) : '',
      ClaimNumber: this.ClaimNumberValue ? String(this.ClaimNumberValue) : '',
      Mode: this.modeValue,
    };
    console.log('input data :>>', inputData);

    this.dataservice.get_facility_download_Data(inputData).subscribe({
      next: (res: any) => {
        if (res.flag === '1') {
          this.gridDataSource = res.data;
          this.isContentVisible = false;
        } else {
          this.gridDataSource = []; // Clear the grid if no valid data
          notify('An error occurred while loading data.', 'error', 3000);
        }
        this.loadingVisible = false;
      },
      error: (err) => {
        this.gridDataSource = [];
        this.loadingVisible = false;
        notify('An error occurred while loading data.', 'error', 3000);
        console.error('API error:', err);
      },
    });
  }

  // =========== detail data fetching ================
  openDetailsPopup = (event: any) => {
    this.loadingVisible = true;

    const selectedRowData = event.row.data;
    const inputFiledata = {
      PostofficeID: String(this.PostOffice_Value),
      FacilityID: this.Facility_Value.join(','),
      FileID: selectedRowData.FileID,
    };

    this.dataservice.get_facility_File_Data(inputFiledata).subscribe({
      next: (res: any) => {
        if (res.flag === '1') {
          const xmlString = res.XMLData;
          this.formattedXml = xmlString;

          this.headerFields = [];

          // ⬇️ Add File Name as the first item
          this.headerFields.push({
            label: 'File Name',
            value: selectedRowData.FileName || '',
          });

          // ⬇️ Extract Header fields from XML
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
          const headerNode = xmlDoc.getElementsByTagName('Header')[0];

          if (headerNode) {
            Array.from(headerNode.children).forEach((child) => {
              this.headerFields.push({
                label: child.nodeName,
                value: child.textContent ?? '',
              });
            });
          }

          this.popupVisible = true;
        } else {
          notify('Failed to fetch file data. Please try again.', 'error', 3000);
        }
      },
      error: (err) => {
        console.error('API error:', err);
        notify(
          'API error occurred. Please check your connection.',
          'error',
          3000
        );
      },
      complete: () => {
        this.loadingVisible = false;
      },
    });
  };

  // ======== Parse only the <Header> section using browser DOMParser ========
  extractHeaderFields(xml: string) {
    this.headerFields = [];
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, 'text/xml');
    const headerNode = xmlDoc.getElementsByTagName('Header')[0];

    if (headerNode) {
      Array.from(headerNode.children).forEach((child) => {
        this.headerFields.push({
          label: child.nodeName,
          value: child.textContent ?? '',
        });
      });
    }
  }
  // ======== download the popup xml content ============
  downloadXmlFile(): void {
    const blob = new Blob([this.formattedXml], { type: 'application/xml' });
    // Get file name from headerFields
    const fileNameEntry = this.headerFields.find(
      (field) => field.label === 'File Name'
    );
    let fileName = fileNameEntry?.value || 'file';
    // Remove existing .xml/.XML if already present
    if (fileName.toLowerCase().endsWith('.xml')) {
      fileName = fileName.slice(0, -4);
    }
    fileName += '.xml';
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    // Clean up
    URL.revokeObjectURL(link.href);
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
    DxTagBoxModule,
    DxLoadPanelModule,
    DxRadioGroupModule,
    DxPopupModule,
    DxTextAreaModule,
  ],
  providers: [],
  exports: [],
  declarations: [CheckPostOfficeComponent],
})
export class CheckPostOfficeModule {}
