import { MasterReportService } from './../../MASTER PAGES/master-report.service';
import { CommonModule, formatDate } from '@angular/common';
import {
  Component,
  NgModule,
  OnDestroy,
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
  DxDataGridComponent,
} from 'devextreme-angular';
import { SystemServicesService } from '../system-services.service';
import { ReportService } from 'src/app/services/Report-data.service';
import notify from 'devextreme/ui/notify';
import DataSource from 'devextreme/data/data_source';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services';
import { of, switchMap } from 'rxjs';
import { delay } from 'rxjs/operators';

@Component({
  selector: 'app-post-office-credentials',
  templateUrl: './post-office-credentials.component.html',
  styleUrls: ['./post-office-credentials.component.scss'],
  providers: [ReportService, DataService],
})
export class PostOfficeCredentialsComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;

  //========Variables for Pagination ====================
  readonly allowedPageSizes: any = [15, 25, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;
  isSearchPanelVisible = false;
  postOffice_DropDownData: any;

  isRowSearchVisible: boolean = false;

  dataSource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        this.systemService.get_PostOfficeCredencial_List().subscribe({
          next: (response: any) => {
            if (response) {
              const transformedData = response.data.map((item: any) => ({
                ...item,
                LastModifiedTime: this.dataService.formatDateTime(
                  item.LastModifiedTime
                ),
              }));
              resolve(transformedData); // Resolve with the transformed data
            } else {
              resolve([]); // Resolve with an empty array if response is falsy
            }
          },
          error: (error) => reject(error.message), // Reject with the error message
        });
      }),
  });

  currentPathName: any;
  initialized: boolean;

  columns: any;
  constructor(
    private systemService: SystemServicesService,
    private service: ReportService,
    private router: Router,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.get_PostOffice_DropDown();

    this.dataGrid.instance.refresh();
  }

  //=============Get Denial Type Drop dwn Data==============================
  get_PostOffice_DropDown() {
    let dropdownType = 'POSTOFFICE';
    this.systemService.Get_GropDown(dropdownType).subscribe((data: any) => {
      this.postOffice_DropDownData = data;
      this.columns = [
        {
          dataField: 'FacilityLicense',
          caption: 'Facility License',
          allowEditing: false,
          allowReordering: false,
          allowHiding: false,
        },
        {
          dataField: 'FacilityName',
          caption: 'Facility Name',
          allowEditing: false,
          allowReordering: false,
          allowHiding: false,
          width: '150',
        },
        {
          dataField: 'PostOfficeID',
          caption: 'Post Office',

          lookup: {
            dataSource: this.postOffice_DropDownData,
            displayExpr: 'DESCRIPTION',
            valueExpr: 'ID',
          },
        },
        {
          dataField: 'LoginName',
          caption: 'Login Name',
        },
        {
          dataField: 'Password',
          caption: 'Password',
          editorOptions: {
            mode: 'password',
          },
          cellTemplate: (container: any, options: any) => {
            const maskedPassword = '*'.repeat(options.value?.length || 0);
            container.textContent = maskedPassword;
          },
        },
        {
          dataField: 'LastModifiedTime',
          caption: 'Last Verified Time',
          width: 'auto',
        },
        {
          caption: 'Status',
          dataField: 'IsVerified',
          allowEditing: false,
          cellTemplate: (container, options) => {
            const icon = document.createElement('i');
            icon.className = options.value ? 'fas fa-flag' : 'fas fa-flag';
            icon.style.color = options.value ? '#4ef748' : 'red';
            icon.title = options.value; // Optional: Tooltip on hover
            icon.style.fontSize = '18px';
            icon.style.display = 'inline-block';
            icon.style.width = '100%';
            icon.style.textAlign = 'center';
            container.appendChild(icon);
          },
        },
      ];
    });
  }

  onRowUpdating(event: any) {
    const oldData = event.oldData;
    const newData = event.newData;
    const updatedData = { ...oldData, ...newData };
    const { FacilityID, PostOfficeID, LoginName, Password } = updatedData;

    this.systemService
      .verify_update_PostOfficeCredencial_Data(
        FacilityID,
        PostOfficeID,
        LoginName,
        Password
      )
      .pipe(
        switchMap((verifyResponse: any) => {
          if (verifyResponse.flag === 1) {
            notify(
              {
                message: `Verifying Credentials. Please Wait...`,
                position: { at: 'top right', my: 'top right' },
                displayTime: 5000,
              },
              'success'
            );

            // Wait 5 seconds before proceeding
            return of(verifyResponse).pipe(delay(5000));
          } else {
            throw new Error('Verification failed');
          }
        }),
        switchMap(() =>
          this.systemService.update_PostOfficeCredencial_Data(
            FacilityID,
            PostOfficeID,
            LoginName,
            Password
          )
        )
      )
      .subscribe(
        (updateResponse: any) => {
          if (updateResponse) {
            notify(
              {
                message: `${updateResponse.message}`,
                position: { at: 'top right', my: 'top right' },
                displayTime: 1000,
              },
              'success'
            );

            this.dataGrid.instance.refresh();
          } else {
            notify(
              {
                message: `Failed to update data.`,
                position: { at: 'top right', my: 'top right' },
                displayTime: 1000,
              },
              'error'
            );
          }
          event.component.cancelEditData();
        },
        (error: any) => {
          notify(
            {
              message: `Error: ${error.message}`,
              position: { at: 'top right', my: 'top right' },
              displayTime: 1000,
            },
            'error'
          );
          event.component.cancelEditData();
        }
      );

    event.cancel = true; // Prevent the default update operation
  }

  // onRowRemoving(event: any) {}
  //=================== Page refreshing==========================
  refresh = () => {
    this.dataGrid.instance.refresh();
  };

  showSearch = () => {
    this.isRowSearchVisible = !this.isRowSearchVisible;
  };

  //========================Export data ==========================
  onExporting(event: any) {
    const fileName = 'Post-office-credentials';
    this.service.exportDataGrid(event, fileName);
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
  ],
  providers: [],
  exports: [],
  declarations: [PostOfficeCredentialsComponent],
})
export class PostOfficeCredentialsModule {}
