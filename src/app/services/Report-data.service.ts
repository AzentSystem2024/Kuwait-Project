import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { exportDataGrid as exportDataGridToPdf } from 'devextreme/pdf_exporter';
import { exportDataGrid as exportDataGridToXLSX } from 'devextreme/excel_exporter';
import { jsPDF } from 'jspdf';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver-es';

import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
const BASE_URL = environment.PROJECTX_API_BASE_URL;
// const baseURL2 = InitData_URL;

@Injectable()
export class ReportService {
  private months: { name: string; value: any }[] = [
    { name: 'All', value: '' },
    { name: 'January', value: 0 },
    { name: 'February', value: 1 },
    { name: 'March', value: 2 },
    { name: 'April', value: 3 },
    { name: 'May', value: 4 },
    { name: 'June', value: 5 },
    { name: 'July', value: 6 },
    { name: 'August', value: 7 },
    { name: 'September', value: 8 },
    { name: 'October', value: 9 },
    { name: 'November', value: 10 },
    { name: 'December', value: 11 },
  ];

  constructor(private http: HttpClient, private router: Router) {}

  //============Share months to component ================
  getMonths(): { name: string; value: number }[] {
    return this.months;
  }

  //==========Fetch data of Claim Summary Date Wise===============
  get_Claim_Summary_Date_wise(
    userId: any,
    SearchOn: any,
    Facility: any,
    EncounterType: any,
    DateFrom: any,
    DateTo: any,
    ReceiverId: any,
    PayerId: any,
    Payer: any,
    Clinician: any,
    OrderingClinician: any
  ) {
    const url = `${BASE_URL}reports/claimdetails`;
    const reqBodyData = {
      userid: userId,
      SearchOn: SearchOn,
      DateFrom: DateFrom,
      DateTo: DateTo,
      EncounterType: EncounterType,
      Facility: Facility,
      ReceiverId: ReceiverId,
      PayerId: PayerId,
      Payer: Payer,
      Clinician: Clinician,
      OrderingClinician: OrderingClinician,
    };
    return this.http.post(url, reqBodyData);
  }

  //===============Fetch all search parametrs dropdown values======
  get_SearchParametrs_Data() {
    const userid = sessionStorage.getItem('UserID');
    const url = `${BASE_URL}reports/claimdetailswithactivity/parametervalues`;
    const reqBody = { userid: userid };
    return this.http.post(url, reqBody);
  }

  //===============Fetch all search parametrs dropdown values======
  get_Claim_Analysis_SearchParametrs_Data() {
    const userid = sessionStorage.getItem('UserID');
    const url = `${BASE_URL}reports/claimanalysis/parametervalues`;
    const reqBody = { userid: userid };
    return this.http.post(url, reqBody);
  }

  //========fetch datasource of Claim-Details-With_Activity========

  fetch_Claim_Details_With_Activity(formData: any) {
    const userid = sessionStorage.getItem('UserID');
    const currentPathName = this.router.url.replace('/', '');
    const url = `${BASE_URL}reports/claimdetailswithactivity/main`;
    const reqBody = {
      userid: userid,
      reportid: currentPathName,
      SearchOn: formData.SearchOn,
      DateFrom: formData.From_Date,
      DateTo: formData.To_Date,
      Facility: formData.Facility,
      ReceiverId: formData.ReceiverID,
      PayerId: formData.PayerID,
      Payer: formData.Payer,
      Clinician: formData.Clinician,
      OrderingClinician: formData.OrderingClinician,
      ClaimStatus: formData.CliamStatus,
      ResubmissionType: formData.Resubmission,
      PaymentStatus: formData.paymentStatus,
      ClaimNumber: formData.ClaimNumber,
      PatientID: formData.PatientID,
      MemberID: formData.memberID,
      DenialCode: formData.DenialCodes,
    };
    return this.http.post(url, reqBody);
  }

  //========fetch datasource of Claim-Details========
  fetch_Claim_Details(formData: any) {
    const userid = sessionStorage.getItem('UserID');
    const currentPathName = this.router.url.replace('/', '');
    const url = `${BASE_URL}reports/claimdetails/main`;
    const reqBody = {
      userid: userid,
      reportid: currentPathName,
      SearchOn: formData.SearchOn,
      encounterType: formData.EncounterType,
      DateFrom: formData.From_Date,
      DateTo: formData.To_Date,
      Facility: formData.Facility,
      ReceiverId: formData.ReceiverID,
      PayerId: formData.PayerID,
      Payer: formData.Payer,
      Clinician: formData.Clinician,
      OrderingClinician: formData.OrderingClinician,
      ClaimStatus: formData.CliamStatus,
      ResubmissionType: formData.Resubmission,
      PaymentStatus: formData.paymentStatus,
      ClaimNumber: formData.ClaimNumber,
      PatientID: formData.PatientID,
      MemberID: formData.memberID,
      DenialCode: formData.DenialCodes,
    };
    return this.http.post(url, reqBody);
  }

  //========fetch datasource of Claim-Details========
  fetch_Claim_Analysis_Main_Data(formData: any) {
    const userid = sessionStorage.getItem('UserID');
    const currentPathName = this.router.url.replace('/', '');
    const url = `${BASE_URL}reports/claimanalysis/main`;
    const reqBody = {
      userid: userid,
      SearchOn: formData.SearchOn,
      encounterType: formData.EncounterType,
      DateFrom: formData.From_Date,
      DateTo: formData.To_Date,
      Facility: formData.Facility,
      ReceiverId: formData.ReceiverID,
      PayerId: formData.PayerID,
      Payer: formData.Payer,
      Clinician: formData.Clinician,
      // OrderingClinician: formData.OrderingClinician,
    };
    return this.http.post(url, reqBody);
  }

  //========fetch datasource of Resubmission_summary========
  fetch_Resubmission_summary(formData: any) {
    const userid = sessionStorage.getItem('UserID');
    const currentPathName = this.router.url.replace('/', '');
    const url = `${BASE_URL}reports/resubmissionsummary/summary`;
    const reqBody = {
      userid: userid,
      reportid: currentPathName,
      SearchOn: formData.SearchOn,
      encounterType: formData.EncounterType,
      DateFrom: formData.From_Date,
      DateTo: formData.To_Date,
      Facility: formData.Facility,
      ReceiverId: formData.ReceiverID,
      PayerId: formData.PayerID,
      // Payer: formData.Payer,
      Clinician: formData.Clinician,
      OrderingClinician: formData.OrderingClinician,
      // ClaimStatus: formData.CliamStatus,
      // ResubmissionType: formData.Resubmission,
      // PaymentStatus: formData.paymentStatus,
      ClaimNumber: formData.ClaimNumber,
      // PatientID: formData.PatientID,
      // MemberID: formData.memberID,
      DenialCode: formData.DenialCodes,
      RemittanceBasedOn: formData.RemittanceBasedOn,
      CPTCode: formData.CPTCode,
    };
    return this.http.post(url, reqBody);
  }

  //========fetch datasource of Claim-Summary-month-wise========
  fetch_Claim_Summary_Month_Wise(formData: any) {
    const userid = sessionStorage.getItem('UserID');
    const currentPathName = this.router.url.replace('/', '');
    const url = `${BASE_URL}reports/claimsummary/monthwise`;
    const reqBody = {
      userid: userid,
      reportid: currentPathName,
      SearchOn: formData.SearchOn,
      DateFrom: formData.From_Date,
      DateTo: formData.To_Date,
      Facility: formData.Facility,
      ReceiverId: formData.ReceiverID,
      PayerId: formData.PayerID,
      Payer: formData.Payer,
      Clinician: formData.Clinician,
      OrderingClinician: formData.OrderingClinician,
      ClaimStatus: formData.CliamStatus,
      ResubmissionType: formData.Resubmission,
      PaymentStatus: formData.paymentStatus,
      ClaimNumber: formData.ClaimNumber,
      PatientID: formData.PatientID,
      MemberID: formData.memberID,
      // DenialCode: formData.DenialCodes,  
    };
    return this.http.post(url, reqBody);
  }

  //===============Fetch claim details drill down values===========
  get_CliamDetails_DrillDown_Data(ClaimNumber: any, FacilityID: any) {
    const url = `${BASE_URL}reports/claimdetailswithactivity/claimdetails`;
    const reqBody = { ClaimNumber: ClaimNumber, FacilityID: FacilityID };
    return this.http.post(url, reqBody);
  }

  //===========Fetch claim details Inner drill down values of Submission=======
  get_CliamDetails_InnerDrillDown_Submission_Data(
    FacilityID: any,
    SubmissionUID: any,
    ClaimUID: any
  ) {
    const url = `${BASE_URL}reports/claimdetails/submission`;
    const reqBody = {
      FacilityID: FacilityID,
      SubmissionUID: SubmissionUID,
      ClaimUID: ClaimUID,
    };
    return this.http.post(url, reqBody);
  }

  //===========Fetch claim details Inner drill down values of Resubmission=======
  get_CliamDetails_InnerDrillDown_Resubmission_Data(
    FacilityID: any,
    SubmissionUID: any,
    ClaimUID: any
  ) {
    const url = `${BASE_URL}reports/claimdetails/resubmission`;
    const reqBody = {
      FacilityID: FacilityID,
      SubmissionUID: SubmissionUID,
      ClaimUID: ClaimUID,
    };
    return this.http.post(url, reqBody);
  }

  //===========Fetch claim details Inner drill down values of Remittance=======
  get_CliamDetails_InnerDrillDown_Remittance_Data(
    FacilityID: any,
    RemittanceDownloadUID: any,
    RemittanceUID: any
  ) {
    const url = `${BASE_URL}reports/claimdetails/remittance`;
    const reqBody = {
      FacilityID: FacilityID,
      RemittanceDownloadUID: RemittanceDownloadUID,
      RemittanceUID: RemittanceUID,
    };
    return this.http.post(url, reqBody);
  }

  //==============Export function==================
  exportDataGrid(e: any, fileName: any) {
    if (e.format === 'pdf') {
      const doc = new jsPDF();
      exportDataGridToPdf({
        jsPDFDocument: doc,
        component: e.component,
      }).then(() => {
        doc.save(`${fileName}.pdf`);
      });
    } else {
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet(`${fileName}`);
      exportDataGridToXLSX({
        component: e.component,
        worksheet,
        autoFilterEnabled: true,
      }).then(() => {
        workbook.xlsx.writeBuffer().then((buffer) => {
          saveAs(
            new Blob([buffer], { type: 'application/octet-stream' }),
            `${fileName}.xlsx`
          );
        });
      });
      e.cancel = true;
    }
  }

  //===============Format the data needful================
  formatDate(dateString: any) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const month = monthNames[date.getMonth()];
    const day = date.getDate().toString().padStart(2, '0');
    return `${day}-${month}-${year}`;
  }

  //========fetch datasource of Claim-Summary-payer-wise========
  fetch_Claim_Summary_Payer_Wise(formData: any) {
    const userid = sessionStorage.getItem('UserID');
    const currentPathName = this.router.url.replace('/', '');
    const url = `${BASE_URL}reports/claimsummary/payerwise`;
    const reqBody = {
      userid: userid,
      reportid: currentPathName,
      SearchOn: formData.SearchOn,
      DateFrom: formData.From_Date,
      DateTo: formData.To_Date,
      Facility: formData.Facility,
      ReceiverId: formData.ReceiverID,
      PayerId: formData.PayerID,
      Payer: formData.Payer,
      Clinician: formData.Clinician,
      OrderingClinician: formData.OrderingClinician,
      ClaimStatus: formData.CliamStatus,
      ResubmissionType: formData.Resubmission,
      PaymentStatus: formData.paymentStatus,
      ClaimNumber: formData.ClaimNumber,
      PatientID: formData.PatientID,
      MemberID: formData.memberID,
      // DenialCode: formData.DenialCodes,  
    };
    return this.http.post(url, reqBody);
  }

  //========fetch datasource of Claim-Summary-month-wise========
  fetch_Balance_Amount_To_Be_Received_Data(formData: any) {
    const userid = sessionStorage.getItem('UserID');
    const currentPathName = this.router.url.replace('/', '');
    const url = `${BASE_URL}reports/balanceamttobereceived/getData`;
    const reqBody = {
      userid: userid,
      reportid: currentPathName,
      SearchOn: formData.SearchOn,
      DateFrom: formData.From_Date,
      DateTo: formData.To_Date,
      Facility: formData.Facility,
      ReceiverId: formData.ReceiverID,
      PayerId: formData.PayerID,
      BasedOnInitialNetAmount : formData.BasedOnInitialNetAmount
      
      // DenialCode: formData.DenialCodes,  
    };
    return this.http.post(url, reqBody);
  }

}
