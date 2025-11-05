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

    this.selectedKeys = data.uniqueKeys || [];
    this.manageUniqueKey();
    this.raFileColumns = (data.columns || []).map((c: any) => ({
      ...c,
      Status: 'selected',
    }));

    setTimeout(() => {
      this.availableGrid?.instance.refresh();
      this.selectedGrid?.instance.refresh();
      this.dataGrid?.instance.refresh();
    });

    console.log(this.selectedKeys,'==============')
  }

  // ======== ENABLE POPUP FOR SELECTING COLUMN DATA ========
  // manageColumns() {
  //   this.get_All_Column_data();
  //   this.ColumnpopupVisible = true;
  // }

//   async manageColumns() {
//   // Fetch full column list first
//   await this.get_All_Column_data();

//   if (this.fullcolumnsData && this.fullcolumnsData.length > 0) {
//   const defaultColumns = ['PAYMENT_DATE', 'REFERENCE_NO'];


//   this.fullcolumnsData = this.fullcolumnsData.map(col => {
//     const isLocked = defaultColumns.includes(col.ColumnName);
//     return {
//       ...col,
//       Status: isLocked ? 'selected' : 'available',
//       isLocked
//     };
//   });
// }

// // Make sure locked rows always appear first
// this.fullcolumnsData.sort((a, b) => {
//   if (a.isLocked && !b.isLocked) return -1;
//   if (!a.isLocked && b.isLocked) return 1;
//   return 0;
// });

//   // Finally open the popup
//   this.ColumnpopupVisible = true;

//   // Optional: refresh grids
//   setTimeout(() => {
//     this.availableGrid?.instance.refresh();
//     this.selectedGrid?.instance.refresh();
//   });
// }

// async manageColumns() {
//   // Step 1: Fetch all columns
//   await this.get_All_Column_data();

//   if (this.fullcolumnsData && this.fullcolumnsData.length > 0) {
//     const defaultColumns = ['PAYMENT_DATE', 'REFERENCE_NO'];

//     // Step 2: Tag locked columns
//     this.fullcolumnsData = this.fullcolumnsData.map(col => {
//       const isLocked = defaultColumns.includes(col.ColumnName);
//       return {
//         ...col,
//         Status: isLocked ? 'selected' : 'available',
//         isLocked
//       };
//     });
//   }

//   // Step 3: Keep locked rows always on top
//   this.fullcolumnsData.sort((a, b) => {
//     if (a.isLocked && !b.isLocked) return -1;
//     if (!a.isLocked && b.isLocked) return 1;
//     return 0;
//   });

//   // Step 4: Open popup
//   this.ColumnpopupVisible = true;

//   // Step 5: Refresh grids
//   setTimeout(() => {
//     this.availableGrid?.instance.refresh();
//     this.selectedGrid?.instance.refresh();
//   });
// }
async manageColumns() {
  // Step 1: Fetch all columns
  await this.get_All_Column_data();

  const defaultColumns = ['PAYMENT_DATE', 'REFERENCE_NO'];

  // Step 2: When editing, keep already selected columns
  const existingSelected = new Set(
    (this.raFileColumns || []).map((col: any) => col.ColumnName)
  );

  // Step 3: Prepare full columns list
  this.fullcolumnsData = this.fullcolumnsData.map((col: any) => {
    const isLocked = defaultColumns.includes(col.ColumnName);
    const isSelected = existingSelected.has(col.ColumnName);

    return {
      ...col,
      // If editing, keep selected status; else auto select locked ones
      Status: isSelected || isLocked ? 'selected' : 'available',
      isLocked
    };
  });

  // Step 4: Keep locked rows always at top
  this.fullcolumnsData.sort((a, b) => {
    if (a.isLocked && !b.isLocked) return -1;
    if (!a.isLocked && b.isLocked) return 1;
    return 0;
  });

  // Step 5: If it's a *new* form (not editing), ensure locked columns are in raFileColumns
  if (!this.insuranceData) {
    const lockedColumns = this.fullcolumnsData.filter(c => c.isLocked);
    const otherSelected = this.raFileColumns || [];

    // Merge locked ones at top (avoid duplicates)
    const uniqueByName = new Map();
    [...lockedColumns, ...otherSelected].forEach(c =>
      uniqueByName.set(c.ColumnName, c)
    );
    this.raFileColumns = Array.from(uniqueByName.values());
  }

  // Step 6: Open popup and refresh grids
  this.ColumnpopupVisible = true;
  setTimeout(() => {
    this.availableGrid?.instance.refresh();
    this.selectedGrid?.instance.refresh();
  });
}


// // Step 6: Prevent drag or reorder for locked rows
// onReorder = (e: any) => {
//   const fromData = e.fromData;
//   const toData = e.toData;

//   // If source or target row is locked, cancel the drag
//   if (e.itemData?.isLocked || (toData && toData.some((r: any) => r.isLocked))) {
//     e.cancel = true;
//     return;
//   }
// };




  async get_All_Column_data() {
    const response: any = await firstValueFrom(
      this.dataservice.get_All_Column_List()
    );
    const all = response?.data ?? [];

    // Build a lookup { columnName -> RA Caption }
    const raCaptionMap: Record<string, string> = {};
    (this.raFileColumns || []).forEach((r: any) => {
      const key = r.ColumnName?.toLowerCase().trim();
      if (key) {
        raCaptionMap[key] = r.ColumnTitle || r.Caption || r.ColumnName;
      }
    });

    this.fullcolumnsData = all.map((col: any) => {
      const key = col.ColumnName?.toLowerCase().trim();
      const isSelected = raCaptionMap[key] !== undefined;

      return {
        ...col,
        // 👇 replace caption with RA version if exists, else keep original
        ColumnTitle: isSelected ? raCaptionMap[key] : col.ColumnTitle,
        Status: isSelected ? 'selected' : 'available',
      };
    });
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
      if (e.itemData?.isLocked) {
    e.cancel = true;
    return;
  }
    console.log(e)
    const status = e.toData;
    const updatedItem = { ...e.itemData, Status: status };
    this.fullcolumnsData = this.fullcolumnsData.filter(
      (item) => item.ColumnName !== e.itemData.ColumnName
    );
    this.fullcolumnsData.push(updatedItem);
  };

  // ======== Reorder inside Selected Columns grid =======
  // onReorder = (e: any) => {
  //   const selectedItems = this.fullcolumnsData.filter(
  //     (item) => item.Status === 'selected'
  //   );
  //   const fromIndex = e.fromIndex;
  //   const toIndex = e.toIndex;
  //   const movedItem = selectedItems.splice(fromIndex, 1)[0];
  //   selectedItems.splice(toIndex, 0, movedItem);
  //   this.fullcolumnsData = [
  //     ...selectedItems,
  //     ...this.fullcolumnsData.filter((item) => item.Status !== 'selected'),
  //   ];
  // };

  // ======== Reorder inside Selected Columns grid =======
onReorder = (e: any) => {
  const selectedItems = this.fullcolumnsData.filter(
    (item) => item.Status === 'selected'
  );

  const fromIndex = e.fromIndex;
  const toIndex = e.toIndex;

  const movedItem = selectedItems[fromIndex];

  // Prevent dragging locked rows (PAYMENT_DATE, REFERENCE_NO)
  const lockedColumns = ['PAYMENT_DATE', 'REFERENCE_NO'];

  // If user tries to move a locked item, cancel reorder
  if (lockedColumns.includes(movedItem.ColumnName)) {
    e.cancel = true;
    return;
  }

  // If user tries to drop *before* locked rows, also block it
  if (toIndex < lockedColumns.length) {
    e.cancel = true;
    return;
  }

  // Continue normal reorder
  selectedItems.splice(fromIndex, 1);
  selectedItems.splice(toIndex, 0, movedItem);

  // Merge back into full list
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
    console.log('ra file columns :', this.raFileColumns);
    this.ColumnpopupVisible = false;
  }

  // ======== set unique columns ========
  manageUniqueKey() {
    if (this.selectedKeys && this.selectedKeys.length > 0) {
      this.UniqueColumnData = this.selectedKeys;
      console.log(this.selectedKeys, 'selected keys');
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
      ColumnID: col.ColumnID || 0,
      ColumnName: col.ColumnName || '',
      ColumnTitle: col.ColumnTitle || '',
    }));

    const columns = this.raFileColumns.map((col: any) => ({
      ColumnID: col.ColumnID || 0,
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
      ColumnID: col.ColumnID || 0,
      ColumnName: col.ColumnName || '',
      ColumnTitle: col.ColumnTitle || '',
    }));

    const columns = this.raFileColumns.map((col: any) => ({
      ColumnID: col.ColumnID || 0,
      ColumnName: (col.ColumnName || '').trim(),
      ColumnTitle: (col.ColumnTitle || '').trim(),
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
    console.log(this.selectedKeys, 'selectedKeys');

    console.log('raFileColumns', this.raFileColumns);

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
