import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
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
  DxPopupModule,
} from 'devextreme-angular';
import { FormPopupModule } from 'src/app/components';
import { InsuranceNewFormComponent } from '../../POP-UP_PAGES/insurance-new-form/insurance-new-form.component';
import notify from 'devextreme/ui/notify';
import { ReportService } from 'src/app/services/Report-data.service';
import { MasterReportService } from '../master-report.service';
import { InsuranceNewFormModule } from '../../POP-UP_PAGES/insurance-new-form/insurance-new-form.component';

import DataSource from 'devextreme/data/data_source';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services';

@Component({
  selector: 'app-insurance',
  templateUrl: './insurance.component.html',
  styleUrls: ['./insurance.component.scss'],
  providers: [ReportService, DataService],
})
export class InsuranceComponent {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;

  @ViewChild(InsuranceNewFormComponent, { static: false })
  InsuranceNewForm: InsuranceNewFormComponent;

  showSearchBox = false;
  showSearchIcon = true;
  //========Variables for Pagination ====================
  readonly allowedPageSizes: any = [15, 25, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;
  facilityGroupDatasource: any;
  isAddFormPopupOpened: boolean = false;
  isUpdateFormPopupOpened: boolean = false;

  dataSource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        this.masterService.get_Insurance_List().subscribe({
          next: (response: any) => {
            if (response.flag === '1') {
              resolve(response.data || []);
            } else {
              resolve([]);
            }
          },
          error: (error) => reject(error.message),
        });
      }),
  });

  addButtonOptions = {
    text: 'New',
    icon: 'bi bi-plus-circle-fill',
    type: 'default',
    stylingMode: 'contained',
    hint: 'Add new entry',
    onClick: () => this.show_new_Form(),
    elementAttr: { class: 'add-button' },
  };

  isFilterRowVisible: boolean = false;
  currentPathName: any;
  initialized: boolean;
  selectedInsurance: any;

  constructor(
    private service: ReportService,
    private masterService: MasterReportService
  ) {}

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  ShowSearch = () => {
    this.showSearchIcon = !this.showSearchIcon;
    this.showSearchBox = !this.showSearchBox;
  };

  //========== show new popup ===========
  show_new_Form() {
    this.isAddFormPopupOpened = true;
  }

  //========== show new popup =============
  close_new_Form = () => {
    this.isAddFormPopupOpened = false;
  };

  //========================Export data ==========================
  onExporting(event: any) {
    const fileName = 'Insurance';
    this.service.exportDataGrid(event, fileName);
  }

  onRowUpdating(e: any) {
    e.cancel = true; //cancel default popup
    const insuranceId = e.key?.ID;
    if (insuranceId) {
      this.masterService.selected_Insurance_Row_Data(insuranceId).subscribe({
        next: (res: any) => {
          if (res && res.flag === '1') {
            this.selectedInsurance = res.data[0];
            this.isUpdateFormPopupOpened = true;
          } else {
            notify(
              res.message || 'Failed to fetch insurance details',
              'error',
              3000
            );
          }
        },
        error: (err) => {
          console.error('Error fetching row data:', err);
          notify('Something went wrong while fetching row data', 'error', 3000);
        },
      });
    }
  }

  //====================Row Data Deleting========================
  onRowRemoving(event: any) {
    event.cancel = true;
    let SelectedRow = event.key;
    this.masterService
      .Remove_Insurance_Row_Data(SelectedRow.ID)
      .subscribe(() => {
        try {
          notify(
            {
              message: 'Delete operation successful',
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'success'
          );
        } catch (error) {
          notify(
            {
              message: 'Delete operation failed',
              position: { at: 'top right', my: 'top right' },
              displayTime: 500,
            },
            'error'
          );
        }
        event.component.refresh();
        this.dataGrid.instance.refresh();
      });
  }

  //=================== Page refreshing==========================
  refresh = () => {
    this.dataGrid.instance.refresh();
  };

  popUpClose() {
    if (this.InsuranceNewForm) {
      this.InsuranceNewForm.clear();
    }
    if (this.isUpdateFormPopupOpened) {
      this.InsuranceNewForm.clear();
    }
    this.isAddFormPopupOpened = false;
    this.isUpdateFormPopupOpened = false;
    this.refresh();
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
    FormPopupModule,
    InsuranceNewFormModule,
    DxPopupModule,
  ],
  providers: [],
  exports: [InsuranceComponent],
  declarations: [InsuranceComponent],
})
export class InsuranceModule {}
