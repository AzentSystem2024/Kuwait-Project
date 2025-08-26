import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  NgModule,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { CptTypeNewFormComponent } from '../cpt-type-new-form/cpt-type-new-form.component';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import {
  DxButtonModule,
  DxCheckBoxModule,
  DxDataGridComponent,
  DxDataGridModule,
  DxFormModule,
  DxPopupModule,
  DxSelectBoxModule,
  DxTextAreaModule,
  DxTextBoxModule,
  DxValidatorModule,
} from 'devextreme-angular';
import { FormPhotoUploaderModule, FormTextboxModule } from 'src/app/components';
import { DataService } from 'src/app/services';
import notify from 'devextreme/ui/notify';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-insurance-new-form',
  templateUrl: './insurance-new-form.component.html',
  styleUrls: ['./insurance-new-form.component.scss'],
  providers: [DataService],
})
export class InsuranceNewFormComponent implements OnInit {
  @ViewChild('availableGrid', { static: false })
  availableGrid?: DxDataGridComponent;

  @ViewChild('dataGrid', { static: false })
  dataGrid?: DxDataGridComponent;

  @ViewChild('selectedGrid', { static: false })
  selectedGrid?: DxDataGridComponent;

  @Input() insuranceData: any = null;
  @Output() closePopup = new EventEmitter<void>();

  insuranceCompany: any = {
    shortName: '',
    inactive: false,
    companyName: '',
    classification: null,
    remarks: '',
    uniqueKey: '',
  };

  classifications: any;
  raFileColumns: any[];
  ColumnpopupVisible: boolean = false;
  fullcolumnsData: any;
  selectedKeys: any[] = [];
  UniqueColumnData: any[];

  constructor(
    private dataservice: DataService,
    private masterService: MasterReportService
  ) {}

  async ngOnInit() {
    // Step 1 - If editing, set raFileColumns first
    if (this.insuranceData) {
      this.loadInsuranceData(this.insuranceData);
    }
    await this.get_All_Column_data();
    await this.fetch_clasificationDropdown_Data();
  }

  // ============== load data when edit is available ==========
  loadInsuranceData(data: any) {
    this.insuranceCompany = {
      shortName: data.InsuranceShortName || '',
      inactive: data.Inactive || false,
      companyName: data.InsuranceName || '',
      classification: data.ClassificationID || null,
      remarks: data.Remarks || '',
      uniqueKey: data.uniqueKeys
        ? data.uniqueKeys.map((u: any) => u.ColumnName).join(', ')
        : '',
    };
    // Unique keys only for info
    this.selectedKeys = data.uniqueKeys || [];
    // All columns go into raFileColumns (default = selected)
    this.raFileColumns = (data.columns || []).map((c: any) => ({
      ...c,
      Status: 'selected',
    }));
    // fullcolumnsData starts the same as raFileColumns
    // this.fullcolumnsData = [...this.raFileColumns];

    setTimeout(() => {
      this.availableGrid?.instance.refresh();
      this.selectedGrid?.instance.refresh();
      this.dataGrid?.instance.refresh();
    });
  }

  // ======== ENABLE POPUP FOR SELECTING COLUMN DATA ========
  manageColumns() {
    this.get_All_Column_data();
    this.ColumnpopupVisible = true;
  }

  // ======= fetch all columns list =========
  async get_All_Column_data() {
    const response: any = await firstValueFrom(
      this.dataservice.get_All_Column_List()
    );
    const all = response?.data ?? [];
    const selectedNames = new Set(
      (this.raFileColumns || []).map((r: any) =>
        r.ColumnName?.toLowerCase().trim()
      )
    );
    this.fullcolumnsData = all.map((col: any) => ({
      ...col,
      Status: selectedNames.has(col.ColumnName?.toLowerCase().trim())
        ? 'selected'
        : 'available',
    }));
  }

  // ======= classification dropdown data ========
  async fetch_clasificationDropdown_Data() {
    const res: any = await firstValueFrom(
      this.masterService.Get_GropDown('INSURANCECLASSIFICATION')
    );
    if (res) {
      this.classifications = res;
    }
  }

  // ===== Drag between grids =======
  onAdd = (e: any) => {
    const status = e.toData;
    const updatedItem = { ...e.itemData, Status: status };
    this.fullcolumnsData = this.fullcolumnsData.filter(
      (item) => item.ColumnName !== e.itemData.ColumnName
    );
    this.fullcolumnsData.push(updatedItem);
  };

  // ======== Reorder inside Selected Columns grid =======
  onReorder = (e: any) => {
    const selectedItems = this.fullcolumnsData.filter(
      (item) => item.Status === 'selected'
    );
    const fromIndex = e.fromIndex;
    const toIndex = e.toIndex;

    const movedItem = selectedItems.splice(fromIndex, 1)[0];
    selectedItems.splice(toIndex, 0, movedItem);
    this.fullcolumnsData = [
      ...selectedItems,
      ...this.fullcolumnsData.filter((item) => item.Status !== 'selected'),
    ];
  };

  // ==== Apply: Save selected columns to raFileColumns and close popup ====
  applySelected() {
    this.raFileColumns = this.fullcolumnsData.filter(
      (item) => item.Status === 'selected'
    );
    this.ColumnpopupVisible = false;
  }

  // ======== set unique columns ========
  manageUniqueKey() {
    if (this.selectedKeys && this.selectedKeys.length > 0) {
      this.UniqueColumnData = this.selectedKeys;
      const columnNames = this.selectedKeys.map((col: any) => col.ColumnName);
      this.insuranceCompany.uniqueKey = columnNames.join(', ');
    } else {
      this.insuranceCompany.uniqueKey = '';
    }
    this.selectedKeys = [];
    if (this.dataGrid && this.dataGrid.instance) {
      this.dataGrid.instance.clearSelection();
    }
  }

  // ======= Clear: Reset selected columns back to available ===
  clearSelected() {
    this.fullcolumnsData = this.fullcolumnsData.map((col) =>
      col.Status === 'selected' ? { ...col, Status: 'available' } : col
    );
    this.ColumnpopupVisible = false;

    // Optional: refresh UI
    setTimeout(() => {
      this.availableGrid?.instance.refresh();
      this.selectedGrid?.instance.refresh();
    });
  }
  // ============= save insurance template ==========
  saveInsurance() {
    const userId = Number(sessionStorage.getItem('UserID')) || 1;
    const insuranceId = this.insuranceCompany.insuranceId || 0;

    const uniqueKeys = this.UniqueColumnData.map((col: any) => ({
      ColumnID: col.ID || 0,
      ColumnName: col.ColumnName || '',
      ColumnTitle: col.ColumnTitle || '',
    }));

    const columns = this.raFileColumns.map((col: any) => ({
      ColumnID: col.ID || 0,
      ColumnName: col.ColumnName || '',
      ColumnTitle: col.ColumnTitle || '',
    }));

    const payload = {
      UserID: userId,
      InsuranceID: insuranceId,
      ClassificationID: this.insuranceCompany.classification,
      InsuranceName: this.insuranceCompany.companyName,
      InsuranceShortName: this.insuranceCompany.shortName,
      uniqueKeys: uniqueKeys,
      columns: columns,
      Remarks: this.insuranceCompany.remarks,
      Inactive: this.insuranceCompany.inactive,
    };

    console.log('Payload:', payload);

    this.masterService.Insert_Insurance_Data(payload).subscribe({
      next: (response: any) => {
        if (response.flag === '1') {
          this.closePopup.emit();
          notify(
            response.message || 'Insurance saved successfully',
            'success',
            3000
          );
        } else {
          notify(response.message || 'Failed to save insurance', 'error', 3000);
        }
      },
      error: (err) => {
        notify('Error occurred while saving insurance', 'error', 3000);
      },
    });
  }

  // ============= update insurance template ==========
  updateInsurance() {
    const userId = Number(sessionStorage.getItem('UserID')) || 1;
    const insuranceId = this.insuranceCompany.insuranceId || 0; 

    const uniqueKeys = this.UniqueColumnData.map((col: any) => ({
      ColumnID: col.ID || 0,
      ColumnName: col.ColumnName || '',
      ColumnTitle: col.ColumnTitle || '',
    }));

    const columns = this.raFileColumns.map((col: any) => ({
      ColumnID: col.ID || 0,
      ColumnName: col.ColumnName || '',
      ColumnTitle: col.ColumnTitle || '',
    }));

    const payload = {
      ID: this.insuranceData.ID,
      UserID: userId,
      InsuranceID: insuranceId,
      ClassificationID: this.insuranceCompany.classification,
      InsuranceName: this.insuranceCompany.companyName,
      InsuranceShortName: this.insuranceCompany.shortName,
      uniqueKeys: uniqueKeys,
      columns: columns,
      Remarks: this.insuranceCompany.remarks,
      Inactive: this.insuranceCompany.inactive,
    };

    console.log('Update Payload:', payload);

    this.masterService.update_Insurance_data(payload).subscribe({
      next: (response: any) => {
        if (response.flag === '1') {
          this.closePopup.emit();
          notify(
            response.message || 'Insurance updated successfully',
            'success',
            3000
          );
        } else {
          notify(
            response.message || 'Failed to update insurance',
            'error',
            3000
          );
        }
      },
      error: (err) => {
        notify('Error occurred while updating insurance', 'error', 3000);
      },
    });
  }

  // ========= clear entered data =============
  clear = () => {
    this.insuranceCompany = {
      shortName: '',
      inactive: false,
      companyName: '',
      classification: null,
      remarks: '',
      uniqueKey: '',
    };
    this.raFileColumns = [];
  };

  close = () => {
    this.insuranceCompany = {
      shortName: '',
      inactive: false,
      companyName: '',
      classification: null,
      remarks: '',
      uniqueKey: '',
    };
    this.raFileColumns = [];
    this.closePopup.emit();
  };
}

@NgModule({
  imports: [
    DxTextBoxModule,
    DxFormModule,
    DxValidatorModule,
    FormTextboxModule,
    DxTextAreaModule,
    FormPhotoUploaderModule,
    CommonModule,
    ReactiveFormsModule,
    DxSelectBoxModule,
    DxDataGridModule,
    DxCheckBoxModule,
    DxButtonModule,
    DxPopupModule,
  ],
  declarations: [InsuranceNewFormComponent],
  exports: [InsuranceNewFormComponent],
})
export class InsuranceNewFormModule {}
