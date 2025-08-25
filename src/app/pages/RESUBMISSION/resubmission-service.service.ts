import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Route } from '@angular/router';
import { CustomStore } from 'devextreme/common/data';
import { environment } from 'src/environments/environment';
const BASE_URL = environment.PROJECTX_API_BASE_URL;
@Injectable({
  providedIn: 'root',
})
export class ResubmissionServiceService {
  constructor(private http: HttpClient) {}

  //==================MAking cutom datasource for facility datagrid and dropdown loADING=======
  makeAsyncDataSourceFromJson(jsonData: any, key: any) {
    return new CustomStore({
      loadMode: 'raw',
      key: key,
      load: () => {
        return new Promise((resolve, reject) => {
          try {
            resolve(jsonData);
          } catch (error) {
            reject(error);
          }
        });
      },
    });
  }
  //======Facility Drop down data=====================
  Get_GropDown(dropDownField: any) {
    const Url = `${BASE_URL}dropdown`;
    const reqBody = { name: dropDownField };
    return this.http.post(Url, reqBody);
  }

  //===============Fetch all search parametrs dropdown values======
  get_resubmission_LogData_List() {
    const userid = sessionStorage.getItem('UserID');
    const url = `${BASE_URL}resubmission/loglist`;
    const reqBody = { userID: userid };
    return this.http.post(url, reqBody);
  }

  //===============Fetch all search parametrs dropdown values======
  get_SearchParametrs_resubmission_Data() {
    const userid = sessionStorage.getItem('UserID');
    const url = `${BASE_URL}resubmission/initdata`;
    const reqBody = { userid: userid };
    return this.http.post(url, reqBody);
  }
  //==================get import excel columns ==================
  get_import_excel_columns() {
    const url = `${BASE_URL}resubmission/getImportColumns`;
    return this.http.post(url, {});
  }
  //=============== fetch datasource using excel imported data ============
  get_Datasource_Using_Excel_Data(inputData: any) {
    const url = `${BASE_URL}resubmission/getImportPendingList`;
    const reqBody = inputData;
    return this.http.post(url, reqBody);
  }
  //=================fetch data source ============================
  get_Resub_Allocation_List(formData: any) {
    const userid = sessionStorage.getItem('UserID');
    const url = `${BASE_URL}resubmission/pendinglist`;
    const reqBody = {
      SearchOn: formData.searchOn,
      DateFrom: formData.fromDate,
      DateTo: formData.toDate,
      EncounterType: formData.encounterType,
      ReceiverID: formData.receiverID,
      PayerID: formData.payerID,
      PaymentReference: '',
      Denial: formData.denialCodes,
      IsFullyRejected: formData.isFullyRejected,
      RemittanceCount: '',
      DenialAmt: formData.denialAmount,
      DenialLevel: '',
      LastRemittance: formData.lastRemittanceOnly,
      ResubmissionAge: formData.Ageing,
      IsHierarchy: '',
      FacilityID: formData.facilityValue,
    };
    return this.http.post(url, reqBody);
  }
  //===================save allocation data ===================
  insert_resubmission_allocation_Data(dataObject: any) {
    const url = `${BASE_URL}resubmission/saveresubmission`;
    const reqBody = dataObject;
    return this.http.post(url, reqBody);
  }

  //====================upodate alocation data ==============
  update_resubmission_allocation_Data(dataObject: any) {
    const userid = sessionStorage.getItem('UserID');
    const url = `${BASE_URL}resubmission/updateresubmission`;
    const reqBody = dataObject;
    return this.http.post(url, reqBody);
  }
  //==================get import excel columns ==================
  get_selected_rowData_List(id: any) {
    const url = `${BASE_URL}resubmission/select/${id}`;
    return this.http.post(url, {});
  }
  //================== delete allocated data log ==================
  delete_allocated_data(data: any) {
    const reqdata = data;
    const url = `${BASE_URL}resubmission/delete`;
    return this.http.post(url, reqdata);
  }

  //============ get excel data import log list =============
  get_excel_import_log_list() {
    const userid = sessionStorage.getItem('UserID');
    const url = `${BASE_URL}resubmission/importLog`;
    const reqBody = { userID: userid };
    return this.http.post(url, reqBody);
  }

  //===============Fetch all search parametrs dropdown values======
  get_resubmission_revision_Data(AllocationUID: any) {
    const url = `${BASE_URL}resubmissionRevision/getallocationbill`;
    const reqBody = { AllocationUID: AllocationUID };
    return this.http.post(url, reqBody);
  }

  save_Resubmission_Revision_Data(finalObj: any) {
    const url = `${BASE_URL}resubmissionRevision/saverevision`;
    const reqBody = finalObj;
    return this.http.post(url, reqBody);
  }

  //===============Fetch resubmission revision LogData List======
  get_resubmission_revision_LogData_List() {
    const userid = sessionStorage.getItem('UserID');
    const url = `${BASE_URL}resubmissionRevision/logList`;
    const reqBody = { RevisionByUser: userid };
    return this.http.post(url, reqBody);
  }

  //===============Fetch claim details drill down values===========
  get_CliamDetails_Data(
    ClaimNumber: any,
    FacilityID: any,
    ResubmissionType: any,
    AllocationUID: any
  ) {
    const url = `${BASE_URL}resubmissionRevision/claimdetails`;
    const reqBody = {
      ClaimNumber: ClaimNumber,
      FacilityID: FacilityID,
      ResubmissionType: ResubmissionType,
      AllocationUID: AllocationUID,
    };
    return this.http.post(url, reqBody);
  }

  //=================== select data ===================
  get_select_Resubmission_Revision_Data(id: any) {
    const url = `${BASE_URL}resubmissionRevision/select/${id}`;
    return this.http.post(url, {});
  }

  //================= update ==========================
  update_Resubmission_Revision_Data(finalObj: any) {
    const url = `${BASE_URL}resubmissionRevision/updaterevision`;
    const reqBody = finalObj;
    return this.http.post(url, reqBody);
  }

  //================== delete allocated data log ==================
  delete_Resubmission_Revision_data(data: any) {
    const reqdata = data;
    const url = `${BASE_URL}resubmissionRevision/delete`;
    return this.http.post(url, reqdata);
  }

  //==========//================//===============//===========//==================
  //===============Fetch all lookup data of revision batch upload======
  get_resubmissionBatch_Upload_LogList() {
    const userid = sessionStorage.getItem('UserID');
    const url = `${BASE_URL}revisionBatchUpload/logList`;
    const reqBody = { userID: userid };
    return this.http.post(url, reqBody);
  }
  //===============Fetch claim details drill down values===========
  get_revision_Batch_Upload_Data(
    facilityId: any,
    receiverId: any,
    payerId: any
  ) {
    const url = `${BASE_URL}revisionBatchUpload/getRevisionData`;
    const reqBody = {
      FacilityID: facilityId || '',
      PayerID: payerId || '',
      ReceiverID: receiverId || '',
    };
    return this.http.post(url, reqBody);
  }

  //============= save revision batch upload data ==================
  save_revision_Batch_Upload_Data(finalObj: any) {
    const url = `${BASE_URL}revisionBatchUpload/saveBatch`;
    const reqBody = finalObj;
    return this.http.post(url, reqBody);
  }

  //================= update ==========================
  update_revision_Batch_Upload_Data(finalObj: any) {
    const url = `${BASE_URL}revisionBatchUpload/updateBatch`;
    const reqBody = finalObj;
    return this.http.post(url, reqBody);
  }
  //================== delete batch data ==================
    delete_revision_Batch_data(data: any) {
    const reqdata = data;
    const url = `${BASE_URL}revisionBatchUpload/delete`;
    return this.http.post(url, reqdata);
  }

  //=================== select data ===================
  get_select_revision_Batch_data(id: any) {
    const url = `${BASE_URL}revisionBatchUpload/select/${id}`;
    return this.http.post(url, {});
  }
  //============ resubmission batch upload revission dropdown data list ======
  get_batchUpload_revision_dropdown_List() {
    const userid = sessionStorage.getItem('UserID');
    const url = `${BASE_URL}revisionBatchUpload/RevisionDropDownData`;
    const reqBody = { UserID: userid };
    return this.http.post(url, reqBody);
  }
}
