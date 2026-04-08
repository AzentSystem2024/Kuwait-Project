import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  NgModule,
  NO_ERRORS_SCHEMA,
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
  DxTabPanelModule,
  DxTabsModule,
  DxTagBoxModule,
  DxTextAreaModule,
  DxTextBoxModule,
  DxValidationGroupComponent,
  DxValidationGroupModule,
  DxValidatorModule,
} from 'devextreme-angular';
import { FormPhotoUploaderModule, FormTextboxModule } from 'src/app/components';
import { DataService } from 'src/app/services';
import notify from 'devextreme/ui/notify';
import { firstValueFrom } from 'rxjs';
import { DxiColumnModule } from 'devextreme-angular/ui/nested';

@Component({
  selector: 'app-insurance-new-form',
  templateUrl: './insurance-new-form.component.html',
  styleUrls: ['./insurance-new-form.component.scss'],
  providers: [DataService],
})
export class InsuranceNewFormComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: false })
  dataGridUniquekey!: DxDataGridComponent;
  @ViewChild('availableGrid', { static: false })
  availableGrid?: DxDataGridComponent;
  @ViewChild('FormValidation', { static: false })
  FormValidation: DxValidationGroupComponent;

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
  insuranceList: any[] = [];

  //==========unique key settings tab===========

  selected_his_Data: any[] = [];
  combinationMatchingPopup: boolean = false;

  selectedCombinationFormat: any;
  generatedPreview: string;
  selectedSeparator: string;
  sampleRARow: any[] = [];
  sampleHISRow: any[] = [];
  selectedSeparatorHIS: string;
  generatedPreviewRA: string;
  selectedInsuranceId: any;
  UniquekeyGernarationPayload: any[] = [
    // {
    //   id: 1,
    //   his_Column: [],
    //   RA_Column: [],
    // },
  ];
  hisrows: any;
  uniqueKeyObj: any[] = [];
  selectedTabIndex: number = 0;
  selected_Insurance_id: any;

  uniqueKeys_data_Set: any[] = [];

  //============tab dataSource
  insurance_tab: any[] = [
    {
      id: 1,
      text: 'Insurance Details',
    },
    {
      id: 2,
      text: 'Unique Key Settings',
    },
  ];
  Ra_columnList: any[];
  columnData: any;
  Ra_full_columns: any[] = [];
  uniqueKeys_Data: any[];
  constructor(
    private dataservice: DataService,
    private masterService: MasterReportService,
  ) {
    this.fetch_His_Column_List();
    this.dataservice.get_All_Column_List().subscribe((res: any) => {
      this.Ra_full_columns = res.data;
    });
  }

  async ngOnInit() {
    // Step 1 - If editing, set raFileColumns first
    if (this.insuranceData) {
      this.loadInsuranceData(this.insuranceData);
      this.uniqueKeys_data_Set = this.insuranceData.uniqueKeys || [];
      console.log(this.uniqueKeys_data_Set);
      await this.getHisColumnsForUniqueKey();
      this.prepareGridData(this.uniqueKeys_data_Set);
    }
    await this.get_All_Column_data();
    await this.fetch_clasificationDropdown_Data();
    this.getHisColumnsForUniqueKey();
  }

  onTabClick(e: any) {}
  //==================get his columns for unique key=================
  async getHisColumnsForUniqueKey(): Promise<void> {
    return new Promise((resolve) => {
      this.dataservice.His_Columns_For_UniqueKey(name).subscribe((res: any) => {
        this.hisColumns = res || [];
        resolve();
      });
    });
  }
  // ============== load data when edit is available ==========
  loadInsuranceData(data: any) {
    this.insurance_id = data.ID;
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
      (item: any) => item.IsHisColumn === true,
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
  }

  //================get RA columns data==================
  async get_RA_Columns_Data(): Promise<void> {
    return new Promise((resolve) => {
      const payload = {
        NAME: 'RA_COLUMNS',
        INSURANCE_ID: this.insurance_id,
      };

      this.dataservice
        .RA_Columns_For_UniqueKey(payload)
        .subscribe((res: any) => {
          // Convert to TagBox expected structure
          this.RA_columns = (res || []).map((item: any) => ({
            ColumnID: item.ID,
            ColumnTitle: item.DESCRIPTION,
          }));
          this.Ra_columnList = this.RA_columns;

          // 2) Get IDs where HisMatched == true from editColumns
          const Ra_column = this.hisColumns
            .filter((c) => c.IsHisColumn === false)
            .map((c) => c.ColumnID);

          // 3) Preselect those IDs in TagBox
          this.selecteRAuniqueKeys = Ra_column;

          resolve();
        });
    });
    // this.RA_columns = res|| [];
  }

  //-----------------selected columns in his data----------
  onColumnSelectionChanged(e: any) {
    this.selectedColumns = e.selectedRowsData;

    // Extract only the column names (dataField)
    this.selectedFieldNames = this.selectedColumns.map((col) => col.ColumnName);
  }

  async manageColumns() {
    // Step 1: Fetch all columns
    await this.get_All_Column_data();

    const defaultColumns = ['PAYMENT_DATE', 'REFERENCE_NO'];

    // Step 2: Already selected column names (saved order)
    const savedSelectedOrder = (this.raFileColumns || []).map(
      (col: any) => col.ColumnName,
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
        (c: any) => c.ColumnName === lockedName,
      );
      if (found) selectedColumns.push(found);
    });

    // 4B → Add user-selected columns in the SAME order as saved
    savedSelectedOrder.forEach((colName) => {
      if (!defaultColumns.includes(colName)) {
        const found = this.fullcolumnsData.find(
          (c) => c.ColumnName === colName,
        );
        if (found) selectedColumns.push(found);
      }
    });

    // Step 5: Build AVAILABLE list (alphabetically)
    const availableColumns = this.fullcolumnsData
      .filter(
        (c: any) => !selectedColumns.some((s) => s.ColumnName === c.ColumnName),
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
      this.dataservice.get_All_Column_List(),
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
      this.masterService.Get_GropDown('INSURANCECLASSIFICATION'),
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

    const status = e.toData;
    const updatedItem = { ...e.itemData, Status: status };
    this.fullcolumnsData = this.fullcolumnsData.filter(
      (item: any) => item.ColumnName !== e.itemData.ColumnName,
    );
    this.fullcolumnsData.push(updatedItem);
  };

  onReorder = (e: any) => {
    const locked = ['PAYMENT_DATE', 'REFERENCE_NO'];

    const draggedKey = e.itemData.ColumnName;

    // 1️⃣ Block dragging locked columns
    if (locked.includes(draggedKey)) {
      e.cancel = true;
      return;
    }

    // Get selected & available lists
    const selectedList = this.fullcolumnsData.filter(
      (x: any) => x.Status === 'selected',
    );
    const availableList = this.fullcolumnsData.filter(
      (x: any) => x.Status === 'available',
    );

    // Actual index of dragged item
    const fromIndex = selectedList.findIndex(
      (x: any) => x.ColumnName === draggedKey,
    );

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
    let toIndex = selectedList.findIndex(
      (x: any) => x.ColumnName === toRow.data.ColumnName,
    );

    if (fromIndex === -1 || toIndex === -1) return;

    // 3️⃣ Remove & insert WITHOUT subtracting index
    const [movedItem] = selectedList.splice(fromIndex, 1);

    selectedList.splice(toIndex, 0, movedItem);

    // Final merge
    this.fullcolumnsData = [...selectedList, ...availableList];
  };

  // ==== Apply: Save selected columns to raFileColumns and close popup ====
  applySelected() {
    this.raFileColumns = this.fullcolumnsData.filter(
      (item) => item.Status === 'selected',
    );

    this.ColumnpopupVisible = false;
    this.RA_columns = this.raFileColumns;
    console.log(this.RA_columns);
    this.Ra_columnList = this.raFileColumns;

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

  // ======= Clear: Reset selected columns back to available ===
  clearSelected() {
    this.fullcolumnsData = this.fullcolumnsData.map((col) =>
      col.Status === 'selected' ? { ...col, Status: 'available' } : col,
    );
    this.ColumnpopupVisible = false;

    // Optional: refresh UI
    setTimeout(() => {
      this.availableGrid?.instance.refresh();
      this.selectedGrid?.instance.refresh();
    });
  }

  //===========list of insurance=======
  List_Insurance() {
    this.masterService.get_Insurance_List().subscribe((res: any) => {
      this.insuranceList = res.data || [];
    });
  }

  // ============= save insurance template ==========
  saveInsurance() {
    this.dataGridUniquekey.instance.saveEditData();

    const gridData = this.dataGridUniquekey.instance.getDataSource().items();

    console.log('Final Grid Data:', gridData);
    console.log(
      this.UniquekeyGernarationPayload,
      '==================payload for unique key generation=================',
    );

    this.prepareFinalFormat();
    this.List_Insurance();
    if (!this.isValid()) return;
    const userId = Number(sessionStorage.getItem('UserID')) || 1;
    const insuranceId = this.insuranceCompany.insuranceId || 0;

    // const uniqueKeys = [...this.finalHISObjects, ...this.finalRAObjects];
    // const hisMatchedIds = this.finalRAObjects.map((x) => x.ColumnID);

    const columns = this.raFileColumns.map((col: any) => ({
      ColumnID: col.ColumnID || 0,
      ColumnName: col.ColumnName || '',
      ColumnTitle: col.ColumnTitle || '',
      HisMatched: false,
    }));

    const payload = {
      UserID: userId,
      InsuranceID: insuranceId,
      ClassificationID: this.insuranceCompany.classification,
      InsuranceName: this.insuranceCompany.companyName,
      InsuranceShortName: this.insuranceCompany.shortName,
      uniqueKeys: this.uniqueKeys_Data,
      columns: columns,
      Remarks: this.insuranceCompany.remarks,
      Inactive: this.insuranceCompany.inactive,
    };
    console.log(
      payload,
      '=================final payload before saving insurance=================',
    );

    const isCodeDuplicate = this.insuranceList.some(
      // (item: any) => item.CODE === commonDetails.code
      (item: any) =>
        item.InsuranceName.toLowerCase() ===
        payload.InsuranceName.toLowerCase(),
    );

    const isDescriptionDuplicate = this.insuranceList.some(
      // (item: any) => item.DESCRIPTION === commonDetails.category
      (item: any) =>
        item.InsuranceShortName.toLowerCase() ===
        payload.InsuranceShortName.toLowerCase(),
    );

    if (isCodeDuplicate && isDescriptionDuplicate) {
      notify(
        {
          message: 'Both Code and category already exist',
          position: { at: 'top right', my: 'top right' },
          displayTime: 1000,
        },
        'error',
      );
      return;
    } else if (isCodeDuplicate) {
      notify(
        {
          message: 'This Code already exists',
          position: { at: 'top right', my: 'top right' },
          displayTime: 1000,
        },
        'error',
      );
      return;
    } else if (isDescriptionDuplicate) {
      notify(
        {
          message: 'This Description already exists',
          position: { at: 'top right', my: 'top right' },
          displayTime: 1000,
        },
        'error',
      );
      return;
    }

    this.masterService.Insert_Insurance_Data(payload).subscribe({
      next: (response: any) => {
        if (response.flag === '1') {
          this.closePopup.emit();
          notify(
            response.message || 'Insurance saved successfully',
            'success',
            3000,
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
    this.dataGridUniquekey.instance.saveEditData();

    const gridData = this.dataGridUniquekey.instance.getDataSource().items();

    console.log('Final Grid Data:', gridData);
    console.log(
      this.UniquekeyGernarationPayload,
      '==================payload for unique key generation=================',
    );
    this.prepareFinalFormat_Update();

    if (!this.isValid()) return;
    const userId = Number(sessionStorage.getItem('UserID')) || 1;
    const insuranceId = this.insuranceCompany.insuranceId || 0;
    // const hisObjects = this.finalHISObjects?.length
    //   ? this.finalHISObjects
    //   : this.otherHISObjects;

    // const uniqueKeys = [...hisObjects, ...this.finalRAObjects];
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
      uniqueKeys: this.uniqueKeys_Data ? this.uniqueKeys_Data : [],
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
            3000,
          );
        } else {
          notify(
            response.message || 'Failed to update insurance',
            'error',
            3000,
          );
        }
      },
      error: (err) => {
        notify('Error occurred while updating insurance', 'error', 3000);
      },
    });
  }

  isValid() {
    return this.FormValidation.instance.validate().isValid;
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
      const selected = items.filter((item: any) =>
        e.value.includes(item.ColumnID),
      );
      this.finalRAObjects = selected.map((item: any) => {
        // 🔹 Find matching column from RA file list
        const raCol = this.raFileColumns.find(
          (col: any) => col.ColumnID === item.ColumnID,
        );

        return {
          ID: 0,
          InsuranceID: this.insurance_id || 0,
          ColumnID: item.ColumnID,
          ColumnName: raCol?.ColumnName ?? '',
          ColumnTitle: raCol?.ColumnTitle ?? '',
          IsHisColumn: false,
        };
      });
    });
  }

  HISDropdownOnchangeValue(e: any) {
    const ds = e.component.getDataSource();

    ds.load().then((items: any[]) => {
      const selectedHISObjects = items.filter((item: any) =>
        e.value.includes(item.ID || item.ColumnID),
      );

      this.finalHISObjects = selectedHISObjects.map((item: any) => {
        const columnName = item.ColumnName ?? item.DESCRIPTION ?? '';

        return {
          ID: 0,
          InsuranceID: this.insurance_id || 0,
          ColumnID: item.ID || item.ColumnID,

          // SAME VALUE FOR BOTH
          ColumnName: columnName,
          ColumnTitle: columnName,

          IsHisColumn: true,
        };
      });
    });
  }

  displayColumn(item: any) {
    if (!item) return '';
    return item.ColumnID + ' - ' + item.ColumnTitle;
  }

  //===========on tab click event==============
  onTabChange(e: any) {
    this.selectedTabIndex = e.itemIndex;
  }

  // ========================== combination matching logic =========================

  combinationChange() {
    this.combinationMatchingPopup = true;

    this.dataservice
      .select_uniquekey_data(this.selected_Insurance_id)
      .subscribe((res: any) => {
        this.UniquekeyGernarationPayload = res || [];
        console.log(
          res,
          '===================uniquekey data from db===================',
        );
        this.UniquekeyGernarationPayload = (res.data || []).map((item: any) => {
          return {
            his_Column: item.HIS_COLUMN_ID,
            HIS_FUNCTION: item.HIS_COLUMN_FUNCTION,
            RA_Column: item.RA_COLUMN_ID,
            RA_FUNCTION: item.RA_COLUMN_FUNCTION,
          };
        });
      });
  }

  getHISDescriptions = (rowData: any) => {
    const values = rowData?.his_Column;

    if (!values || !values.length) return '';
    console.log(
      this.hisColumns,
      '================HIS columns in description function=================',
    );

    return this.hisColumns
      .filter((x) => values.includes(x.ID))
      .map((x) => x.DESCRIPTION)
      .join(', ');
  };

  getRADescriptions = (rowData: any) => {
    const values = rowData?.RA_Column;
    console.log(
      this.RA_columns,
      '================RA columns in description function=================',
    );

    if (!values || !values.length) return '';

    if (!this.Ra_columnList || !this.Ra_columnList.length) return '';

    return this.Ra_columnList.filter((x) => values.includes(x.ColumnID))
      .map((x) => x.ColumnTitle)
      .join(', ');
  };
  onEditorPreparing(e: any) {
    if (e.parentType === 'dataRow' && e.dataField === 'his_Column') {
      e.editorName = 'dxTagBox';

      e.editorOptions = {
        dataSource: this.hisColumns,
        valueExpr: 'ID',
        displayExpr: 'DESCRIPTION',
        searchEnabled: true,
        showSelectionControls: true,
        applyValueMode: 'useButtons',

        onValueChanged: (args: any) => {
          e.setValue(args.value);
          console.log('Selected HIS IDs:', args.value);
        },
      };
    }

    if (e.parentType === 'dataRow' && e.dataField === 'RA_Column') {
      e.editorName = 'dxTagBox';

      e.editorOptions = {
        dataSource: this.RA_columns,
        valueExpr: 'ColumnID',
        displayExpr: 'ColumnTitle',
        searchEnabled: true,
        showSelectionControls: true,
        applyValueMode: 'useButtons',

        onValueChanged: (args: any) => {
          e.setValue(args.value);
          console.log('Selected RA IDs:', args.value);
        },
      };
    }
    console.log(
      e,
      '------------------editor preparing event-------------------',
    );
  }
  onCellPreparedUniquekey(e: any) {
    console.log(e, '------------------cell prepared event-------------------');
  }

  onRowInserted(e: any) {
    console.log(e, '============onrowinsertd functuon called=================');

    // this.UniquekeyGernarationPayload.HIS_unique_keys.push(e.data.his_Column);
    const uniqueKeyObj = {
      HIS_COLUMN_ID: e.data.his_Column,
      HIS_COLUMN_FUNCTION: e.data.HIS_FUNCTION || '',
      RA_COLUMN_ID: e.data.RA_Column,
      RA_COLUMN_FUNCTION: e.data.RA_FUNCTION || '',
    };

    this.uniqueKeyObj = [...this.uniqueKeyObj, uniqueKeyObj];

    console.log(this.uniqueKeyObj);
  }
  onReorderUnikey(e: any) {
    const visibleRows = e.component.getVisibleRows();
    const toIndex = this.UniquekeyGernarationPayload.indexOf(
      visibleRows[e.toIndex].data,
    );
    const fromIndex = this.UniquekeyGernarationPayload.indexOf(e.itemData);

    this.UniquekeyGernarationPayload.splice(fromIndex, 1);
    this.UniquekeyGernarationPayload.splice(toIndex, 0, e.itemData);
  }
  onRowRemoved(e: any) {
    console.log(e, '============onrowremoved functuon called=================');
    const hisId = e.data.his_Column;
    const raId = e.data.RA_Column;

    this.uniqueKeyObj = this.uniqueKeyObj.filter(
      (item) => !(item.HIS_COLUMN_ID === hisId && item.RA_COLUMN_ID === raId),
    );

    console.log('After remove:', this.uniqueKeyObj);

    console.log(this.uniqueKeyObj);
  }
  //------------generate id for unique key entries----------------
  generateId(): string {
    return crypto.randomUUID();
  }

  // ======== column list fetching ======
  fetch_His_Column_List() {
    this.dataservice.get_His_Data_Column_List().subscribe((res: any) => {
      if (res.flag === '1') {
        this.columnData = res.data.map((col: any) => ({
          columnId: col.ID,
          dataField: col.ColumnName,
          caption: col.ColumnTitle,
          type: col.Type,
        }));
      }
      console.log(
        this.columnData,
        '=================column list for unique key=================',
      );
    });
  }

  prepareFinalFormat() {
    const finalResult = [];

    this.UniquekeyGernarationPayload.forEach((row) => {
      const hisArray = [];
      const raArray = [];

      // 🔹 Build HIS array
      row.his_Column.forEach((hisId) => {
        console.log(
          hisId,
          '=================his id in final format function=================',
        );
        console.log(
          this.columnData,
          '=================column data in final format function=================',
        );
        const column = this.columnData.find((x) => x.columnId === hisId);

        if (column) {
          hisArray.push({
            ColumnID: column.columnId,
            ColumnName: column.dataField,
            ColumnTitle: column.caption,
            HisMatched: true,
          });
        }
      });

      // 🔹 Build RA array
      row.RA_Column.forEach((raId) => {
        console.log(this.RA_columns);
        const column = this.RA_columns.find((x) => x.ColumnID === raId);

        if (column) {
          raArray.push({
            ColumnID: column.ColumnID,
            ColumnName: column.ColumnName,
            ColumnTitle: column.ColumnTitle,
            HisMatched: false,
          });
        }
      });

      // 🔹 Push one object (second level)
      finalResult.push({
        HIS: hisArray,
        RA: raArray,
      });
    });

    console.log(finalResult);
    this.uniqueKeys_Data = finalResult.map((item, index) => {
      const keyLevel = index + 1;

      return item.HIS.map((hisCol, i) => {
        const raCol = item.RA[i] || {};

        return {
          InsuranceID: this.insuranceCompany.insuranceId || 0,
          ColumnID: hisCol?.ColumnID ?? null,
          ColumnName: hisCol?.ColumnName ?? null,
          ColumnTitle: hisCol?.ColumnTitle ?? null,
          IsHisColumn: true,
          RA_COLUMN_ID: raCol?.ColumnID ?? null,
          RA_COLUMN_NAME: raCol?.ColumnName ?? null,
          RA_COLUMN_TITLE: raCol?.ColumnTitle ?? null,
          KeyLevel: keyLevel,
        };
      });
    });
    console.log(
      this.uniqueKeys_Data,
      '=================final format for unique key generation=================',
    );
    return this.uniqueKeys_Data;
  }
  prepareFinalFormat_Update() {
    const finalResult = [];
    this.UniquekeyGernarationPayload.forEach((row) => {
      const hisArray = [];
      const raArray = [];

      // 🔹 Build HIS array
      row.his_Column.forEach((hisId) => {
        console.log(
          hisId,
          '=================his id in final format function=================',
        );
        console.log(
          this.columnData,
          '=================column data in final format function=================',
        );
        const column = this.columnData.find((x) => x.columnId === hisId);

        if (column) {
          hisArray.push({
            ColumnID: column.columnId,
            ColumnName: column.dataField,
            ColumnTitle: column.caption,
            HisMatched: true,
          });
        }
      });

      // 🔹 Build RA array
      row.RA_Column.forEach((raId) => {
        console.log(this.RA_columns);
        const column = this.Ra_full_columns.find((x) => x.ColumnID === raId);

        if (column) {
          raArray.push({
            ColumnID: column.ColumnID,
            ColumnName: column.ColumnName,
            ColumnTitle: column.ColumnTitle,
            HisMatched: false,
          });
        }
      });

      // 🔹 Push one object (second level)
      finalResult.push({
        HIS: hisArray,
        RA: raArray,
      });
    });

    console.log(finalResult);
    this.uniqueKeys_Data = finalResult.map((item, index) => {
      const keyLevel = index + 1;

      return item.HIS.map((hisCol, i) => {
        const raCol = item.RA[i] || {};

        return {
          InsuranceID: this.insuranceCompany.insuranceId || 0,
          ColumnID: hisCol?.ColumnID ?? null,
          ColumnName: hisCol?.ColumnName ?? null,
          ColumnTitle: hisCol?.ColumnTitle ?? null,
          IsHisColumn: true,
          RA_COLUMN_ID: raCol?.ColumnID ?? null,
          RA_COLUMN_NAME: raCol?.ColumnName ?? null,
          RA_COLUMN_TITLE: raCol?.ColumnTitle ?? null,
          KeyLevel: keyLevel,
        };
      });
    });
    console.log(
      this.uniqueKeys_Data,
      '=================final format for unique key generation=================',
    );
    return this.uniqueKeys_Data;
  }

  prepareGridData(uniqueKeys: any[][]) {
    const result = uniqueKeys.map((levelArray) => {
      const hisArray: number[] = [];
      const raArray: number[] = [];

      // Take level from first item
      const level = levelArray[0]?.KeyLevel;

      levelArray.forEach((item) => {
        if (item.RA_COLUMN_ID != null) {
          raArray.push(item.RA_COLUMN_ID);
        }

        if (item.ColumnID != null) {
          hisArray.push(item.ColumnID);
        }
      });

      return {
        id: level, // ✅ use KeyLevel instead of GUID
        his_Column: hisArray,
        RA_Column: raArray,
      };
    });

    // this.UniquekeyGernarationPayload = [...result]; // force refresh
    this.UniquekeyGernarationPayload = [...result];
  }

  //-------------ra columns --------------------
  onReorderuniqueKey(e: any) {
    console.log('================reorder function calllll');
    const visibleRows = e.component.getVisibleRows();
    const toIndex = this.UniquekeyGernarationPayload.indexOf(
      visibleRows[e.toIndex].data,
    );
    const fromIndex = this.UniquekeyGernarationPayload.indexOf(e.itemData);

    // Remove item from old position
    this.UniquekeyGernarationPayload.splice(fromIndex, 1);

    // Insert item into new position
    this.UniquekeyGernarationPayload.splice(toIndex, 0, e.itemData);

    // Refresh grid
    this.UniquekeyGernarationPayload = [...this.UniquekeyGernarationPayload];
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
    DxValidationGroupModule,
    DxiColumnModule,
    DxTabPanelModule,
    DxTabsModule,
    DxTagBoxModule,
  ],
  declarations: [InsuranceNewFormComponent],
  exports: [InsuranceNewFormComponent],
  schemas: [NO_ERRORS_SCHEMA],
})
export class InsuranceNewFormModule {}
