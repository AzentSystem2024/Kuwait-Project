import { SystemServicesService } from './../../../pages/SYSTEM PAGES/system-services.service';
import { CommonModule } from '@angular/common';
import { Component, NgModule, Input, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { LoginOauthModule } from 'src/app/components/library/login-oauth/login-oauth.component';
import { DxFormModule } from 'devextreme-angular/ui/form';
import { DxLoadIndicatorModule } from 'devextreme-angular/ui/load-indicator';
import { DxButtonModule, DxButtonTypes } from 'devextreme-angular/ui/button';
import notify from 'devextreme/ui/notify';
import { AuthService, IResponse, ThemeService } from 'src/app/services';
import { SharedServiceService } from 'src/app/services/shared-service.service';
import { confirm } from 'devextreme/ui/dialog';
import { InactivityService } from 'src/app/services/inactivity.service';
import {
  DxLoadPanelModule,
  DxPopupModule,
  DxTextBoxModule,
} from 'devextreme-angular';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss'],
})
export class LoginFormComponent implements OnInit {
  @Input() resetLink = '/auth/reset-password';
  @Input() createAccountLink = '/auth/create-account';

  defaultAuthData: IResponse;

  btnStylingMode: DxButtonTypes.ButtonStyle;

  passwordMode = 'password';

  loading = false;

  formData: any = {};

  isPasswordVisible: boolean = false;

  loginResponse: any;
  SingleToken: boolean = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService,
    private sharedService: SharedServiceService,
    private inactive: InactivityService,
    private SystemService: SystemServicesService
  ) {
    this.formData = {};
    this.themeService.isDark.subscribe((value: boolean) => {
      this.btnStylingMode = value ? 'outlined' : 'contained';
    });
  }

  togglePasswordVisibility = () => {
    this.isPasswordVisible = !this.isPasswordVisible;
  };

  changePasswordMode() {
    debugger;
    this.passwordMode = this.passwordMode === 'text' ? 'password' : 'text';
  }

  //==================Login Function=====================
  async onSubmit(e: Event) {
    e.preventDefault();
    const forcelogin = false;
    const { username, password } = this.formData;
    this.sharedService.triggerLoadComponent(true);

    this.authService.initializeProject().subscribe((response: any) => {
      if (response) {
        this.authService
          .logIn(username, password, forcelogin)
          .subscribe((response: any) => {
            this.sharedService.triggerLoadComponent(false);
            this.loginResponse = response;
            if (response.flag == 1) {
              this.storeSession(this.loginResponse);
              this.verify_PostOfficeCredencial_Data();
            } else if (response.flag == 2) {
              this.sharedService.triggerLoadComponent(false);
              const result = confirm(
                'You are already logged in on another device. Do you want to force the login process?',
                'Force Login'
              );

              result.then((dialogResult: boolean) => {
                if (dialogResult) {
                  const forcelogin = true;
                  this.sharedService.triggerLoadComponent(true);
                  this.authService
                    .logIn(username, password, forcelogin)
                    .subscribe((response: any) => {
                      if (response.flag == 1) {
                        this.loginResponse = response;
                        this.storeSession(this.loginResponse);

                        this.verify_PostOfficeCredencial_Data();
                      }
                    });
                } else {
                  notify(
                    {
                      message: response.message,
                      position: {
                        at: 'top right',
                        my: 'top right',
                      },
                    },
                    'error'
                  );
                }
              });
            } else {
              notify(
                {
                  message: response.message,
                  position: {
                    at: 'top right',
                    my: 'top right',
                  },
                },
                'error'
              );
            }
          });
      }
    });
  }

  storeSession(response: any) {
    sessionStorage.setItem('loginName', response.data.LoginName);
    sessionStorage.setItem('UserID', response.data.UserID);
    sessionStorage.setItem('UserPhoto', response.data.PhotoFile);
    sessionStorage.setItem('AuthToken', response.token);

    this.authService.setUserData(response.data);

    localStorage.setItem('logData', JSON.stringify(response.data));
    localStorage.setItem('Token', JSON.stringify(response.data.Token));
    localStorage.setItem('sidemenuItems', JSON.stringify(response.menus));
  }
  verify_PostOfficeCredencial_Data() {

  const flag = 1; // or 0 → you can set your own condition manually

  if (flag === 1) {
    if (this.loginResponse.data.EnableMFA === true) {
      this.router.navigateByUrl('/auth/two-step-verification');
    } else {
      this.inactive.setUserlogginValue();
      this.router.navigateByUrl('/analytics-dashboard');
    }
  } else {
    if (this.loginResponse.data.EnableMFA === true) {
      this.router.navigateByUrl('/auth/two-step-verification');
    } else {
      this.inactive.setUserlogginValue();
      this.router.navigateByUrl('/analytics-dashboard');
    }

    notify(
      {
        message: "Post office verification failed.",
        position: { at: 'top right', my: 'top right' }
      },
      'error'
    );
  }
}


  // verify_PostOfficeCredencial_Data() {
  //   this.SystemService.verify_PostOfficeCredencial().subscribe(
  //     (response: any) => {
  //       if (response.flag === 1) {
  //         if (this.loginResponse.data.EnableMFA === true) {
  //           this.router.navigateByUrl('/auth/two-step-verification');
  //         } else {
  //           this.inactive.setUserlogginValue();

  //           this.router.navigateByUrl('/analytics-dashboard');
  //         }
  //       } else {
  //         if (this.loginResponse.data.EnableMFA === true) {
  //           this.router.navigateByUrl('/auth/two-step-verification');
  //         } else {
  //           this.inactive.setUserlogginValue();

  //           this.router.navigateByUrl('/analytics-dashboard');
  //         }
  //         notify(
  //           {
  //             message: response.message,
  //             position: {
  //               at: 'top right',
  //               my: 'top right',
  //             },
  //           },
  //           'error'
  //         );
  //       }
  //     }
  //   );
  // }

  onCreateAccountClick = () => {
    this.router.navigate([this.createAccountLink]);
  };

  async ngOnInit(): Promise<void> {
    console.log();
  }
}
@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    LoginOauthModule,
    DxFormModule,
    DxLoadIndicatorModule,
    DxButtonModule,
    DxPopupModule,
    DxTextBoxModule,
    DxLoadPanelModule,
  ],
  declarations: [LoginFormComponent],
  exports: [LoginFormComponent],
})
export class LoginFormModule {}
