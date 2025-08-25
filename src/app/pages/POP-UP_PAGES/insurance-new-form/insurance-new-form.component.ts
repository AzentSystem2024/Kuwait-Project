import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  NgModule,
  OnInit,
  Output,
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

@Component({
  selector: 'app-insurance-new-form',
  templateUrl: './insurance-new-form.component.html',
  styleUrls: ['./insurance-new-form.component.scss'],
  providers: [DataService],
})
export class InsuranceNewFormComponent implements OnInit {
  @ViewChild('availableGrid', { static: false })
  availableGrid?: DxDataGridComponent;
  @ViewChild('selectedGrid', { static: false })
  selectedGrid?: DxDataGridComponent;

  @Output() closePopup = new EventEmitter<void>();

  insuranceCompany: any = {
    shortName: '',
    inactive: false,
    companyName: '',
    classification: null,
    remarks: '',
    uniqueKey: '',
  };

  classifications: any = [
    { value: 'Insurance', text: 'Insurance' },
    { value: 'Other', text: 'Other' },
  ];

  raFileColumns: any[];

  ColumnpopupVisible: boolean = false;
  fullcolumnsData: any;

  constructor(
    private dataservice: DataService,
    private masterService: MasterReportService
  ) {}

  ngOnInit() {
    this.get_All_Column_data();
  }
  // ========== fetch all columns list ==========
  get_All_Column_data() {
    this.dataservice.get_All_Column_List().subscribe((response: any) => {
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
    });
  }

  // ======== ENABLE POPUP FOR SELECTING COLUMN DATA ========
  manageColumns() {
    this.get_All_Column_data();
    this.ColumnpopupVisible = true;
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

  save() {
    console.log('Saved', this.insuranceCompany);
  }

  clear() {
    this.insuranceCompany = {
      shortName: '',
      inactive: false,
      companyName: '',
      classification: null,
      remarks: '',
      uniqueKey: '',
    };
    this.raFileColumns = [];
  }

  close() {
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
  }

  manageUniqueKey() {
    console.log('Manage Unique Key clicked');
  }
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
