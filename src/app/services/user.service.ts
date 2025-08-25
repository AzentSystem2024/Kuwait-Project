import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable} from 'rxjs';

import { environment } from 'src/environments/environment';
const BASE_URL = environment.PROJECTX_API_BASE_URL;

@Injectable()
export class UserService {
  constructor(private http: HttpClient) {}
  //====================Create User========================
  getOtp(data:any):Observable<any>{
    const url = `${BASE_URL}changepassword/forpassword`;
    return this.http.post(url, data)
  }
}
