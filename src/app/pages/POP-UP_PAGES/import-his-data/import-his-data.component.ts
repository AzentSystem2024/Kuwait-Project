import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgModule,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  DxButtonModule,
  DxCheckBoxModule,
  DxDataGridComponent,
  DxDataGridModule,
  DxDateBoxModule,
  DxLoadPanelModule,
  DxRadioGroupModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxValidatorModule,
} from 'devextreme-angular';
import { DataService } from 'src/app/services';
import * as XLSX from 'xlsx';
import notify from 'devextreme/ui/notify';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';

@Component({
  selector: 'app-import-his-data-import',
  templateUrl: './import-his-data.component.html',
  styleUrl: './import-his-data.component.scss',
  providers: [DataService],
})
export class ImportHISDataFormComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;

  @ViewChild('fileInput', { static: false }) fileInput: ElementRef;

  @Output() closeForm = new EventEmitter();

  @Input() viewData: any = null;
  @Input() dataSource: any = null;
  @Input() selectedInsurance: any = null;


  readonly allowedPageSizes: any = [50, 100, 1000];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  SUBMISSION_DATE: Date = new Date();
  columnData: any[] = [];
  isChecked:boolean=false
  isColumnsLoaded = false;
  isSaving: boolean = false;
  isLoading: boolean = false;
  insuranceList: any = [];
  isValidData:boolean=true
  // Track invalid columns
  invalidColumns: Set<string> = new Set();
  duplicateRows:any[]=[]
  duplicateKeys:any;
  duplicateCombinations: Set<string>;
  Duplication_data:boolean=false
//=================manage duplication ==========
priorities = [
  { key: 1, value: 'Skip Duplicated Data' },
  { key: 2, value: 'Overwrite (unprocessed)' },
  { key: 3, value: 'No Action' },
];


// This will store the selected key
selectedPriorityKey: number = 1; // 
  UniqueKeys: any[];
  constructor(private dataservice: DataService,   private masterService: MasterReportService) {}

  ngOnInit(): void {
    if (this.viewData) {
      this.selectedInsurance = this.viewData.InsuranceID;
      this.dataSource = this.viewData.import_his_data;
 
    } else {
    }
    this.fetch_insurance_dropdown_data();
    this.fetch_His_Column_List();
    this.duplicated_Data()
    this.find_Unique_key()
  }

  //==================find unique Key=======================

  find_Unique_key(){
    const insuranceId=this.selectedInsurance
     this.masterService.selected_Insurance_Row_Data(insuranceId).subscribe((res:any)=>{
      const selected_Data=res.data[0]
      console.log(selected_Data,'==============selected data==============================')
      this.UniqueKeys=selected_Data.uniqueKeys
      console.log(this.UniqueKeys)
     })
  }
  // ======== column list fetching ======
  fetch_His_Column_List() {
    this.dataservice.get_His_Data_Column_List().subscribe((res: any) => {
      if (res.flag === '1') {
        this.columnData = res.data.map((col: any) => ({
          dataField: col.ColumnName,
          caption: col.ColumnTitle,
          type: col.Type,
          width: 150,
          wordWrapEnabled: true,
        }));
        this.isColumnsLoaded = true;
      }
    });
  }
  //======== get_insurance_dropdown ========
  fetch_insurance_dropdown_data() {
    this.dataservice.Get_GropDown('INSURANCE').subscribe((res: any) => {
      if (res) {
        this.insuranceList = res;
      }
    });
  }
  //=======================Duplicated data ==============
  duplicated_Data(){
    if( !this.viewData){
    console.log(this.dataSource)
        const userId = Number(sessionStorage.getItem('UserID')) || 0;
    const insuranceId = this.selectedInsurance || 0;
          // Create one shared batch ID for all chunks
      const datetime = new Date().toISOString().replace(/[-:.TZ]/g, '');
      const batchId = `${insuranceId}_${datetime}`;
       const payload = {
          userId: userId,
          insuranceId: insuranceId,
          BatchNo: batchId,
          import_his_data: this.dataSource,
        };
            this.dataservice.get_Duplicated_His_Data_List(payload).subscribe((res:any)=>{
          console.log(res)
               this.get_duplicated_data(res)
        })
      }
  }
  // ========== onCellPrepared validator ==========
  onCellPrepared(e: any) {
    if (e.rowType !== 'data') return;

    const colInfo = this.columnData.find(
      (c: any) => c.dataField === e.column.dataField
    );
    if (!colInfo) return;

    const value = e.value;

    // Skip empty/null values
    if (value === null || value === '') return;

    let isInvalid = false;
    let reason = '';

    // DATETIME validation (strict dd/MM/yyyy)
    if (colInfo.type === 'DATETIME' && !this.isValidDDMMYYYY(value)) {
      isInvalid = true;
      this.isValidData=false
      reason = 'Invalid Date format';
    }

    // DECIMAL validation
    if (colInfo.type === 'DECIMAL' && isNaN(Number(value))) {
      isInvalid = true;
      reason = 'Invalid Decimal number';
      this.isValidData=false
    }

    if (isInvalid) {
      // Highlight the cell with tooltip showing reason and current value
      this.highlightInvalidCell(e, `${reason}: "${value}"`);

      // Track column as invalid and highlight header
      this.invalidColumns.add(colInfo.dataField);
      this.highlightColumnHeader(colInfo.dataField);
    }
  }

  // ========== Strict dd/MM/yyyy format validator ==========
  isValidDDMMYYYY(value: any): boolean {
    if (!value || typeof value !== 'string') return false;
    // Allows dd/mm/yyyy or dd-mm-yyyy
    const regex = /^(0[1-9]|[12][0-9]|3[01])[\/-](0[1-9]|1[0-2])[\/-]\d{4}$/;
    return regex.test(value);
  }

  // =========== Highlight invalid cell ==========
  highlightInvalidCell(e: any, message: string) {
    e.cellElement.style.backgroundColor = '#ffcccc';
    e.cellElement.title = message;
  }

  // =========== Highlight column header ==========
  highlightColumnHeader(dataField: string) {
    setTimeout(() => {
      const headerCells = document.querySelectorAll(
        `.dx-header-row .dx-datagrid-text-content`
      );
      headerCells.forEach((headerCell: any) => {
        if (
          headerCell.innerText === dataField ||
          this.getCaptionByField(dataField) === headerCell.innerText
        ) {
          headerCell.style.color = '#ff9999';
          headerCell.title = 'Contains invalid data';
        }
      });
    }, 0);
  }

  // =========== Utility: get caption from columnData ==========
  getCaptionByField(field: string) {
    const col = this.columnData.find((c: any) => c.dataField === field);
    return col ? col.caption : '';
  }
  // =========== Row-level validation (prevent save) ==========
  onRowValidating(e: any) {
    const row = e.newData || e.oldData;
    this.columnData.forEach((col: any) => {
      const value = row[col.dataField];
      // Skip empty/null values

      if (value === null || value === '') return;

      let isInvalid = false;
      let reason = '';

      // DATETIME validation
      if (col.type === 'DATETIME' && !this.isValidDDMMYYYY(value)) {
        isInvalid = true;
        reason = `Invalid Date: "${value}"`;
      }

      // DECIMAL validation
      if (col.type === 'DECIMAL' && isNaN(Number(value))) {
        isInvalid = true;
        reason = `Invalid Decimal: "${value}"`;
      }

      if (isInvalid) {
        e.isValid = false;
        e.errorText = `${col.caption} has invalid value: ${value}`;
        this.invalidColumns.add(col.dataField);
        this.highlightColumnHeader(col.dataField);
      }
    });
  }

  //===================date format conversion ===================
  formatDateToDDMMYY(date: Date): string {
    if (!date) return '';

    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());

    return `${dd}/${mm}/${yyyy}`;
  }

//============================get_duplicated_data=========================

get_duplicated_data(res: any) {
  console.log(res);

  
  // These rows come from backend that already contain duplicates
  const duplicateRows = res.data[0].import_his_data || [];
  const isDuplicate_Value=res.IS_DUPLICATE
  console.log(isDuplicate_Value)

  if(isDuplicate_Value==true){

    this.Duplication_data=true
  }
  else{
    this.Duplication_data=false
  }

  this.duplicateRows = duplicateRows;
  console.log(this.duplicateRows, '============ duplicate rows from backend ============');

  // Create sets based on duplicate data returned from backend
  this.duplicateKeys = {
    ITEM_CODE: new Set(
      duplicateRows.map((row: any) => (row.ITEM_CODE ?? '').toString().trim()).filter(v => v)
    ),
    INVOICE_NO: new Set(
      duplicateRows.map((row: any) => (row.INVOICE_NO ?? '').toString().trim()).filter(v => v)
    ),
    INVOICE_DATE: new Set(
      duplicateRows
        .map((row: any) => {
          if (!row.INVOICE_DATE) return '';
          return new Date(row.INVOICE_DATE).toISOString().split('T')[0];
        })
        .filter(v => v)
    )
  };

  console.log(this.duplicateKeys, '===== duplicate keys created from backend =====');

  this.dataGrid.instance.refresh(); // Refresh to trigger onRowPrepared again
}

//========================= find the duplicated rows===============================
onRowPrepared(e: any) {
  if (e.rowType !== 'data') return;

  const itemCode = (e.data.ITEM_CODE ?? '').toString().trim();
  const invoiceNo = (e.data.INVOICE_NO ?? '').toString().trim();
  const invoiceDate = e.data.INVOICE_DATE
  const duplicateColumns: string[] = [];

  // Compare grid cell values with duplicateKeys (from backend)
  if (this.duplicateKeys.ITEM_CODE.has(itemCode)) duplicateColumns.push('ITEM_CODE');
  if (this.duplicateKeys.INVOICE_NO.has(invoiceNo)) duplicateColumns.push('INVOICE_NO');
  if (this.duplicateKeys.INVOICE_DATE.has(invoiceDate)) duplicateColumns.push('INVOICE_DATE');

  // Highlight row and add tooltip if any matches
  if (duplicateColumns.length > 0) {
    e.rowElement.style.color = '#be3f3fff'; // light red
  
    // e.rowElement.title = `Duplicate in: ${duplicateColumns.join(', ')}`;
    e.rowElement.title='Duplication Found'
  } else {
    e.rowElement.style.backgroundColor = ''; // reset
    e.rowElement.style.border = '';
    e.rowElement.title = '';
  }
}



  // ========= main save import data ===========
  async onSaveClick() {
    console.log(this.Duplication_data,this.isChecked)

  if (!this.Duplication_data || this.selectedPriorityKey==1|| this.selectedPriorityKey==2) {

    if(this.isChecked){
      this.dataSource
    }

    const userId = Number(sessionStorage.getItem('UserID')) || 0;
    const insuranceId = this.selectedInsurance || 0;
    console.log(insuranceId,'====================insurance ID=============')
    if (!insuranceId || insuranceId === 0) {
      notify({
        message: 'Please select an Insurance before saving.',
        type: 'error',
        displayTime: 3000,
        position: { at: 'top right', my: 'top right', of: window },
      });
      return;
    }
 // ✅ STEP 1: Validate unique key columns

//  this.find_Unique_key()
console.log(this.UniqueKeys)
    if (this.UniqueKeys && this.UniqueKeys.length > 0) {
      const missingRows = this.dataSource.filter((row) =>
        this.UniqueKeys.some((key) => {
          const col = key.ColumnName;
          const value = row[col];
          return value === null || value === undefined || value === '';
        })
      );

      if (missingRows.length > 0) {
        const missingCols = this.UniqueKeys.map((k) => k.ColumnName).join(', ');
        console.log(missingCols)
        notify({
          message: `Please fill all required unique key column(s): ${missingCols}`,
          type: 'error',
          displayTime: 4000,
          position: { at: 'top right', my: 'top right', of: window },
        });
        return; // ❌ stop saving
      }
    }
    if(this.isValidData==false){
            notify({
          message: `The Excel file contains invalid data. Please correct it before saving`,
          type: 'error',
          displayTime: 4000,
          position: { at: 'top right', my: 'top right', of: window },
        });
        return; // ❌ stop saving
    }

    this.isSaving = true;
    this.isLoading = true;

    try {
      const allData = (this.dataSource || []).map((item) => ({
        ...item,
        // SUBMISSION_DATE: this.formatDateToDDMMYY(this.SUBMISSION_DATE),
      }));

      const totalRecords = allData.length;
      const batchSize = 15000;

      if (totalRecords === 0) {
        notify({
          message: 'No data available to save.',
          type: 'warning',
          displayTime: 3000,
          position: { at: 'top right', my: 'top right', of: window },
        });
        this.isSaving = false;
        this.isLoading = false;
        return;
      }

      // Create one shared batch ID for all chunks
      const datetime = new Date().toISOString().replace(/[-:.TZ]/g, '');
      const batchId = `${insuranceId}_${datetime}`;

      const totalBatches = Math.ceil(totalRecords / batchSize);

      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, totalRecords);
        const currentBatch = allData.slice(start, end);

        

        const payload = {
          userId: userId,
          insuranceId: insuranceId,
          BatchNo: batchId,
          import_his_data: currentBatch,
          MANAGE_DUPLICATE:this.selectedPriorityKey

        };

        await this.dataservice
          .Import_His_Data(payload)
          .toPromise()
          .then((res: any) => {
            console.log(res,'=============data=====================')

            
      
            if (res.flag === '1') {
              notify({
                message: `Batch ${
                  i + 1
                }/${totalBatches} uploaded successfully!`,
                type: 'success',
                displayTime: 2000,
                position: { at: 'top right', my: 'top right', of: window },
              });
            } else {
              throw new Error(res.message || `Batch ${i + 1} failed.`);
            }
          })
          .catch((err) => {
            console.error(`Error in batch ${i + 1}:`, err);
            // this.duplicateRows=err.data
            notify({
              message: `Error importing batch ${i + 1}: ${err.message}`,
              type: 'error',
              displayTime: 4000,
              position: { at: 'top right', my: 'top right', of: window },
            });
            throw err; // stop further batches on error
          });
      }

      notify({
        message: 'All batches imported successfully!',
        type: 'success',
        displayTime: 4000,
        position: { at: 'top right', my: 'top right', of: window },
      });

      this.close();
    } catch (error) {
      console.error('Error during batch upload:', error);
      // notify({
      //   message: 'An error occurred while importing data.',
      //   type: 'error',
      //   displayTime: 4000,
      //   position: { at: 'top right', my: 'top right', of: window },
      // });
    } finally {
      this.isSaving = false;
      this.isLoading = false;
    }
  }
  else{
     notify({
        message: 'Duplicate data found. Please choose to skip or overwrite the (unprocessed) records.',
        type: 'success',
        displayTime: 4000,
        position: { at: 'top right', my: 'top right', of: window },
      });

  }
}
// async onSaveClick() {
//   if (!this.Duplication_data || this.isChecked) {
//     const userId = Number(sessionStorage.getItem('UserID')) || 0;
//     const insuranceId = this.selectedInsurance || 0;

//     if (!insuranceId) {
//       notify({
//         message: 'Please select an Insurance before saving.',
//         type: 'error',
//         displayTime: 3000,
//         position: { at: 'top right', my: 'top right', of: window },
//       });
//       return;
//     }

//     this.isSaving = true;
//     this.isLoading = true;

//     try {
//       // ✅ Filter out duplicates based on backend sets (duplicateKeys)
//       const uniqueData = (this.dataSource || []).filter((item) => {
//         const itemCode = (item.ITEM_CODE ?? '');
//         const invoiceNo = (item.INVOICE_NO ?? '');
//         const invoiceDate = item.INVOICE_DATE
//         // if any of these is found in duplicateKeys, remove it
//         const isDuplicate =
//           this.duplicateKeys.ITEM_CODE.has(itemCode) ||
//           this.duplicateKeys.INVOICE_NO.has(invoiceNo) ||
//           this.duplicateKeys.INVOICE_DATE.has(invoiceDate);

//         return !isDuplicate; // ✅ keep only non-duplicates
//       });

//       console.log(uniqueData, '✅ Filtered unique data (non-duplicates)');

//       if (uniqueData.length === 0) {
//         notify({
//           message: 'All rows are duplicates — nothing to upload.',
//           type: 'warning',
//           displayTime: 3000,
//           position: { at: 'top right', my: 'top right', of: window },
//         });
//         this.isSaving = false;
//         this.isLoading = false;
//         return;
//       }

//       // Continue your existing upload logic here
//       const allData = uniqueData.map((item) => ({
//         ...item,
//         SUBMISSION_DATE: this.formatDateToDDMMYY(this.SUBMISSION_DATE),
//       }));

//       const totalRecords = allData.length;
//       const batchSize = 15000;
//       const datetime = new Date().toISOString().replace(/[-:.TZ]/g, '');
//       const batchId = `${insuranceId}_${datetime}`;
//       const totalBatches = Math.ceil(totalRecords / batchSize);

//       for (let i = 0; i < totalBatches; i++) {
//         const start = i * batchSize;
//         const end = Math.min(start + batchSize, totalRecords);
//         const currentBatch = allData.slice(start, end);

//         const payload = {
//           userId,
//           insuranceId,
//           BatchNo: batchId,
//           import_his_data: currentBatch,
//         };

//         const res: any = await this.dataservice.Import_His_Data(payload).toPromise();

//         if (res.flag === '1') {
//           notify({
//             message: `Batch ${i + 1}/${totalBatches} uploaded successfully!`,
//             type: 'success',
//             displayTime: 2000,
//             position: { at: 'top right', my: 'top right', of: window },
//           });
//         } else {
//           throw new Error(res.message || `Batch ${i + 1} failed.`);
//         }
//       }

//       notify({
//         message: 'All unique (non-duplicate) batches uploaded successfully!',
//         type: 'success',
//         displayTime: 4000,
//         position: { at: 'top right', my: 'top right', of: window },
//       });

//       this.close();
//     } catch (error) {
//       console.error('Error during batch upload:', error);
//       notify({
//         message: 'An error occurred while importing data.',
//         type: 'error',
//         displayTime: 4000,
//         position: { at: 'top right', my: 'top right', of: window },
//       });
//     } finally {
//       this.isSaving = false;
//       this.isLoading = false;
//     }
//   } else {
//     alert('Please check the "Skip duplicated data" checkbox — duplicates detected.');
//   }
// }






  handleError(error: any) {
    if (error.status === 0) {
      notify(
        {
          message:
            'Network error: Please check your internet connection and try again.',
          position: { at: 'top right', my: 'top right' },
          displayTime: 1000,
        },
        'error'
      );
    } else if (error.status === 500) {
      notify(
        {
          message:
            'Server error: Unable to process the request right now. Please try again later.',
          position: { at: 'top right', my: 'top right' },
          displayTime: 1000,
        },
        'error'
      );
    } else {
      notify(
        {
          message: 'Failed to import data. Please try again.',
          position: { at: 'top right', my: 'top right' },
          displayTime: 1000,
        },
        'error'
      );
    }
    console.error('Error during data import:', error);
    this.isSaving = false;
    this.isLoading = false;
  }

  // ========== clear input selector ======
  resetFileInput() {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  clearData() {
    this.dataSource = [];
    this.columnData = [];
    this.viewData = null;
  }

  close() {
    this.clearData();
    this.isLoading = false;
    this.closeForm.emit();
  }
}

@NgModule({
  imports: [
    CommonModule,
    DxDataGridModule,
    DxButtonModule,
    DxSelectBoxModule,
    DxValidatorModule,
    DxTextBoxModule,
    DxLoadPanelModule,
    DxDateBoxModule,
    DxCheckBoxModule,
    DxRadioGroupModule
  ],
  providers: [],
  declarations: [ImportHISDataFormComponent],
  exports: [ImportHISDataFormComponent],
})
export class ImportHISDataFormModule {}
