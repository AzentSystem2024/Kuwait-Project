import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
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
import { RouterModule } from '@angular/router';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';

@Component({
  selector: 'app-insurance-master-edit',
  templateUrl: './insurance-master-edit.component.html',
  styleUrl: './insurance-master-edit.component.scss'
})
export class InsuranceMasterEditComponent {
  @Input() insuranceData: any = null;
    @Output() closePopup = new EventEmitter<void>();
    
  @ViewChild('dataGrid', { static: false })
  dataGrid?: DxDataGridComponent;

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
    await this.get_All_Column_data();
    await this.fetch_clasificationDropdown_Data();
    this.getHisColumnsForUniqueKey();
  }
        ngOnChanges(changes: SimpleChanges) {
    if (changes['insuranceData'] && changes['insuranceData'].currentValue) {
    
      this.insuranceData = {
        ...this.insuranceData,
        ...changes['insuranceData'].currentValue,
      };
      this.insuranceCompany=this.insuranceData
      this.insurance_id=this.insuranceCompany.ID
      this.hisColumns=this.insuranceCompany.uniqueKeys
  this.selecteHISuniqueKeys = this.hisColumns
      .filter((item) => item.IsHisColumn === true)
      .map((item) => item.ColumnID);

    this.selecteRAuniqueKeys = this.hisColumns
      .filter((item) => item.IsHisColumn === false)
      .map((item) => item.ColumnID);

      this.get_RA_Columns_Data()


      this.raFileColumns=this.insuranceCompany.columns
    }
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
    get_RA_Columns_Data() {
    const payload = {
      NAME: 'RA_COLUMNS',
      INSURANCE_ID: this.insurance_id,
    };

    this.dataservice.RA_Columns_For_UniqueKey(payload).subscribe((res: any) => {
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

      
    });
    // this.RA_columns = res|| [];
  }
    //==================get his columns for unique key=================
  getHisColumnsForUniqueKey() {
    this.dataservice.His_Columns_For_UniqueKey(name).subscribe((res: any) => {
      this.hisColumns = res || [];
    });
  }

  //==================get all colum list=================
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


clearSelected(){

}
close(){

}
// ADD/REMOVE column between Available and Selected
onAdd = (e: any) => {
  const draggedData = e.itemData;

  // Move to selected
  if (e.toData === "selected") {
    draggedData.Status = "selected";
  }

  // Move to available
  if (e.toData === "available") {
    draggedData.Status = "available";
  }

  // Refresh UI
  this.fullcolumnsData = [...this.fullcolumnsData];
};


onReorder = (e: any) => {
  const locked = ["Payment Date", "Paymant Reference"];

  const draggedKey = e.itemData.ColumnName;

  // 1️⃣ Block dragging locked columns
  if (locked.includes(draggedKey)) {
    e.cancel = true;
    return;
  }

  // Get selected & available lists
  const selectedList = this.fullcolumnsData.filter(x => x.Status === "selected");
  const availableList = this.fullcolumnsData.filter(x => x.Status === "available");

  // Actual index of dragged item
  const fromIndex = selectedList.findIndex(x => x.ColumnName === draggedKey);

  // DevExtreme visible rows
  const visibleRows = e.component.getVisibleRows();

  // Handle drop at end (e.toIndex == count)
  if (e.toIndex >= visibleRows.length) {
    const moved = selectedList.splice(fromIndex, 1)[0];
    selectedList.push(moved);

    this.fullcolumnsData = [...selectedList, ...availableList];
    return;
  }

  const toRow = visibleRows[e.toIndex];

  // 2️⃣ Block dropping ON locked columns
  if (locked.includes(toRow.data.ColumnName)) {
    e.cancel = true;
    return;
  }

  // Actual new index inside selectedList
  let toIndex = selectedList.findIndex(x => x.ColumnName === toRow.data.ColumnName);

  if (fromIndex === -1 || toIndex === -1) return;

  // 3️⃣ Remove & insert WITHOUT subtracting index
  const [movedItem] = selectedList.splice(fromIndex, 1);

  selectedList.splice(toIndex, 0, movedItem);

  // Final merge
  this.fullcolumnsData = [...selectedList, ...availableList];
};


manageColumns() {
  this.ColumnpopupVisible = true;

  // 1) Columns that must always stay selected + locked
  const defaultColumns =["Payment Date", "Paymant Reference"];

  // 2) Load saved selected column order (example: ["REFERENCE_NO", "AGE", "NAME"])
  const savedSelectedOrder = (this.raFileColumns || []).map(
    (col: any) => col.ColumnName
  );

  const savedSelectedSet = new Set(savedSelectedOrder);

  // 3) Mark each column as locked, selected, or available
  const updatedList = this.fullcolumnsData.map((col: any) => {
    const isLocked = defaultColumns.includes(col.ColumnName);
    const isSelected = savedSelectedSet.has(col.ColumnName) || isLocked;

    return {
      ...col,
      isLocked,
      Status: isSelected ? 'selected' : 'available'
    };
  });

  // 4) Sort so selected columns appear FIRST and follow saved order
  const orderedSelected = updatedList
    .filter(col => col.Status === 'selected')
    .sort(
      (a, b) =>
        savedSelectedOrder.indexOf(a.ColumnName) -
        savedSelectedOrder.indexOf(b.ColumnName)
    );

  // 5) Available columns come after selected ones
  const available = updatedList.filter(col => col.Status === 'available');

  // 6) Final ordered list to bind in popup
  this.fullcolumnsData = [...orderedSelected, ...available];
}

  // ==== Apply: Save selected columns to raFileColumns and close popup ====
  applySelected() {
    this.raFileColumns = this.fullcolumnsData.filter(
      (item) => item.Status === 'selected'
    );
    this.ColumnpopupVisible = false;
    this.RA_columns = this.raFileColumns;
    // this.selecteRAuniqueKeys = this.raFileColumns.map(col => col.ColumnID);
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
HISDropdownOnchangeValue(e:any){

}
RADropdownOnchangeValue(e:any){

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
    RouterModule.forRoot([]),
    DxTagBoxModule,
  ],
  declarations: [InsuranceMasterEditComponent],
  exports: [InsuranceMasterEditComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class InsuranceMasterEditModule {}

