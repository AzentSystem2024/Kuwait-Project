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
  DxDataGridComponent,
  DxDataGridModule,
  DxButtonModule,
  DxSelectBoxModule,
  DxValidatorModule,
  DxTextBoxModule,
} from 'devextreme-angular';
import notify from 'devextreme/ui/notify';
import { DataService } from 'src/app/services';

@Component({
  selector: 'app-import-ra-data-popup',
  templateUrl: './import-ra-data-popup.component.html',
  styleUrl: './import-ra-data-popup.component.scss',
})
export class ImportRADataPopupComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid: DxDataGridComponent;

  @ViewChild('fileInput', { static: false }) fileInput: ElementRef;

  @Output() closeForm = new EventEmitter();

  @Input() viewData: any = null;

  @Input() dataSource: any = null;
  @Input() columnData: any = null;
  @Input() selectedInsuranceId: any = null;

  readonly allowedPageSizes: any = [50, 100, 1000];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;

  isSaving: boolean = false;
  gridLoading: boolean = false;

  isLoading: boolean = false;
  insuranceList: any;

  constructor(private dataservice: DataService) {}

  async ngOnInit(): Promise<void> {
    await this.fetch_insurance_dropdown_data();

    if (this.viewData && this.insuranceList) {
      this.selectedInsuranceId = this.viewData.InsuranceID;
      this.columnData = this.viewData.columns.map((col: any) => ({
        dataField: col.ColumnName,
        caption: col.ColumnTitle,
      }));
      this.dataSource = this.viewData.data;
    }
  }

  // ======== get_insurance_dropdown ========
  fetch_insurance_dropdown_data(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.dataservice.Get_GropDown('INSURANCE').subscribe({
        next: (res: any) => {
          this.insuranceList = res;
          resolve(res);
        },
        error: (err) => reject(err),
      });
    });
  }

  // ========= main save import data ===========
  onSaveClick() {
    const userId = Number(sessionStorage.getItem('UserID')) || 0;
    const insuranceId = this.selectedInsuranceId || 0;

    if (!insuranceId || insuranceId === 0) {
      notify({
        message: 'Please select an Insurance before saving.',
        type: 'error',
        displayTime: 3000,
        position: { at: 'top right', my: 'top right', of: window },
      });
      return;
    }

    this.isSaving = true;
    const payload = {
      USerID: userId,
      InsuranceID: insuranceId,
      import_ra_data: this.dataSource || [],
    };

    this.dataservice.Import_RA_Data(payload).subscribe({
      next: (res: any) => {
        if (res.flag === '1') {
          this.close();
          notify({
            message: 'Data imported successfully!',
            type: 'success',
            displayTime: 3000,
            position: { at: 'top right', my: 'top right', of: window },
          });
        } else {
          notify({
            message: res.message || 'Import failed.',
            type: 'error',
            displayTime: 3000,
            position: { at: 'top right', my: 'top right', of: window },
          });
        }
      },
      error: () => {
        notify({
          message: 'An error occurred while saving.',
          type: 'error',
          displayTime: 3000,
          position: { at: 'top right', my: 'top right', of: window },
        });
      },
      complete: () => {
        this.isSaving = false;
      },
    });
  }

  // Error handler to manage error notifications and state
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
  ],
  providers: [],
  declarations: [ImportRADataPopupComponent],
  exports: [ImportRADataPopupComponent],
})
export class ImportRADataPopupModule {}
