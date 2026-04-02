import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private readonly BASE_URL = 'http://localhost:3000/currency';

  constructor(private readonly http: HttpClient) {}

  getCurrencies(): Observable<any> {
    return this.http.get<any>(`${this.BASE_URL}/currencies`);
  }

  getLatest(base: string): Observable<any> {
    return this.http.get<any>(`${this.BASE_URL}/latest?base=${base}`);
  }

  getHistorical(base: string, date: string): Observable<any> {
    return this.http.get<any>(
      `${this.BASE_URL}/historical?base=${base}&date=${date}`
    );
  }
}