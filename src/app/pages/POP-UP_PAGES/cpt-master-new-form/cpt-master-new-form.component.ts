import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  DxFormModule,
  DxSelectBoxModule,
  DxTextAreaModule,
  DxTextBoxModule,
  DxValidatorModule,
} from 'devextreme-angular';
import { FormTextboxModule } from 'src/app/components';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';

@Component({
  selector: 'app-cpt-master-new-form',
  templateUrl: './cpt-master-new-form.component.html',
  styleUrls: ['./cpt-master-new-form.component.scss'],
})
export class CptMasterNewFormComponent {
  CptMasterData = {
    
    CPTCode: '',
    CPTShortName: '',
    CPTName: '',
    Description: '',
  };

  newCptMasterData = this.CptMasterData;
  constructor(private masterService: MasterReportService) {}

  getNewCptMasterData = () => ({ ...this.newCptMasterData });
}
@NgModule({
  imports: [
    DxTextBoxModule,
    DxFormModule,
    DxValidatorModule,
    FormTextboxModule,
    DxTextAreaModule,
    CommonModule,
    ReactiveFormsModule,
    DxSelectBoxModule,
  ],
  declarations: [CptMasterNewFormComponent],
  exports: [CptMasterNewFormComponent],
})
export class CptMasterNewFormModule {}
