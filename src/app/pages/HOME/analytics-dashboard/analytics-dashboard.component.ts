import { Component, NgModule, ViewChild } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { DataService } from 'src/app/services';
import {
  DxDataGridModule,
  DxButtonModule,
  DxDropDownButtonModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxLookupModule,
  DxDataGridComponent,
} from 'devextreme-angular';
import DataSource from 'devextreme/data/data_source';
@Component({
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.scss'],
  providers: [DataService],
})
export class AnalyticsDashboardComponent {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;

  readonly allowedPageSizes: any = [5, 10, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;

  dataSource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        this.dataService.get_DashbOard_SyncData_Details().subscribe({
          next: (response: any) => {
            const formattedData = response.data.map((item: any) => ({
              ...item,
              ClaimTransactionDate: this.dataService.formatDateTime(
                item.ClaimTransactionDate
              ),
              RemittanceTransactionDate: this.dataService.formatDateTime(
                item.RemittanceTransactionDate
              ),
              LastSynchDate: this.dataService.formatDateTime(
                item.LastSynchDate
              ),
            }));
            resolve(formattedData);
          },
          error: (error) => reject(error.message),
        });
      }),
  });

  isFilterRowVisible: boolean = false;

  constructor(private dataService: DataService) {}

  refresh = () => {
    this.dataGrid.instance.refresh();
  };

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };
}

@NgModule({
  imports: [
    CommonModule,
    DxDataGridModule,
    DxButtonModule,
    DxDropDownButtonModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxLookupModule,
  ],
  providers: [],
  exports: [],
  declarations: [AnalyticsDashboardComponent],
})
export class AnalyticsDashboardModule {}
