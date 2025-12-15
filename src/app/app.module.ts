import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { DxSelectBoxModule } from 'devextreme-angular';
import { AppComponent } from './app.component';
import { SideNavOuterToolbarModule, SingleCardModule } from './layouts';
import {
  AppFooterModule,
  ResetPasswordFormModule,
  CreateAccountFormModule,
  ChangePasswordFormModule,
  LoginFormModule,
} from './components';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AuthService, ScreenService, AppInfoService } from './services';
import { UnauthenticatedContentModule } from './layouts/unauthenticated-content/unauthenticated-content';
import { AppRoutingModule } from './app-routing.module';
import { DenialListModule } from './pages/MASTER PAGES/denial/denial-list.component';
import { AnalyticsDashboardModule } from './pages/HOME/analytics-dashboard/analytics-dashboard.component';
import { ThemeService } from './services';
import { DxFormModule } from 'devextreme-angular';
import { ReactiveFormsModule } from '@angular/forms';
import { TaskListModule } from 'src/app/components/library/task-list-grid/task-list-grid.component';
import { UserModule } from './pages/MASTER PAGES/user/user.component';
import { UserNewFormModule } from './pages/POP-UP_PAGES/user-new-form/user-new-form.component';
import { UserEditFormModule } from './pages/POP-UP_PAGES/user-edit-form/user-edit-form.component';
import { ResetPasswordModule } from './pages/POP-UP_PAGES/reset-password/reset-password.component';
import { ChangePasswordModule } from './pages/PROFILE PAGES/change-password/change-password.component';
import { ImportMasterDataModule } from './pages/OPERATIONS/import-master-data/import-master-data.component';
import { ImportMasterDataFormModule } from './pages/POP-UP_PAGES/import-master-data-form/import-master-data-form.component';
import { ViewImportedMasterDataFormModule } from './pages/POP-UP_PAGES/view-imported-master-data-form/view-imported-master-data-form.component';
import { RouteReuseStrategy } from '@angular/router';
import { CustomReuseStrategy } from './custom-reuse-strategy';
import {
  ResubmissionSummaryComponent,
  ResubmissionSummaryModule,
} from './pages/REPORT PAGES/resubmission-summary/resubmission-summary.component';
import { AuthInterceptor } from './services/auth.interceptor';
import { PayerWiseReportModule } from './pages/REPORT PAGES/payer-wise-report/payer-wise-report.component';
import { BalanceAmountToBeReceivedModule } from './pages/REPORT PAGES/balance-amount-to-be-received/balance-amount-to-be-received.component';
import { AgedReportModule } from './pages/REPORT PAGES/aged-report/aged-report.component';
import { InsuranceMasterEditComponent, InsuranceMasterEditModule } from './pages/POP-UP_PAGES/insurance-master-edit/insurance-master-edit.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    TaskListModule,
    BrowserModule,
    SideNavOuterToolbarModule,
    SingleCardModule,
    AppFooterModule,
    ResetPasswordFormModule,
    CreateAccountFormModule,
    ChangePasswordFormModule,
    LoginFormModule,
    UnauthenticatedContentModule,
    DxSelectBoxModule,
    DenialListModule,
    AnalyticsDashboardModule,
    DxFormModule,
    ReactiveFormsModule,
    AppRoutingModule,
    HttpClientModule,
    UserModule,
    UserNewFormModule,
    UserEditFormModule,
    ResetPasswordModule,
    ChangePasswordModule,
    ImportMasterDataModule,
    ImportMasterDataFormModule,
    ViewImportedMasterDataFormModule,
    ResubmissionSummaryModule,
    PayerWiseReportModule,
    BalanceAmountToBeReceivedModule,
    AgedReportModule,
    InsuranceMasterEditModule
  ],
  providers: [
    AuthService,
    ScreenService,
    AppInfoService,
    ThemeService,
    { provide: RouteReuseStrategy, useClass: CustomReuseStrategy },
    // { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
