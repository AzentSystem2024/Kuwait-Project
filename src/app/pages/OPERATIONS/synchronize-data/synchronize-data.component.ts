import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  NgModule,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  DxDataGridComponent,
  DxDataGridModule,
  DxLoadPanelModule,
  DxPopupModule,
  DxToolbarModule,
  DxValidatorComponent,
  DxValidatorModule,
} from 'devextreme-angular';
import { DxSelectBoxModule } from 'devextreme-angular';
import { DxDateBoxModule } from 'devextreme-angular';
import { DxNumberBoxModule } from 'devextreme-angular';
import { DxButtonModule } from 'devextreme-angular';
import { DxProgressBarModule } from 'devextreme-angular';
import { DataService } from 'src/app/services';
import notify from 'devextreme/ui/notify';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import { DxToastModule } from 'devextreme-angular';
import { concatMap, finalize, from, Subscription } from 'rxjs';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { SystemServicesService } from '../../SYSTEM PAGES/system-services.service';
import { FormPopupModule } from 'src/app/components';

@Component({
  selector: 'app-synchronize-data',
  templateUrl: './synchronize-data.component.html',
  styleUrls: ['./synchronize-data.component.scss'],
})
export class SynchronizeDataComponent implements OnInit, OnDestroy {
  @ViewChild('facilityValidator', { static: false })
  facilityValidator!: DxValidatorComponent;

  @ViewChild(DxDataGridComponent, { static: false })
  dataGrid!: DxDataGridComponent;

  @ViewChild('folderInput') fileInput!: ElementRef<HTMLInputElement>;

  selectedFiles: File[] = [];
  uploading: boolean = false;
  currentFileIndex: any = 0;

  toolbarItems = [
    {
      text: 'Synchronize Claim & Remittance',
      location: 'before',
    },
  ];

  FacilitydropdownItems: any;
  FacilityValue: any;
  isfacilityEmpty: boolean = false;

  facilityDownloadedCount: number = 0o0;
  RemittanceDownloadedCount: number = 0o0;

  startDate: any = new Date();
  endDate: any = new Date();
  countValue: any;
  minDate: Date;
  maxDate: Date;

  isLoading: boolean = false;
  showProgressBar: boolean = false;
  maxValue: any; // Set the maximum value for progress
  seconds: any; // The current value for progress (e.g., time elapsed)

  remittanceButtonVisibility: boolean = true;
  facilityButtonVisibility: boolean = true;
  processReportButtonVisibility: boolean = true;
  lastClaimSyncTime: any;
  lastRemittanceSyncTime: any;
  message: string = '';
  disableButtons = false;
  intervalId: any;

  facility_Liecence_Info_Data: any;
  isImportClaimXlmPopupVisible = false;
  // serviceSubscription: Subscription | null = null; // For managing the service subscription
  private serviceSubscription: Subscription | null = null;
  private routerSubscription: Subscription | null = null;
  xmlFile_DataSource: any[] = [];
  selectedRowKeys: any[] = [];
  importType: 'claim' | 'remittance' = 'claim';

  constructor(
    private dataService: DataService,
    private masterservice: MasterReportService,
    private router: Router,
    private systemservice: SystemServicesService
  ) {
    this.get_Facility_List_Data();
    this.fetch_last_sync_times();
  }

  ngOnInit() {
    this.minDate = new Date(2000, 1, 1);
    this.maxDate = new Date();
    this.fetchServiceStatus();
    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        // Stop notifications when leaving the page
        console.log('NavigationStart detected, stopping notifications');
        this.clearNotificationInterval();
      } else if (
        event instanceof NavigationEnd &&
        this.isCurrentPage(event.urlAfterRedirects)
      ) {
        // Restore notifications when returning to this page
        console.log('NavigationEnd detected, restoring notifications');
        this.restoreNotificationOnNavigation();
      }
    });
  }

  isCurrentPage(url: string): boolean {
    return url === '/Synchronize-Data-Pages';
  }

  format(ratio) {
    return `Downloading: ${ratio * 100}%`;
  }

  //=========================Fetch facility list===================
  get_Facility_List_Data() {
    this.dataService
      .get_UserWise_FacilityList_Data()
      .subscribe((response: any) => {
        if (response) {
          this.FacilitydropdownItems = response.facilityDetails;
        }
      });

    this.systemservice.list_license_info_data().subscribe((response: any) => {
      this.facility_Liecence_Info_Data = response.data;
    });
  }

  //==================get last sync time===========================
  fetch_last_sync_times() {
    this.dataService
      .get_DashbOard_SyncData_Details()
      .subscribe((response: any) => {
        const formattedData = response.data.map((item: any) => ({
          ...item,
          ClaimTransactionDate: this.dataService.formatDateTime(
            item.ClaimTransactionDate
          ),
          RemittanceTransactionDate: this.dataService.formatDateTime(
            item.RemittanceTransactionDate
          ),
          LastSynchDate: this.dataService.formatDateTime(item.LastSynchDate),
        }));
        this.lastClaimSyncTime = `Last Claim Sync Time is : ${formattedData[0].ClaimTransactionDate}`;
        this.lastRemittanceSyncTime = `Last Remittance Sync Time is : ${formattedData[0].RemittanceTransactionDate}`;
      });
  }

  //============ facility drop down value change event =============
  onFacilityExpiryCheck = (): boolean => {
    let isFacilityExists = this.facility_Liecence_Info_Data.find(
      (facility) => facility.ID === this.FacilityValue
    );
    if (isFacilityExists) {
      let currentDate = new Date();
      let expiryDate = new Date(isFacilityExists.Expiry_Date);

      if (expiryDate < currentDate) {
        notify(
          {
            message: `Your selected facility has expired.`,
            position: { at: 'top right', my: 'top right' },
          },
          'error'
        );
        return false; // Facility is expired
      } else {
        return true; // Facility is valid
      }
    }
    return false; // Facility not found (invalid selection)
  };
  //=================== Show XML data import Popup =================
  showImportXMLPopup(clickData) {
    const validationResult = this.facilityValidator.instance.validate();
    if (validationResult && this.FacilityValue) {
      let isfacilityExpired = this.onFacilityExpiryCheck();
      if (isfacilityExpired === true) {
        this.isImportClaimXlmPopupVisible = true;
        this.importType = clickData;
      } else {
        notify(
          {
            message: `Selected facility is expired..`,
            position: { at: 'top right', my: 'top right' },
          },
          'error'
        );
      }
    } else {
      notify(
        {
          message: `Select a facility value and try again..`,
          position: { at: 'top right', my: 'top right' },
        },
        'error'
      );
    }
  }
  //============ CLEAR POPUP DATA AFTER THE POPUP CLOSING ===========
  closeImportXMLPopup() {
    this.isImportClaimXlmPopupVisible = false;
  }

  //============================================================================================================================================
  triggerFileInput() {
    let fileInput = document.getElementById('folderInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }
  //==================== making all columns selected ===============
  clearPopupData() {
    this.xmlFile_DataSource = [];
    this.selectedRowKeys = [];
  }

  //==========Handle file selection event for loading datagrid========
  handleFileSelection(event: any): void {
    console.log('Loaded Data:>>', event.target);
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    let fileList: any[] = [];
    let fileReadPromises: Promise<any>[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      let file = selectedFiles[i];
      // Create a promise to read file data
      let filePromise = new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            ID: i + 1, // Unique ID for selection
            FileName: file.name,
            FileSize: (file.size / 1024).toFixed(2), // Convert to KB
            FileType: file.type || 'Unknown',
            FileData: reader.result as string, // Store file content as Base64 or text
          });
        };
        reader.onerror = reject;
        reader.readAsText(file); // Read file as text (change to `readAsDataURL(file)` for Base64)
      });
      fileReadPromises.push(filePromise);
    }
    // Wait for all files to be read
    Promise.all(fileReadPromises).then((filesWithData) => {
      if (!Array.isArray(this.xmlFile_DataSource)) {
        this.xmlFile_DataSource = [];
      }
      // Update DataGrid & Select All Rows
      this.xmlFile_DataSource = [...this.xmlFile_DataSource, ...filesWithData];
      if (this.xmlFile_DataSource.length > 0) {
        this.selectedRowKeys = this.xmlFile_DataSource.map((item) => item.ID);
        console.log('Updated DataGrid:', this.xmlFile_DataSource);
        console.log('Selected Rows:', this.selectedRowKeys);
      }
    });
    event.target.value = '';
  }

  //==================== Upload Files to API ====================
  uploadFiles() {
    this.isLoading = true;
    let type = this.importType;
    const selectedData = this.dataGrid.instance.getSelectedRowsData();
    console.log('selected row data only :>>', selectedData);

    from(selectedData)
      .pipe(
        concatMap((file) =>
          type === 'claim'
            ? this.dataService.import_Local_folder_Claim_data(
                this.FacilityValue,
                file.FileName,
                file.FileData
              )
            : this.dataService.import_Local_folder_Remittance_data(
                this.FacilityValue,
                file.FileName,
                file.FileData
              )
        ),
        finalize(() => {
          this.isLoading = false;
          notify(
            {
              message: `All selected files imported successfully.`,
              position: { at: 'top right', my: 'top right' },
            },
            'success'
          );
        })
      )
      .subscribe({
        next: (response) =>
          console.log('File uploaded successfully:', response),
        error: (error) => console.error('Error uploading file:', error),
      });
  }

  //=========================================================================================================================================
  //====================Click event of Facility Sync==============
  handleClaimButtonClick() {
    const validationResult = this.facilityValidator.instance.validate();
    if (validationResult.isValid) {
      let isfacilityExpired = this.onFacilityExpiryCheck();
      console.log('facility expired>>', isfacilityExpired);
      if (isfacilityExpired === true) {
        this.facilityButtonVisibility = false;
        this.facilityDownloadedCount = 0;
        let facilityID = this.FacilityValue;
        let fromDate = new Date(this.startDate);
        let endDate = new Date(this.endDate);
        // Calculate the total number of days between fromDate and endDate
        const totalDays =
          Math.floor(
            (endDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
          ) + 1;
        this.maxValue = totalDays;
        this.seconds = 0;
        this.showProgressBar = true;

        const callApiForDate = (currentDate: any) => {
          const formattedDate = this.convertDateToYYYYMMDD(currentDate);
          this.dataService
            .get_Claim_SyncData_Details(
              facilityID,
              formattedDate,
              formattedDate
            )
            .subscribe(
              (response: any) => {
                if (response.flag === 1) {
                  this.facilityDownloadedCount =
                    this.facilityDownloadedCount + response.count;
                  this.seconds++;
                  if (this.seconds >= totalDays) {
                    this.showProgressBar = false;
                    notify(
                      {
                        message: `Claim Sync completed!`,
                        position: { at: 'top right', my: 'top right' },
                      },
                      'success'
                    );
                  } else {
                    const nextDate = new Date(currentDate);
                    nextDate.setDate(currentDate.getDate() + 1);
                    callApiForDate(nextDate);
                  }
                } else {
                  console.error(`Error syncing data for ${formattedDate}`);
                }
              },
              (error) => {
                console.error(`Error on ${formattedDate}:`, error);
              }
            );
        };
        callApiForDate(fromDate);
        this.facilityButtonVisibility = true;
      } else {
        notify(
          {
            message: `Selected facility is expired..`,
            position: { at: 'top right', my: 'top right' },
          },
          'error'
        );
      }
    } else {
      notify(
        {
          message: `Select a facility value and try again..`,
          position: { at: 'top right', my: 'top right' },
        },
        'error'
      );
    }
  }

  //===================Click event of Remittance Sync=============
  handleRemittanceButtonClick() {
    const validationResult = this.facilityValidator.instance.validate();
    if (validationResult.isValid) {
      let isfacilityExpired = this.onFacilityExpiryCheck();
      if (isfacilityExpired === true) {
        this.remittanceButtonVisibility = false;
        this.RemittanceDownloadedCount = 0;
        let facilityID = this.FacilityValue;
        let fromDate = new Date(this.startDate);
        let endDate = new Date(this.endDate);
        // Calculate the total number of days between fromDate and endDate
        const totalDays =
          Math.floor(
            (endDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
          ) + 1;
        this.maxValue = totalDays;
        this.seconds = 0;
        this.showProgressBar = true;
        const callApiForDate = (currentDate: any) => {
          const formattedDate = this.convertDateToYYYYMMDD(currentDate);
          this.dataService
            .get_Remittance_SyncData_Details(
              facilityID,
              formattedDate,
              formattedDate
            )
            .subscribe(
              (response: any) => {
                if (response.flag === 1) {
                  this.RemittanceDownloadedCount =
                    this.RemittanceDownloadedCount + response.count;
                  this.seconds++;
                  if (this.seconds >= totalDays) {
                    this.showProgressBar = false;
                    notify(
                      {
                        message: `Remittance Sync completed!`,
                        position: { at: 'top right', my: 'top right' },
                      },
                      'success'
                    );
                  } else {
                    const nextDate = new Date(currentDate);
                    nextDate.setDate(currentDate.getDate() + 1);
                    callApiForDate(nextDate);
                  }
                } else {
                  console.error(`Error syncing data for ${formattedDate}`);
                }
              },
              (error) => {
                console.error(`Error on ${formattedDate}:`, error);
              }
            );
        };
        callApiForDate(fromDate);
        this.remittanceButtonVisibility = true;
      } else {
        notify(
          {
            message: `Selected facility is expired..`,
            position: { at: 'top right', my: 'top right' },
          },
          'error'
        );
      }
    } else {
      notify(
        {
          message: `Select a facility value and try again..`,
          position: { at: 'top right', my: 'top right' },
        },
        'error'
      );
    }
  }

  //================ Click event of Process Report ===============
  ProcessReportButtonClick() {
    const validationResult = this.facilityValidator.instance.validate();
    if (validationResult.isValid) {
      this.isLoading = true;
      this.processReportButtonVisibility = false;
      let facilityID = this.FacilityValue;
      this.dataService
        .get_Process_ReportData_Details(facilityID)
        .subscribe((response: any) => {
          if (response.flag === 1) {
            this.isLoading = false;
            notify(
              {
                message: `Data Sync Successfully Completed`,
                position: { at: 'top right', my: 'top right' },
              },
              'success'
            );
          }
        });
    } else {
      notify(
        {
          message: `Select a facility value and try again..`,
          position: { at: 'top right', my: 'top right' },
        },
        'error'
      );
    }
  }

  onStartDateChange(event: any) {
    const selectedStartDate = event.value;
    if (this.endDate && selectedStartDate > this.endDate) {
      this.endDate = selectedStartDate;
    }
  }

  // Event handler for changes in End Date
  onEndDateChange(event: any) {
    const selectedEndDate = event.value;
    if (this.startDate && selectedEndDate < this.startDate) {
      this.startDate = selectedEndDate;
    }
  }
  //=================Convert the date format==================
  convertDateToYYYYMMDD(inputDate: string): string {
    const date = new Date(inputDate);
    // Get year, month, and date
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  fetchServiceStatus() {
    this.serviceSubscription = this.dataService
      .getServiceSynchStatus()
      .subscribe((response: any) => {
        console.log(response, 'SERVICESTATUS');
        // If Flag is 1, enable notifications for this page
        if (response.Flag === 1) {
          this.disableButtons = true;
          // Notify immediately
          notify(
            {
              message: response.Message,
              position: {
                at: 'top right',
                my: 'top right',
              },
            },
            'success'
          );
          // Clear any existing interval to avoid duplication
          if (this.intervalId) {
            clearInterval(this.intervalId);
          }
          // Start a new interval to display the message every 30 seconds
          this.intervalId = setInterval(() => {
            notify(
              {
                message: response.Message,
                position: {
                  at: 'top right',
                  my: 'top right',
                },
              },
              'success'
            );
          }, 5000);
        } else {
          // If Flag is not 1, clear the interval
          this.clearNotificationInterval();
          this.disableButtons = false;
        }
      });
  }

  restoreNotificationOnNavigation(): void {
    console.log('Restoring notifications for SpecificPageComponent');
    this.fetchServiceStatus();
  }

  clearNotificationInterval(): void {
    // Clear the interval if it exists
    if (this.intervalId) {
      console.log('Clearing interval:', this.intervalId);
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  ngOnDestroy(): void {
    console.log('ngOnDestroy called for SpecificPageComponent');

    // Clear the interval and unsubscribe from all subscriptions
    this.clearNotificationInterval();

    if (this.serviceSubscription) {
      this.serviceSubscription.unsubscribe();
      console.log('Unsubscribed from serviceSubscription');
    }

    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
      console.log('Unsubscribed from routerSubscription');
    }
  }
}

@NgModule({
  imports: [
    CommonModule,
    DxToolbarModule,
    DxSelectBoxModule,
    DxDateBoxModule,
    DxNumberBoxModule,
    DxButtonModule,
    DxProgressBarModule,
    DxLoadPanelModule,
    DxValidatorModule,
    DxToastModule,
    FormPopupModule,
    DxDataGridModule,
  ],
  providers: [],
  exports: [],
  declarations: [SynchronizeDataComponent],
})
export class SynchronizeDataModule {}
