import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
const BASE_URL = environment.PROJECTX_API_BASE_URL;

const Token = JSON.parse(localStorage.getItem('Token'));

const gender: any = [
  { description: 'Male' },
  { description: 'Female' },
  { description: 'Others' },
];

@Injectable({
  providedIn: 'root',
})
export class MasterReportService {
  constructor(private http: HttpClient) {}

  //======Fetch gender data======
  get_gender_Data() {
    return gender;
  }

  //======Facility Drop down data=====================
  Get_GropDown(dropDownField: any) {
    const Url = `${BASE_URL}dropdown`;
    const reqBody = { name: dropDownField };
    return this.http.post(Url, reqBody);
  }
  //==========================================USER LEVEL MASTER======================================================
  //============List of User Level==============
  get_userLevel_List() {
    const Url = `${BASE_URL}userroles/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }

  get_userLevel_menuList() {
    const Url = `${BASE_URL}userroles/menulist`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }
  //=============insert user level data=========
  insert_userLevel_Data(ObjData: any) {
    const Url = `${BASE_URL}userroles/insert`;
    const reqBody = {
      UserRoles: ObjData[0].userLevelname,
      UserMenuList: ObjData[0].Menus,
    };
    return this.http.post(Url, reqBody);
  }
  //=============update user level data=========
  update_userLevel_Data(ObjData: any) {
    const Url = `${BASE_URL}userroles/update`;
    const reqBody = {
      ID: ObjData[0].userLevelID,
      UserRoles: ObjData[0].userLevelname,
      UserMenuList: ObjData[0].Menus,
    };
    return this.http.post(Url, reqBody);
  }

  //=====Remove Insurance Data=====
  Remove_userLevel_Row_Data(id: any) {
    return this.http.post(`${BASE_URL}userroles/delete/${id}`, {});
  }

  //==========================================speciality MASTER==========================================================
  //====Insurance List===========
  get_Speciality_List() {
    const Url = `${BASE_URL}speciality/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }
  //=====Add Insurance data========
  Insert_Speciality_Data(
    SpecialityCode: any,
    SpecialityName: any,
    SpecialityShortName: any,
    Description: any
  ) {
    const url = `${BASE_URL}speciality/insert`;
    const reqBody = {
      SpecialityCode: SpecialityCode,
      SpecialityName: SpecialityName,
      SpecialityShortName: SpecialityShortName,
      Description: Description,
    };

    return this.http.post(url, reqBody);
  }

  //=====Update Insurance data======
  update_Speciality_data(
    id: any,
    SpecialityCode: any,
    SpecialityName: any,
    SpecialityShortName: any,
    Description: any
  ) {
    const url = `${BASE_URL}speciality/update`;
    const reqBody = {
      ID: id,
      SpecialityCode: SpecialityCode,
      SpecialityName: SpecialityName,
      SpecialityShortName: SpecialityShortName,
      Description: Description,
    };

    return this.http.post(url, reqBody);
  }

  //=====Remove Insurance Data=====
  Remove_Speciality_Row_Data(id: any) {
    return this.http.post(`${BASE_URL}speciality/delete/${id}`, {});
  }

  //==========================================INSURANCE MASTER==========================================================
  //====Insurance List===========
  get_Insurance_List() {
    const Url = `${BASE_URL}insurance/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }
  //=====Add Insurance data========
  Insert_Insurance_Data(payload: any) {
    const url = `${BASE_URL}insurance/insert`;
    const reqBody = payload;
    return this.http.post(url, reqBody);
  }

  //=====Update Insurance data======
  update_Insurance_data(payload: any) {
    const url = `${BASE_URL}insurance/update`;
    const reqBody = payload;
    return this.http.post(url, reqBody);
  }

  //=====Remove Insurance Data=====
  selected_Insurance_Row_Data(id: any) {
    return this.http.post(`${BASE_URL}insurance/select/${id}`, {});
  }

  //=====Remove Insurance Data=====
  Remove_Insurance_Row_Data(id: any) {
    return this.http.post(`${BASE_URL}insurance/delete/${id}`, {});
  }

  //===================================================FACILITY====================================================
  //=======Fetch All facility data========
  Get_Facility_List_Data() {
    const Url = `${BASE_URL}facility/list`;
    const reqBody = {
      list: [],
    };
    return this.http.post(Url, reqBody);
  }

  //=====Update Facility data====
  update_facility_data(
    id: any,
    FacilityLicense: any,
    FacilityName: any,
    FacilityShortName: any,
    Region: any,
    FacilityTypeID: any,
    FacilityAddress: any,
    PostOfficeID: any,
    RegionID: any,
    EmirateID: any,
    ZoneID: any,
    TypeID: any,
    CategoryID: any
  ) {
    const url = `${BASE_URL}facility/update`;
    const reqBody = {
      ID: id,
      FacilityLicense: FacilityLicense,
      FacilityName: FacilityName,
      FacilityShortName: FacilityShortName,
      Region: Region,
      FacilityTypeID: FacilityTypeID,
      FacilityAddress: FacilityAddress,
      PostOfficeID: PostOfficeID,
      RegionID: RegionID,
      EmirateID: EmirateID,
      ZoneID: ZoneID,
      TypeID: TypeID,
      CategoryID: CategoryID,
    };
    return this.http.post(url, reqBody);
  }

  //=====Remove Facility Data=====
  Remove_Facility_Row_Data(id: any) {
    return this.http.post(`${BASE_URL}facility/delete/${id}`, {});
  }

  //================================================FACILITY TYPE=================================================
  //=====Fetch all Facility Type data======
  Get_Facility_Type_Data() {
    const Url = `${BASE_URL}facilitytype/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }
  //====Add facility Type data=======
  Insert_FacilityType_Data(FacilityType: any, description: any) {
    const url = `${BASE_URL}facilitytype/insert`;
    const reqBody = {
      FacilityType: FacilityType,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }
  //====Update Facility Type data====
  update_facilityTYPE_data(id: any, FacilityType: any, description: any) {
    const url = `${BASE_URL}facilitytype/update`;
    const reqBody = {
      ID: id,
      FacilityType: FacilityType,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }
  //====Remove Facility Type Data=========
  Remove_FacilityType_Row_Data(id: any) {
    return this.http.post(`${BASE_URL}facilitytype/delete/${id}`, {});
  }

  //===================================================FACILITY GROUP============================================
  Get_Facility_Group_Data() {
    const Url = `${BASE_URL}facilitygROUP/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }
  //=====Add facility group data=====
  Insert_FacilityGroup_Data(
    facilitygroup: any,
    FacilityCategoryValue: any,
    description: any
  ) {
    const url = `${BASE_URL}facilitygroup/insert`;
    const reqBody = {
      FacilityGroup: facilitygroup,
      GroupCategory: FacilityCategoryValue,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }
  //=====Update Facility Group data====
  update_facilityGroup_data(
    id: any,
    facilitygroup: any,
    FacilityCategoryValue: any,
    description: any
  ) {
    const url = `${BASE_URL}facilitygROUP/update`;
    const reqBody = {
      ID: id,
      FacilityGroup: facilitygroup,
      GroupLevel: FacilityCategoryValue,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }
  //===Remove Facility Data==========
  Remove_Facility_Group_Data(id: any) {
    return this.http.post(`${BASE_URL}facilitygroup/delete/${id}`, {});
  }

  //================================================FACILITY REGION=================================================
  //=====Fetch all Facility Type data======
  Get_Facility_Region_Data() {
    const Url = `${BASE_URL}facilityregion/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }
  //====Add facility Type data=======
  Insert_FacilityRegion_Data(FacilityRegion: any, description: any) {
    const url = `${BASE_URL}facilityregion/insert`;
    const reqBody = {
      FacilityRegion: FacilityRegion,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }
  //====Update Facility Type data====
  update_facilityRegion_data(id: any, FacilityRegion: any, description: any) {
    const url = `${BASE_URL}facilityregion/update`;
    const reqBody = {
      ID: id,
      FacilityRegion: FacilityRegion,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }
  //====Remove Facility Type Data=========
  Remove_FacilityRegion_Row_Data(id: any) {
    return this.http.post(`${BASE_URL}facilityregion/delete/${id}`, {});
  }

  //==========================================CPT MASTER==========================================================
  //======Cpt Master List===========
  get_CptMaster_List() {
    const Url = `${BASE_URL}cptmaster/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }
  //======Add Cpt Master data========
  Insert_CptMaster_Data(
    CPTCode: any,
    CPTShortName: any,
    CPTName: any,
    description: any
  ) {
    const url = `${BASE_URL}cptmaster/insert`;
    const reqBody = {
      CPTCode: CPTCode,
      CPTShortName: CPTShortName,
      CPTName: CPTName,
      Description: description,
    };
    return this.http.post(url, reqBody);
  }

  //=====Update Cpt Master data======
  update_CptMaster_data(
    id: any,
    CPTTypeID: any,
    CPTCode: any,
    CPTShortName: any,
    CPTName: any,
    description: any
  ) {
    const url = `${BASE_URL}cptmaster/update`;
    const reqBody = {
      ID: id,
      CPTTypeID: CPTTypeID,
      CPTCode: CPTCode,
      CPTShortName: CPTShortName,
      CPTName: CPTName,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }

  //=====Remove Cpt Master Data==========
  Remove_CptMaster_Row_Data(id: any) {
    return this.http.post(`${BASE_URL}cptmaster/delete/${id}`, {});
  }

  //==========================================CPY TYPE MASTER==========================================================
  //======Cpt type List===========
  get_CptType_List() {
    const Url = `${BASE_URL}CPTtype/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }
  //======Add Cpt type data========
  Insert_CptType_Data(CptType: any, description: any) {
    const url = `${BASE_URL}CPTtype/insert`;
    const reqBody = {
      CptType: CptType,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }

  //=====Update Cpt type data======
  update_CptType_data(id: any, CptType: any, Description: any) {
    const url = `${BASE_URL}CPTtype/update`;
    const reqBody = {
      ID: id,
      CptType: CptType,
      Description: Description,
    };

    return this.http.post(url, reqBody);
  }

  //=====Remove Cpt type Data==========
  Remove_CPTType_Row_Data(id: any) {
    return this.http.post(`${BASE_URL}CPTtype/delete/${id}`, {});
  }
  //==========================================Denia MASTER==========================================================

  //====================denials Fetching==================
  getDenialsData() {
    return this.http.post<any>(`${BASE_URL}DenialMaster/List`, {});
  }

  //====================Add Denials========================
  addDenial(
    DenialCode: any,
    Description: any,
    DenialTypeID: any,
    DenialCategoryID: any
  ) {
    const DenialAddData = {
      DenialCode,
      Description,
      DenialTypeID,
      DenialCategoryID,
    };

    return this.http.post(`${BASE_URL}DenialMaster/Insert`, DenialAddData);
  }

  //------------update Denial--------------------------
  updateDenial(
    ID: any,
    DenialCode: any,
    Description: any,
    DenialTypeID: any,
    DenialCategoryID: any
  ) {
    const UpdateData = {
      ID,
      DenialCode,
      Description,
      DenialTypeID,
      DenialCategoryID,
    };

    return this.http.post(`${BASE_URL}DenialMaster/Update`, UpdateData);
  }

  //================REmove Denial=========================
  removeDenial(id: any) {
    return this.http.post(`${BASE_URL}DenialMaster/delete/${id}`, {});
  }
  //==========================================Denial TYPE MASTER==========================================================
  //======Denial type List===========
  get_DenialType_List() {
    const Url = `${BASE_URL}denialtype/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }
  //======Add Denial type data========
  Insert_DenialType_Data(DenialType: any, description: any) {
    const url = `${BASE_URL}denialtype/insert`;
    const reqBody = {
      DenialType: DenialType,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }

  //=====Update Denial type data======
  update_DenialType_data(id: any, DenialType: any, Description: any) {
    const url = `${BASE_URL}denialtype/update`;
    const reqBody = {
      ID: id,
      DenialType: DenialType,
      Description: Description,
    };

    return this.http.post(url, reqBody);
  }

  //=====Remove Denial type Data==========
  Remove_DenialType_Row_Data(id: any) {
    return this.http.post(`${BASE_URL}denialtype/delete/${id}`, {});
  }

  //==========================================Denial TYPE MASTER==========================================================
  //======Denial category List===========
  get_DenialCategory_List() {
    const Url = `${BASE_URL}denialcategory/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }
  //======Add Denial category data========
  Insert_DenialCategory_Data(DenialCategory: any, description: any) {
    const url = `${BASE_URL}denialcategory/insert`;
    const reqBody = {
      DenialCategorys: DenialCategory,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }

  //=====Update Denial category data======
  update_DenialCategory_data(id: any, DenialCategory: any, Description: any) {
    const url = `${BASE_URL}denialcategory/update`;
    const reqBody = {
      ID: id,
      DenialCategorys: DenialCategory,
      Description: Description,
    };

    return this.http.post(url, reqBody);
  }

  //=====Remove Denial category Data==========
  Remove_DenialCategory_Row_Data(id: any) {
    return this.http.post(`${BASE_URL}denialcategory/delete/${id}`, {});
  }
  //========================================================CLINICIAN=========================================================
  //===========Get all data list========
  get_Clinian_Table_Data() {
    const Url = `${BASE_URL}clinician/list`;
    const reqBody = {
      list: [],
    };
    return this.http.post(Url, reqBody);
  }

  //=======insert data ==========
  Insert_Clinician_Data(
    ClinicianLicense: any,
    ClinicianName: any,
    ClinicianShortName: any,
    SpecialityID: any,
    MajorID: any,
    ProfessionID: any,
    CategoryID: any,
    Gender: any
  ) {
    const url = `${BASE_URL}clinician/insert`;
    const reqBody = {
      ClinicianLicense: ClinicianLicense,
      ClinicianName: ClinicianName,
      ClinicianShortName: ClinicianShortName,
      SpecialityID: SpecialityID,
      MajorID: MajorID,
      ProfessionID: ProfessionID,
      CategoryID: CategoryID,
      Gender: Gender,
    };

    return this.http.post(url, reqBody);
  }

  //=====Update Denial category data======
  update_Clinician_data(
    id: any,
    ClinicianLicense: any,
    ClinicianName: any,
    ClinicianShortName: any,
    SpecialityID: any,
    MajorID: any,
    ProfessionID: any,
    CategoryID: any,
    Gender: any
  ) {
    const url = `${BASE_URL}clinician/update`;
    const reqBody = {
      ID: id,
      ClinicianLicense: ClinicianLicense,
      ClinicianName: ClinicianName,
      ClinicianShortName: ClinicianShortName,
      SpecialityID: SpecialityID,
      MajorID: MajorID,
      ProfessionID: ProfessionID,
      CategoryID: CategoryID,
      Gender: Gender,
    };

    return this.http.post(url, reqBody);
  }

  //=====Remove Denial category Data==========
  Remove_Clinician_Row_Data(id: any) {
    return this.http.post(`${BASE_URL}clinician/delete/${id}`, {});
  }

  //===================================================INSURANCE CLASSIFICATION============================================
  Get_InsuranceClassification_Data() {
    const Url = `${BASE_URL}insuranceclassification/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }
  //=====Add CLASSIFICATION data=====
  Insert_InsuranceClassification_Data(Classification: any, description: any) {
    const url = `${BASE_URL}insuranceclassification/insert`;
    const reqBody = {
      Classification: Classification,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }
  //=====Update CLASSIFICATION data====
  update_InsuranceClassification_data(
    id: any,
    Classification: any,
    description: any
  ) {
    const url = `${BASE_URL}insuranceclassification/update`;
    const reqBody = {
      ID: id,
      Classification: Classification,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }
  //===Remove CLASSIFICATION Data==========
  Remove_InsuranceClassification_Data(id: any) {
    return this.http.post(
      `${BASE_URL}insuranceclassification/delete/${id}`,
      {}
    );
  }

  //===================================================clinician profession============================================
  Get_ClinicianProfession_Data() {
    const Url = `${BASE_URL}clinicianprofession/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }
  //=====Add clinicianprofession data=====
  Insert_ClinicianProfession_Data(Profession: any, description: any) {
    const url = `${BASE_URL}clinicianprofession/insert`;
    const reqBody = {
      Profession: Profession,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }
  //=====Update clinicianprofession data====
  update_ClinicianProfession_data(id: any, Profession: any, description: any) {
    const url = `${BASE_URL}clinicianprofession/update`;
    const reqBody = {
      ID: id,
      Profession: Profession,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }
  //===Remove clinician profession Data==========
  remove_ClinicianProfession(id: any) {
    return this.http.post(`${BASE_URL}clinicianprofession/delete/${id}`, {});
  }

  //===================================================clinician Major============================================
  Get_ClinicianMajor_Data() {
    const Url = `${BASE_URL}clinicianmajor/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }
  //=====Add clinician Major data=====
  Insert_ClinicianMajor_Data(Major: any, description: any) {
    const url = `${BASE_URL}clinicianmajor/insert`;
    const reqBody = {
      Major: Major,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }
  //=====Update clinician Major data====
  update_ClinicianMajor_data(id: any, Major: any, description: any) {
    const url = `${BASE_URL}clinicianmajor/update`;
    const reqBody = {
      ID: id,
      Major: Major,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }
  //===Remove clinicianMajor Data==========
  remove_ClinicianMajor(id: any) {
    return this.http.post(`${BASE_URL}clinicianmajor/delete/${id}`, {});
  }

  //===================================================clinician Category============================================
  Get_ClinicianCategory_Data() {
    const Url = `${BASE_URL}cliniciancategory/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }
  //=====Add clinician Category data=====
  Insert_ClinicianCategory_Data(Category: any, description: any) {
    const url = `${BASE_URL}cliniciancategory/insert`;
    const reqBody = {
      Category: Category,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }
  //=====Update clinician category data====
  update_ClinicianCategory_data(id: any, Category: any, description: any) {
    const url = `${BASE_URL}cliniciancategory/update`;
    const reqBody = {
      ID: id,
      Category: Category,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }
  //===Remove cliniciancategory Data==========
  remove_ClinicianCategory(id: any) {
    return this.http.post(`${BASE_URL}cliniciancategory/delete/${id}`, {});
  }

  getUserSecurityPolicityData() {
    return this.http.post(`${BASE_URL}usersecurity/usersecuritylist`, {});
  }
  getCountryList() {
    return this.http.post(
      `http://103.180.120.134/veztaretail/api/country/list`,
      {}
    );
  }

  get_User_data() {
    return this.http.post(`${BASE_URL}user/list`, {});
  }
  get_User_Data_By_Id(id: number) {
    return this.http.post(`${BASE_URL}user/select/` + id, {});
  }

  insert_User_Data(data: any) {
    const url = `${BASE_URL}user/insert`;
    const reqBody = {
      UserName: data.UserName,
      LoginName: data.LoginName,
      Password: data.Password,
      UserRoleID: data.UserRoleID,
      DateofBirth: data.DateofBirth,
      GenderID: data.GenderID,
      Email: data.Email,
      Mobile: data.Mobile,
      Whatsapp: data.Whatsapp,
      LoginExpiryDate: data.LoginExpiryDate,
      IsInactive: data.IsInactive,
      InactiveReason: data.InactiveReason,
      IsLocked: data.IsLocked,
      LockDateFrom: data.LockDateFrom,
      LockDateTo: data.LockDateTo,
      LockReason: data.LockReason,
      PhotoFile: data.PhotoFile,
      user_facility: data.user_facility,
      changePasswordOnLogin: data.changePasswordOnLogin,
      LoginExpiryReason: '',
      Date_Format: data.Date_Format,
      Time_Format: data.Time_Format,
      // Decimal_Points:data.Decimal_Points,
      // Currency_Symbol:data.Currency_Symbol
    };

    return this.http.post(url, reqBody);
  }

  update_User_Data(data: any) {
    const url = `${BASE_URL}user/update`;
    const reqBody = {
      UserID: data.UserID,
      UserName: data.UserName,
      LoginName: data.LoginName,
      Password: data.Password,
      UserRoleID: data.UserRoleID,
      DateofBirth: data.DateofBirth,
      GenderID: data.GenderID,
      Email: data.Email,
      Mobile: data.Mobile,
      Whatsapp: data.Whatsapp,
      LoginExpiryDate: data.LoginExpiryDate,
      IsInactive: data.IsInactive,
      InactiveReason: data.InactiveReason,
      IsLocked: data.IsLocked,
      LockDateFrom: data.LockDateFrom,
      LockDateTo: data.LockDateTo,
      LockReason: data.LockReason,
      PhotoFile: data.PhotoFile,
      user_facility: data.user_facility,
      changePasswordOnLogin: data.changePasswordOnLogin,
      LoginExpiryReason: '',
      Date_Format: data.Date_Format,
      Time_Format: data.Time_Format,
      // Decimal_Points:data.Decimal_Points,
      // Currency_Symbol:data.Currency_Symbol
    };

    return this.http.post(url, reqBody);
  }

  remove_User_Data(id: any) {
    return this.http.post(`${BASE_URL}user/delete/` + id, {});
  }

  reset_Password(data: any): Observable<any> {
    // Ensure the function returns an Observable<any>
    const url = `${BASE_URL}changepassword/password`;

    return this.http.post(url, data);
  }

  getOtp(data: any): Observable<any> {
    const url = `${BASE_URL}changepassword/forpassword`;

    return this.http.post(url, data);
  }

  get_Importing_Master_Log_List() {
    const Url = `${BASE_URL}importmaster/listimport`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }

  get_Importing_Master_List() {
    const Url = `${BASE_URL}importmaster/importmasterlist`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }

  Insert_Imported_Data(data: any) {
    const url = `${BASE_URL}importmaster/insert`;
    return this.http.post(url, data);
  }

  get_Imported_Data_By_Id(id: number) {
    return this.http.post(`${BASE_URL}importmaster/select/` + id, {});
  }
}
