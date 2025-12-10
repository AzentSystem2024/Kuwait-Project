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
  DxTagBoxModule,
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
  hisColumns: any[] = [];
  classifications: any;
  raFileColumns: any[];
  ColumnpopupVisible: boolean = false;
  fullcolumnsData: any;
  selectedKeys: any[] = [];
  UniqueColumnData: any[];
  selectedColumns: any[] = [];
  selectedFieldNames: string[] = [];
  selecteRAuniqueKeys: any;
  RA_columns: any[] = [];
  selecteHISuniqueKeys: any;
  finalHISObjects: any[] = [];
  finalRAObjects: any;
  insurance_id: any;
  editColumns: any;
  already_seleted_Ra_column: any;
  otherHISObjects: any;
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
    this.getHisColumnsForUniqueKey();
  }

  //==================get his columns for unique key=================
  getHisColumnsForUniqueKey() {
    this.dataservice.His_Columns_For_UniqueKey(name).subscribe((res: any) => {
      console.log(res, 'his columns for unique key');
      this.hisColumns = res || [];
    });
  }
  // ============== load data when edit is available ==========
  loadInsuranceData(data: any) {
    this.insurance_id = data.ID;
    console.log(data, 'insurance edit data');
    this.already_seleted_Ra_column = data.columns;
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
    this.editColumns = data.columns || [];
    this.selectedKeys = data.uniqueKeys || [];
    this.hisColumns = data.uniqueKeys;
    // this.manageUniqueKey();

    this.otherHISObjects = data.uniqueKeys.filter(
      (item: any) => item.IsHisColumn === true
    );

    this.raFileColumns = (data.columns || []).map((c: any) => ({
      ...c,
      Status: 'selected',
    }));

    this.get_RA_Columns_Data();
    setTimeout(() => {
      this.availableGrid?.instance.refresh();
      this.selectedGrid?.instance.refresh();
      this.dataGrid?.instance.refresh();
    });
    this.selecteHISuniqueKeys = this.hisColumns
      .filter((item) => item.IsHisColumn === true)
      .map((item) => item.ColumnID);

    this.selecteRAuniqueKeys = this.hisColumns
      .filter((item) => item.IsHisColumn === false)
      .map((item) => item.ColumnID);
    console.log('Default HIS selected keys:', this.selecteHISuniqueKeys);

    // console.log(this.selectedKeys,'==============')
  }

  //================get RA columns data==================
  get_RA_Columns_Data() {
    const payload = {
      NAME: 'RA_COLUMNS',
      INSURANCE_ID: this.insurance_id,
    };

    this.dataservice.RA_Columns_For_UniqueKey(payload).subscribe((res: any) => {
      console.log(res, 'RA columns for unique key');
      // Convert to TagBox expected structure
      this.RA_columns = (res || []).map((item: any) => ({
        ColumnID: item.ID,
        ColumnTitle: item.DESCRIPTION,
      }));

      // 2) Get IDs where HisMatched == true from editColumns
      const Ra_column = this.hisColumns
        .filter((c) => c.IsHisColumn === false)
        .map((c) => c.ColumnID);

      // 3) Preselect those IDs in TagBox
      this.selecteRAuniqueKeys = Ra_column;

      console.log('Preselected RA keys:', this.selecteRAuniqueKeys);
    });
    // this.RA_columns = res|| [];
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

  //-----------------selected columns in his data----------
  onColumnSelectionChanged(e: any) {
    this.selectedColumns = e.selectedRowsData;

    // Extract only the column names (dataField)
    this.selectedFieldNames = this.selectedColumns.map((col) => col.ColumnName);

    console.log('Selected Columns:', this.selectedColumns);
    console.log('Selected Field Names:', this.selectedFieldNames);
  }
  // async manageColumns() {
  //   // Step 1: Fetch all columns
  //   await this.get_All_Column_data();

  //   const defaultColumns = ['PAYMENT_DATE', 'REFERENCE_NO'];

  //   // Step 2: When editing, keep already selected columns
  //   const existingSelected = new Set(
  //     (this.raFileColumns || []).map((col: any) => col.ColumnName)
  //   );

  //   // Step 3: Prepare full columns list
  //   this.fullcolumnsData = this.fullcolumnsData.map((col: any) => {
  //     const isLocked = defaultColumns.includes(col.ColumnName);
  //     const isSelected = existingSelected.has(col.ColumnName);

  //     return {
  //       ...col,
  //       // If editing, keep selected status; else auto select locked ones
  //       Status: isSelected || isLocked ? 'selected' : 'available',
  //       isLocked,
  //     };
  //   });

  //   // Step 4: Keep locked rows always at top
  //   this.fullcolumnsData.sort((a, b) => {
  //     if (a.isLocked && !b.isLocked) return -1;
  //     if (!a.isLocked && b.isLocked) return 1;
  //     return 0;
  //   });

  //   // Step 5: If it's a *new* form (not editing), ensure locked columns are in raFileColumns
  //   if (!this.insuranceData) {
  //     const lockedColumns = this.fullcolumnsData.filter((c) => c.isLocked);
  //     const otherSelected = this.raFileColumns || [];

  //     // Merge locked ones at top (avoid duplicates)
  //     const uniqueByName = new Map();
  //     [...lockedColumns, ...otherSelected].forEach((c) =>
  //       uniqueByName.set(c.ColumnName, c)
  //     );
  //     this.raFileColumns = Array.from(uniqueByName.values());
  //   }

  //   // Step 6: Open popup and refresh grids
  //   this.ColumnpopupVisible = true;
  //   setTimeout(() => {
  //     this.availableGrid?.instance.refresh();
  //     this.selectedGrid?.instance.refresh();
  //   });
  // }
  async manageColumns() {
    // Step 1: Fetch all columns
    await this.get_All_Column_data();

    const defaultColumns = ['PAYMENT_DATE', 'REFERENCE_NO'];

    // Step 2: Already selected column names (saved order)
    const savedSelectedOrder = (this.raFileColumns || []).map(
      (col: any) => col.ColumnName
    );
    const existingSelectedSet = new Set(savedSelectedOrder);

    // Step 3: Prepare full columns list & mark locked
    this.fullcolumnsData = this.fullcolumnsData.map((col: any) => {
      const isLocked = defaultColumns.includes(col.ColumnName);
      const isSelected = existingSelectedSet.has(col.ColumnName);

      return {
        ...col,
        isLocked,
        Status: isSelected || isLocked ? 'selected' : 'available',
      };
    });

    // Step 4: Build correct SELECTED list (preserve saved order)
    const selectedColumns: any[] = [];

    // 4A → Add locked columns at top (in defined order)
    defaultColumns.forEach((lockedName) => {
      const found = this.fullcolumnsData.find(
        (c) => c.ColumnName === lockedName
      );
      if (found) selectedColumns.push(found);
    });

    // 4B → Add user-selected columns in the SAME order as saved
    savedSelectedOrder.forEach((colName) => {
      if (!defaultColumns.includes(colName)) {
        const found = this.fullcolumnsData.find(
          (c) => c.ColumnName === colName
        );
        if (found) selectedColumns.push(found);
      }
    });

    // Step 5: Build AVAILABLE list (alphabetically)
    const availableColumns = this.fullcolumnsData
      .filter(
        (c: any) => !selectedColumns.some((s) => s.ColumnName === c.ColumnName)
      )
      .sort((a: any, b: any) => a.ColumnTitle.localeCompare(b.ColumnTitle));

    // Step 6: Final output
    this.fullcolumnsData = [...selectedColumns, ...availableColumns];

    // Step 7: Update raFileColumns with the correct selected order
    this.raFileColumns = selectedColumns;

    // Step 8: Open popup and refresh grids
    this.ColumnpopupVisible = true;
    setTimeout(() => {
      this.availableGrid?.instance.refresh();
      this.selectedGrid?.instance.refresh();
    });
  }

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
    console.log(e);
    const status = e.toData;
    const updatedItem = { ...e.itemData, Status: status };
    this.fullcolumnsData = this.fullcolumnsData.filter(
      (item) => item.ColumnName !== e.itemData.ColumnName
    );
    this.fullcolumnsData.push(updatedItem);
  };

  // ======== Reorder inside Selected Columns grid =======
// onReorder = (e: any) => {
//   const locked = ['PAYMENT_DATE', 'REFERENCE_NO'];

//   // Get the dragged row object
//   const draggedRow = e.itemData;

//   // Stop dragging locked rows
//   if (locked.includes(draggedRow.ColumnName)) {
//     e.cancel = true;
//     return;
//   }

//   // Build selected list fresh (filtered from full list)
//   const selectedItems = this.fullcolumnsData.filter(
//     (x) => x.Status === 'selected'
//   );

//   // Find actual positions using ColumnName, NOT filtered index
//   const fromIndex = selectedItems.findIndex(
//     (x) => x.ColumnName === draggedRow.ColumnName
//   );
//   const toIndex = e.toIndex;

//   // Prevent drop into locked positions
//   if (toIndex < locked.length) {
//     e.cancel = true;
//     return;
//   }

//   // Perform reorder safely
//   const movedItem = selectedItems.splice(fromIndex, 1)[0];
//   selectedItems.splice(toIndex, 0, movedItem);

//   // Merge updated items back into full list
//   this.fullcolumnsData = [
//     ...selectedItems,
//     ...this.fullcolumnsData.filter((x) => x.Status !== 'selected'),
//   ];
// };

// onReorder = (e: any) => {
//   const locked = ['PAYMENT_DATE', 'REFERENCE_NO'];

//   // Object being dragged
//   const draggedRow = e.itemData;

//   // STEP 1 → BLOCK dragging locked items entirely
//   if (locked.includes(draggedRow.ColumnName)) {
//     e.cancel = true;
//     return;
//   }

//   // STEP 2 → Build selected rows list
//   const selectedItems = this.fullcolumnsData.filter(
//     (x) => x.Status === 'selected'
//   );

//   // STEP 3 → Find real index of the dragged row
//   const fromIndex = selectedItems.findIndex(
//     (x) => x.ColumnName === draggedRow.ColumnName
//   );

//   let toIndex = e.toIndex;

//   // STEP 4 → Prevent dropping into locked area (index 0 & 1)
//   if (toIndex < locked.length) {
//     toIndex = locked.length;      // auto move AFTER locked rows
//   }

//   // STEP 5 → Reorder
//   const movedItem = selectedItems.splice(fromIndex, 1)[0];
//   selectedItems.splice(toIndex, 0, movedItem);

//   // STEP 6 → Rebuild final list always keeping locked rows on top
//   const lockedRows = selectedItems.filter(x => locked.includes(x.ColumnName));
//   const normalRows = selectedItems.filter(x => !locked.includes(x.ColumnName));

//   this.fullcolumnsData = [
//     ...lockedRows,                    // Always remain first
//     ...normalRows,                    // User reorder applies here
//     ...this.fullcolumnsData.filter(x => x.Status !== 'selected')
//   ];
// };

onReorder = (e: any) => {
  const locked = ["PAYMENT_DATE", "REFERENCE_NO"];
  const dragged = e.itemData;

  // ❌ block locked items
  if (locked.includes(dragged.ColumnName)) {
    e.cancel = true;
    return;
  }

  // ✔ STEP 1 → Visible rows = only for position calculation
  const visibleRows = e.component.getVisibleRows();

  // ✔ STEP 2 → Build selected list from FULL DATA (not visible rows!)
  let selectedItems = this.fullcolumnsData.filter(x => x.Status === "selected");

  // ✔ STEP 3 → Find actual data index of dragged row
  const fromIndex = selectedItems.findIndex(
    x => x.ColumnName === dragged.ColumnName
  );

  // ✔ STEP 4 → Compute true target index
  let toIndex = e.toIndex;

  // Do NOT allow dropping before locked rows
  if (toIndex < locked.length) {
    toIndex = locked.length;
  }

  // ✔ STEP 5 → Move the item inside selected array
  const moved = selectedItems.splice(fromIndex, 1)[0];
  selectedItems.splice(toIndex, 0, moved);

  // ✔ STEP 6 → Merge back into fullcolumnsData (no missing rows)
  const notSelected = this.fullcolumnsData.filter(
    x => x.Status !== "selected"
  );

  this.fullcolumnsData = [...selectedItems, ...notSelected];
};



  // ==== Apply: Save selected columns to raFileColumns and close popup ====
  applySelected() {
    this.raFileColumns = this.fullcolumnsData.filter(
      (item) => item.Status === 'selected'
    );
    console.log('ra file columns :', this.raFileColumns);
    this.ColumnpopupVisible = false;
    this.RA_columns = this.raFileColumns;
    // this.selecteRAuniqueKeys = this.raFileColumns.map(col => col.ColumnID);
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

    // const uniqueKeys = this.UniqueColumnData.map((col: any) => ({
    //   ColumnID: col.ColumnID || 0,
    //   ColumnName: col.ColumnName || '',
    //   ColumnTitle: col.ColumnTitle || '',
    // }));
    const uniqueKeys = [...this.finalHISObjects, ...this.finalRAObjects];
    const hisMatchedIds = this.finalRAObjects.map((x) => x.ColumnID);

    const columns = this.raFileColumns.map((col: any) => ({
      ColumnID: col.ColumnID || 0,
      ColumnName: col.ColumnName || '',
      ColumnTitle: col.ColumnTitle || '',
      HisMatched: hisMatchedIds.includes(col.ColumnID),
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

    // const uniqueKeys = this.UniqueColumnData.map((col: any) => ({
    //   ColumnID: col.ColumnID || 0,
    //   ColumnName: col.ColumnName || '',
    //   ColumnTitle: col.ColumnTitle || '',
    // }));
    const hisObjects = this.finalHISObjects?.length
      ? this.finalHISObjects
      : this.otherHISObjects;

    // const uniqueKeys = [...this.finalHISObjects,...this.finalRAObjects];
    const uniqueKeys = [...hisObjects, ...this.finalRAObjects];
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
      uniqueKeys: uniqueKeys.length > 0 ? uniqueKeys : this.selectedKeys,
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

  RADropdownOnchangeValue(e: any) {
    const ds = e.component.getDataSource();

    ds.load().then((items: any[]) => {
      // items = always updated dataset
      const selected = items.filter((item: any) =>
        e.value.includes(item.ColumnID)
      );

      this.finalRAObjects = selected.map((item: any) => ({
        ID: 0,
        InsuranceID: this.insurance_id || 0,
        ColumnID: item.ColumnID,
        ColumnName: '',
        ColumnTitle: item.ColumnTitle ?? '',
        IsHisColumn: false,
      }));

      console.log('Final RA Objects:', this.finalRAObjects);
    });
  }

  HISDropdownOnchangeValue(e: any) {
    const ds = e.component.getDataSource();

    ds.load().then((items: any[]) => {
      const selectedHISObjects = items.filter((item: any) =>
        e.value.includes(item.ID || item.ColumnID)
      );

      this.finalHISObjects = selectedHISObjects.map((item: any) => ({
        ID: 0,
        InsuranceID: this.insurance_id || 0,
        ColumnID: item.ID || item.ColumnID,
        ColumnName: item.ColumnName ?? '',
        ColumnTitle: item.DESCRIPTION ?? item.ColumnTitle ?? '',
        IsHisColumn: true,
      }));

      console.log('Updated HIS Objects:', this.finalHISObjects);
    });
  }

  displayColumn(item: any) {
    if (!item) return '';
    return item.ColumnID + ' - ' + item.ColumnTitle;
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
    DxTagBoxModule,
  ],
  declarations: [InsuranceNewFormComponent],
  exports: [InsuranceNewFormComponent],
})
export class InsuranceNewFormModule {}
