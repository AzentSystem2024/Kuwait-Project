import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import {
  DxButtonModule,
  DxDataGridModule,
  DxDropDownButtonModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxLookupModule,
} from 'devextreme-angular';
import { FormPopupModule } from 'src/app/components';
import { ContactPanelModule } from 'src/app/components/library/contact-panel/contact-panel.component';
import { DenialNewFormModule } from 'src/app/pages/POP-UP_PAGES/denial-new-form/denial-new-form.component';
import { ResubmissionServiceService } from '../../resubmission-service.service';
import { DataSource } from 'devextreme/common/data';

@Component({
  selector: 'app-excel-import-lookup-page',
  templateUrl: './excel-import-lookup-page.component.html',
  styleUrl: './excel-import-lookup-page.component.scss',
})
export class ExcelImportLookupPageComponent {
  //========Variables for Pagination ====================
  readonly allowedPageSizes: any = [15, 25, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;

  //=================Fetchiong DataSource=====================

  headerData: any;
  detailsData: any;
  filteredExcelDataList: any;

  dataSource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        this.service.get_excel_import_log_list().subscribe({
          next: (res: any) => {
            // this.headerData = res.Header;
            this.detailsData = res.Detail;
            resolve(res.Header);
          },
          error: ({ message }) => reject(message),
        });
      }),
  });

  expandedRowKey: any = null;

  constructor(private service: ResubmissionServiceService) {}
  //======= row preparation function for add different colors to the status ==========
  onRowPrepared(e: any) {
    if (e.rowType === 'data') {
      const status = e.data.Status;
      const cells = e.rowElement.querySelectorAll('td');
      const statusCell = cells[cells.length - 1];

      if (status === 'Imported') {
        statusCell.style.color = 'green';
      } else if (status === 'Failed') {
        statusCell.style.color = 'red';
      } else if (status === 'Partially Imported') {
        statusCell.style.color = 'orange';
      }
    }
  }

  //================== row data expanding ===================
  rowExpandingClick(event: any) {
    if (this.expandedRowKey !== null && this.expandedRowKey !== event.key) {
      event.component.collapseRow(this.expandedRowKey);
    }
    this.expandedRowKey = event.key;
    this.filteredExcelDataList = this.detailsData.filter(
      (claim) => claim.LogID == this.expandedRowKey.LogID
    );
  }
  //================ expanded row preparation ===================
  onchildRowPrepared(e: any) {
    if (e.rowType === 'data') {
      if (e.data.isSuccess === 'True') {
        e.rowElement.style.backgroundColor = 'green';
      } else if (e.data.isSuccess === 'False') {
        e.rowElement.style.backgroundColor = 'red';
      }
    }
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
    ContactPanelModule,
    DenialNewFormModule,
    FormPopupModule,
    CommonModule,
  ],
  providers: [],
  exports: [ExcelImportLookupPageComponent],
  declarations: [ExcelImportLookupPageComponent],
})
export class ExcelImportLookupModule {}
